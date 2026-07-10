"""Base repository class for database access.

All entity-specific repositories inherit from ``BaseRepository[T]``.
Subclasses **must** define a ``model`` class attribute pointing to
the SQLAlchemy model class::

    class NodeRepository(BaseRepository[KnowledgeNode]):
        model = KnowledgeNode

        async def find_by_slug(self, slug: str) -> KnowledgeNode | None:
            ...
"""

from __future__ import annotations

from typing import Any, TypeVar
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base
from app.repositories.errors import (
    ConcurrentModificationError,
    DuplicateEntityError,
    EntityNotFoundError,
    RepositoryError,
)
from app.repositories.query_helpers import (
    CursorPageResult,
    FilterCondition,
    PageResult,
    QueryBuilder,
    SortDirection,
)

ModelT = TypeVar('ModelT', bound=Base)


class BaseRepository[ModelT: Base]:
    """Generic repository providing common database operations.

    Subclasses must set ``model`` to the SQLAlchemy model class.

    All public methods filter out soft-deleted records by default
    (``is_deleted = False``), unless the method name includes
    ``_including_deleted``.
    """

    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── Query Builder ──────────────────────────────────────────────

    def _query(self) -> QueryBuilder[ModelT]:
        """Return a fresh ``QueryBuilder`` for the repository's model."""
        return QueryBuilder(self.model)

    def _active_filter(self) -> Any:
        """Return the soft-delete filter expression, if applicable."""
        if hasattr(self.model, 'is_deleted'):
            return self.model.is_deleted == False  # noqa: E712
        return None

    def _apply_active_filter(self, stmt: Select) -> Select:
        """Apply the soft-delete filter to a statement."""
        active = self._active_filter()
        if active is not None:
            stmt = stmt.where(active)
        return stmt

    # ── Read Operations ────────────────────────────────────────────

    async def get_by_id(self, id: UUID) -> ModelT | None:
        """Fetch a single record by primary key (active records only).

        Uses an explicit SELECT with a WHERE clause instead of
        ``session.get()`` to avoid returning stale data from the
        identity map and to ensure the soft-delete filter is applied
        at the database level.
        """
        stmt = select(self.model).where(self.model.id == id)
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_including_deleted(self, id: UUID) -> ModelT | None:
        """Fetch a single record by primary key, including soft-deleted.

        Uses an explicit SELECT to avoid identity-map staleness.
        Does NOT apply the soft-delete filter.
        """
        stmt = select(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_many(self, ids: list[UUID]) -> list[ModelT]:
        """Fetch multiple records by their primary keys (active only)."""
        if not ids:
            return []
        stmt = select(self.model).where(self.model.id.in_(ids))
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_field(self, field: str, value: Any) -> ModelT | None:
        """Fetch a single record by an arbitrary field (active only).

        Returns ``None`` if no record matches or if multiple match.
        """
        column = getattr(self.model, field, None)
        if column is None:
            raise RepositoryError(f'Unknown field: {field} on {self.model.__name__}')

        stmt = select(self.model).where(column == value)
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: dict[str, Any] | None = None,
        sort_field: str | None = None,
        sort_direction: str = SortDirection.ASC,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[ModelT]:
        """Fetch all matching records with optional filtering and sorting.

        Supports flat equality filters only.  Use ``find_by`` for more
        complex queries.
        """
        builder = self._query().active()
        if filters:
            for field, value in filters.items():
                if value is not None:
                    builder.filter(getattr(self.model, field) == value)
        if sort_field:
            builder.sort(sort_field, sort_direction)
        if limit is not None:
            builder.limit(limit)
        if offset is not None:
            builder.offset(offset)

        result = await self.session.execute(builder.build())
        return list(result.scalars().all())

    async def find_by(
        self,
        conditions: list[FilterCondition] | None = None,
        sorts: list[tuple[str, str]] | None = None,
        limit: int | None = None,
        offset: int | None = None,
        include_deleted: bool = False,
    ) -> list[ModelT]:
        """Find records using structured filter conditions.

        Args:
            conditions: List of ``FilterCondition`` objects.
            sorts: List of ``(field, direction)`` tuples.
            limit: Maximum records to return.
            offset: Records to skip.
            include_deleted: If True, includes soft-deleted records.

        Returns:
            List of matching model instances.
        """
        builder = self._query()
        if not include_deleted:
            builder.active()
        if conditions:
            builder.apply_filters(conditions)
        if sorts:
            builder.sort_multi(sorts)
        if limit is not None:
            builder.limit(limit)
        if offset is not None:
            builder.offset(offset)

        result = await self.session.execute(builder.build())
        return list(result.scalars().all())

    # ── Existence Checks ───────────────────────────────────────────

    async def exists(self, **filters: Any) -> bool:
        """Check whether at least one active record matches the given filters."""
        builder = self._query().active()
        for field, value in filters.items():
            builder.filter(getattr(self.model, field) == value)
        stmt = builder.limit(1).build()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def exists_by_id(self, id: UUID) -> bool:
        """Check whether an active record with the given ID exists.

        Uses an explicit SELECT with soft-delete filter to avoid
        identity-map staleness.
        """
        stmt = select(self.model).where(self.model.id == id)
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    # ── Count Operations ───────────────────────────────────────────

    async def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count active records, optionally filtered by equality conditions."""
        builder = self._query().active()
        if filters:
            for field, value in filters.items():
                if value is not None:
                    builder.filter(getattr(self.model, field) == value)
        result = await self.session.execute(builder.build_count())
        return result.scalar() or 0

    async def count_all(self) -> int:
        """Count all records including soft-deleted."""
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    # ── Create Operations ──────────────────────────────────────────

    async def create(self, **data: Any) -> ModelT:
        """Create a new record and return it.

        Raises ``DuplicateEntityError`` on integrity constraint
        violations involving unique columns.

        Note: The UnitOfWork (not this repository) owns the transaction.
        This method only flushes — commit/rollback is handled by the UoW.
        """
        instance = self.model(**data)
        self.session.add(instance)
        try:
            await self.session.flush()
            await self.session.refresh(instance)
        except Exception as exc:
            self._raise_on_duplicate(exc, data)
            raise RepositoryError(
                message=f'Failed to create {self.model.__name__}: {exc}',
                detail={'original_error': str(exc), 'data': self._sanitize_data(data)},
            ) from exc
        return instance

    async def create_many(self, items: list[dict[str, Any]]) -> list[ModelT]:
        """Create multiple records in bulk.

        Returns the list of created instances (after flush).
        """
        instances = [self.model(**data) for data in items]
        self.session.add_all(instances)
        try:
            await self.session.flush()
            for instance in instances:
                await self.session.refresh(instance)
        except Exception as exc:
            raise RepositoryError(
                message=f'Failed to create multiple {self.model.__name__} records: {exc}',
                detail={'original_error': str(exc), 'count': len(items)},
            ) from exc
        return instances

    # ── Update Operations ──────────────────────────────────────────

    async def update(self, id: UUID, **data: Any) -> ModelT:
        """Update a record by primary key and return it.

        Raises ``EntityNotFoundError`` if no record with that ID exists.
        Raises ``ConcurrentModificationError`` if a version conflict is
        detected.
        """
        instance = await self.get_by_id_including_deleted(id)
        if not instance:
            raise EntityNotFoundError(self.model.__name__, id)

        if self._is_deleted(instance):
            raise EntityNotFoundError(self.model.__name__, id)

        # Optimistic locking check
        if 'version' in data and hasattr(instance, 'version'):
            expected_version = data.pop('version', None)
            if expected_version is not None and instance.version != expected_version:
                raise ConcurrentModificationError(
                    self.model.__name__,
                    id,
                    expected_version=expected_version,
                )
            data['version'] = getattr(instance, 'version', 0) + 1

        for key, value in data.items():
            setattr(instance, key, value)

        try:
            await self.session.flush()
            await self.session.refresh(instance)
        except Exception as exc:
            self._raise_on_duplicate(exc, data, _operation='update')
            raise RepositoryError(
                message=f'Failed to update {self.model.__name__} id={id}: {exc}',
                detail={'original_error': str(exc), 'data': self._sanitize_data(data)},
            ) from exc
        return instance

    async def upsert(self, constraints: dict[str, Any], data: dict[str, Any]) -> ModelT:
        """Create or update a record based on unique constraint fields.

        Tries to find an existing record by ``constraints``.  If found,
        updates it with ``data``.  Otherwise, creates a new record with
        ``constraints + data``.
        """
        existing = await self.get_by_field(
            field=next(iter(constraints.keys())),
            value=next(iter(constraints.values())),
        )
        if existing:
            return await self.update(existing.id, **data)
        return await self.create(**{**constraints, **data})

    # ── Delete Operations ──────────────────────────────────────────

    async def delete(self, id: UUID, hard: bool = False) -> None:
        """Delete a record by primary key.

        Args:
            id: The primary key of the record to delete.
            hard: If True, performs a hard (permanent) delete.
                  If False (default), performs a soft delete by setting
                  ``is_deleted = True``.

        Raises ``EntityNotFoundError`` if the record does not exist.
        """
        instance = await self.get_by_id_including_deleted(id)
        if not instance:
            raise EntityNotFoundError(self.model.__name__, id)

        if hard:
            await self.session.delete(instance)
        else:
            if hasattr(instance, 'is_deleted'):
                instance.is_deleted = True
            else:
                await self.session.delete(instance)

        try:
            await self.session.flush()
        except Exception as exc:
            raise RepositoryError(
                message=f'Failed to delete {self.model.__name__} id={id}: {exc}',
                detail={'original_error': str(exc), 'hard': hard},
            ) from exc

    async def delete_many(self, ids: list[UUID], hard: bool = False) -> int:
        """Delete multiple records by their primary keys.

        Returns the number of records deleted.
        """
        if not ids:
            return 0

        if hard or not hasattr(self.model, 'is_deleted'):
            stmt = select(self.model).where(self.model.id.in_(ids))
            result = await self.session.execute(stmt)
            instances = list(result.scalars().all())
            for instance in instances:
                await self.session.delete(instance)
        else:
            stmt = (
                select(self.model)
                .where(self.model.id.in_(ids))
                .where(self.model.is_deleted == False)  # noqa: E712
            )
            result = await self.session.execute(stmt)
            instances = list(result.scalars().all())
            for instance in instances:
                instance.is_deleted = True

        try:
            await self.session.flush()
        except Exception as exc:
            raise RepositoryError(
                message=f'Failed to delete multiple {self.model.__name__} records: {exc}',
                detail={'original_error': str(exc), 'ids': [str(i) for i in ids], 'hard': hard},
            ) from exc
        return len(instances)

    async def restore(self, id: UUID) -> ModelT:
        """Restore a soft-deleted record by setting ``is_deleted = False``.

        Raises ``EntityNotFoundError`` if the record does not exist
        or is not soft-deleted.
        """
        instance = await self.session.get(self.model, id)
        if not instance:
            raise EntityNotFoundError(self.model.__name__, id)

        if hasattr(instance, 'is_deleted'):
            if not instance.is_deleted:
                raise RepositoryError(
                    message=f'{self.model.__name__} id={id} is not deleted',
                    detail={'entity_name': self.model.__name__, 'entity_id': str(id)},
                )
            instance.is_deleted = False

        try:
            await self.session.flush()
            await self.session.refresh(instance)
        except Exception as exc:
            raise RepositoryError(
                message=f'Failed to restore {self.model.__name__} id={id}: {exc}',
                detail={'original_error': str(exc)},
            ) from exc
        return instance

    # ── Pagination ─────────────────────────────────────────────────

    async def paginate(
        self,
        page: int = 1,
        per_page: int = 20,
        filters: dict[str, Any] | None = None,
        sort_field: str | None = None,
        sort_direction: str = SortDirection.ASC,
    ) -> PageResult[ModelT]:
        """Fetch a paginated list of active records with total count.

        Args:
            page: Page number (1-indexed).
            per_page: Items per page (max 100).
            filters: Flat equality filters.
            sort_field: Field to sort by.
            sort_direction: Sort direction ('asc' or 'desc').

        Returns:
            ``PageResult`` with items, total, page, per_page metadata.
        """
        per_page = min(max(per_page, 1), 100)
        page = max(page, 1)

        builder = self._query().active()
        if filters:
            for field, value in filters.items():
                if value is not None:
                    builder.filter(getattr(self.model, field) == value)
        if sort_field:
            builder.sort(sort_field, sort_direction)
        builder.paginate(page, per_page)

        # Count
        count_result = await self.session.execute(builder.build_count())
        total: int = count_result.scalar() or 0

        # Page
        result = await self.session.execute(builder.build())
        items = list(result.scalars().all())

        return PageResult(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
        )

    async def paginate_cursor(
        self,
        cursor_field: str = 'id',
        cursor_value: Any | None = None,
        limit: int = 20,
        filters: dict[str, Any] | None = None,
        sort_direction: str = SortDirection.ASC,
    ) -> CursorPageResult[ModelT]:
        """Fetch a cursor-based page of records.

        Args:
            cursor_field: The field to use for cursor positioning.
                          Must be a unique, ordered field.
            cursor_value: The value of the cursor field on the last
                          item of the previous page.  ``None`` for the
                          first page.
            limit: Maximum items to return.
            filters: Flat equality filters.
            sort_direction: Sort direction ('asc' or 'desc').

        Returns:
            ``CursorPageResult`` with items and a cursor for the next page.
        """
        limit = min(max(limit, 1), 100)
        cursor_column = getattr(self.model, cursor_field, None)
        if cursor_column is None:
            raise RepositoryError(f'Unknown cursor field: {cursor_field} on {self.model.__name__}')

        builder = self._query().active()
        if filters:
            for field, value in filters.items():
                if value is not None:
                    builder.filter(getattr(self.model, field) == value)

        if cursor_value is not None:
            if sort_direction == SortDirection.ASC:
                builder.filter(cursor_column > cursor_value)
            else:
                builder.filter(cursor_column < cursor_value)

        builder.sort(cursor_field, sort_direction)
        builder.limit(limit + 1)  # Fetch one extra to detect has_more

        result = await self.session.execute(builder.build())
        rows = list(result.scalars().all())

        has_more = len(rows) > limit
        items = rows[:limit]
        next_cursor: str | None = None
        if has_more and items:
            last = items[-1]
            next_cursor = str(getattr(last, cursor_field))

        return CursorPageResult(items=items, cursor=next_cursor, has_more=has_more)

    # ── Search ─────────────────────────────────────────────────────

    async def search(
        self,
        query: str,
        fields: list[str] | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[ModelT]:
        """Basic text search across specified fields using ILIKE.

        For full-text search (PostgreSQL TSVECTOR), use
        ``search_fulltext`` instead.

        Args:
            query: The search string.
            fields: List of column names to search across.  Defaults to
                    common text fields (title, name, description) if the
                    model has them.
            page: Page number (1-indexed).
            per_page: Items per page.

        Returns:
            ``PageResult`` with matching items.
        """
        if not query:
            return await self.paginate(page=page, per_page=per_page)

        if fields is None:
            fields = self._guess_search_fields()

        search_conditions = []
        for field in fields:
            column = getattr(self.model, field, None)
            if column is not None:
                search_conditions.append(column.ilike(f'%{query}%'))

        if not search_conditions:
            return await self.paginate(page=page, per_page=per_page)

        per_page = min(max(per_page, 1), 100)
        page = max(page, 1)

        builder = self._query().active()
        builder.filter(or_(*search_conditions))
        builder.paginate(page, per_page)

        count_result = await self.session.execute(builder.build_count())
        total: int = count_result.scalar() or 0

        result = await self.session.execute(builder.build())
        items = list(result.scalars().all())

        return PageResult(items=items, total=total, page=page, per_page=per_page)

    async def search_fulltext(
        self,
        query: str,
        search_vector_column: str = 'search_vector',
        rank: bool = True,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[ModelT]:
        """Full-text search using PostgreSQL TSVECTOR.

        Args:
            query: The plain-text search query (will be converted to a
                   tsquery via ``plainto_tsquery``).
            search_vector_column: Name of the TSVECTOR column.
            rank: If True (default), orders results by relevance.
            page: Page number (1-indexed).
            per_page: Items per page.

        Returns:
            ``PageResult`` with matching items ordered by relevance
            (if ``rank=True``).
        """
        if not query:
            return await self.paginate(page=page, per_page=per_page)

        vector_col = getattr(self.model, search_vector_column, None)
        if vector_col is None:
            raise RepositoryError(
                f'Model {self.model.__name__} has no column named {search_vector_column}',
            )

        tsquery = func.plainto_tsquery('english', query)
        search_filter = vector_col.op('@@')(tsquery)

        per_page = min(max(per_page, 1), 100)
        page = max(page, 1)

        builder = self._query().active()
        builder.filter(search_filter)

        if rank:
            rank_expr = func.ts_rank(vector_col, tsquery)
            builder.sort(rank_expr, SortDirection.DESC)

        builder.paginate(page, per_page)

        count_result = await self.session.execute(builder.build_count())
        total: int = count_result.scalar() or 0

        result = await self.session.execute(builder.build())
        items = list(result.scalars().all())

        return PageResult(items=items, total=total, page=page, per_page=per_page)

    # ── Batch Loading ──────────────────────────────────────────────

    async def load_related(
        self,
        instances: list[ModelT],
        relation_name: str,
    ) -> list[ModelT]:
        """Eagerly load a relationship on a list of instances.

        Uses ``selectinload`` to batch-load the relationship for all
        provided instances in a single query.

        Args:
            instances: The parent instances.
            relation_name: The name of the relationship attribute to load.

        Returns:
            The same instances with the relationship populated.
        """
        from sqlalchemy.orm import selectinload

        if not instances:
            return instances

        ids = [i.id for i in instances]
        relation = getattr(self.model, relation_name, None)
        if relation is None:
            raise RepositoryError(
                f'Model {self.model.__name__} has no relationship named {relation_name}',
            )

        stmt = select(self.model).options(selectinload(relation)).where(self.model.id.in_(ids))
        result = await self.session.execute(stmt)
        _ = list(result.scalars().all())  # Triggers eager loading

        return instances

    # ── Internal Helpers ───────────────────────────────────────────

    def _is_deleted(self, instance: ModelT) -> bool:
        """Check whether a model instance is soft-deleted."""
        if hasattr(instance, 'is_deleted'):
            return bool(instance.is_deleted)
        return False

    def _guess_search_fields(self) -> list[str]:
        """Guess text-searchable fields by common naming patterns."""
        candidates = ['title', 'name', 'description', 'slug', 'content']
        return [f for f in candidates if hasattr(self.model, f)]

    def _sanitize_data(self, data: dict[str, Any]) -> dict[str, Any]:
        """Remove sensitive fields from data for error reporting."""
        sensitive = {'password', 'password_hash', 'secret', 'token', 'api_key'}
        return {k: '***' if k.lower() in sensitive else v for k, v in data.items()}

    def _raise_on_duplicate(
        self,
        exc: Exception,
        data: dict[str, Any],
        _operation: str = 'create',
    ) -> None:
        """Check if the exception is a duplicate-key violation and raise accordingly."""
        exc_str = str(exc).lower()
        if (
            'unique constraint' in exc_str
            or 'duplicate key' in exc_str
            or 'unique violation' in exc_str
        ):
            raise DuplicateEntityError(
                entity_name=self.model.__name__,
                fields=self._sanitize_data(data),
            ) from exc
        # If not a duplicate error, do nothing — caller should handle
