"""KnowledgeNode repository — persistence operations for the ``KnowledgeNode`` model."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import func, select

from app.models.knowledge_node import KnowledgeNode
from app.repositories.base import BaseRepository
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import FilterCondition, PageResult, SortDirection

if TYPE_CHECKING:
    from uuid import UUID


class KnowledgeNodeRepository(BaseRepository[KnowledgeNode]):
    """Repository for ``KnowledgeNode`` persistence operations.

    Provides lookup methods for the knowledge graph's central entity,
    including type-filtered queries, slug-based lookups, and searches.
    """

    model = KnowledgeNode

    # ── Slug Lookup ────────────────────────────────────────────────

    async def find_by_slug(self, slug: str, include_deleted: bool = False) -> KnowledgeNode | None:
        """Find a knowledge node by its URL-safe slug."""
        stmt = select(KnowledgeNode).where(KnowledgeNode.slug == slug)
        if not include_deleted:
            stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> KnowledgeNode:
        """Find by slug or raise ``EntityNotFoundError``."""
        node = await self.find_by_slug(slug)
        if not node:
            msg = 'KnowledgeNode'
            raise EntityNotFoundError(msg, slug)
        return node

    # ── Type-Filtered Queries ──────────────────────────────────────

    async def find_by_type(
        self,
        node_type: str,
        page: int = 1,
        per_page: int = 20,
        sort_field: str = 'title',
        sort_direction: str = SortDirection.ASC,
    ) -> PageResult[KnowledgeNode]:
        """Find nodes by their ``node_type`` with pagination."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'node_type': node_type},
            sort_field=sort_field,
            sort_direction=sort_direction,
        )

    async def find_by_difficulty(
        self,
        difficulty: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[KnowledgeNode]:
        """Find nodes by difficulty level with pagination."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'difficulty': difficulty},
            sort_field='title',
            sort_direction=SortDirection.ASC,
        )

    async def find_published(
        self,
        page: int = 1,
        per_page: int = 20,
        node_type: str | None = None,
        difficulty: str | None = None,
    ) -> PageResult[KnowledgeNode]:
        """Find published nodes with optional type/difficulty filtering."""
        filters: dict[str, Any] = {'is_published': True}
        if node_type:
            filters['node_type'] = node_type
        if difficulty:
            filters['difficulty'] = difficulty
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='title',
        )

    # ── Relationship Counts ────────────────────────────────────────

    async def count_edges(self, node_id: UUID) -> int:
        """Count total edges (incoming + outgoing) for a node."""
        from sqlalchemy import select

        from app.models.knowledge_edge import KnowledgeEdge

        outgoing = (
            select(func.count())
            .select_from(KnowledgeEdge)
            .where(KnowledgeEdge.source_node_id == node_id)
        )
        incoming = (
            select(func.count())
            .select_from(KnowledgeEdge)
            .where(KnowledgeEdge.target_node_id == node_id)
        )
        out_result = await self.session.execute(outgoing)
        in_result = await self.session.execute(incoming)
        return (out_result.scalar() or 0) + (in_result.scalar() or 0)

    async def count_resources(self, node_id: UUID) -> int:
        """Count learning resources for a node."""
        from sqlalchemy import select

        from app.models.learning_resource import LearningResource

        stmt = (
            select(func.count())
            .select_from(LearningResource)
            .where(LearningResource.node_id == node_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    # ── Popular / Trending ─────────────────────────────────────────

    async def find_popular(
        self,
        limit: int = 10,
        node_type: str | None = None,
    ) -> list[KnowledgeNode]:
        """Find the most-viewed published nodes."""
        filters: dict[str, Any] = {'is_published': True}
        if node_type:
            filters['node_type'] = node_type
        return await self.get_all(
            filters=filters,
            sort_field='view_count',
            sort_direction=SortDirection.DESC,
            limit=limit,
        )

    async def increment_view_count(self, node_id: UUID) -> None:
        """Atomically increment the view counter for a node.

        Uses an atomic SQL UPDATE to prevent lost updates from
        concurrent requests (read-modify-write race condition).
        """
        from sqlalchemy import update

        stmt = (
            update(KnowledgeNode)
            .where(KnowledgeNode.id == node_id)
            .values(view_count=KnowledgeNode.view_count + 1)
        )
        await self.session.execute(stmt)
        await self.session.flush()

    # ── Full-Text Search ───────────────────────────────────────────

    async def search_nodes(
        self,
        query: str,
        node_type: str | None = None,
        difficulty: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[KnowledgeNode]:
        """Full-text search across knowledge nodes with optional filters."""
        if not query:
            filters: dict[str, Any] = {'is_published': True}
            if node_type:
                filters['node_type'] = node_type
            if difficulty:
                filters['difficulty'] = difficulty
            return await self.paginate(page=page, per_page=per_page, filters=filters)

        tsquery = func.plainto_tsquery('english', query)
        base_filter = KnowledgeNode.search_vector.op('@@')(tsquery)

        conditions = [FilterCondition(field='is_published', value=True, operator='eq')]
        if node_type:
            conditions.append(FilterCondition(field='node_type', value=node_type, operator='eq'))
        if difficulty:
            conditions.append(FilterCondition(field='difficulty', value=difficulty, operator='eq'))

        # Build the query with full-text search relevance ordering
        builder = self._query().active().filter(base_filter)
        if conditions:
            for c in conditions:
                builder.filter_condition(c)

        # Add ts_rank ordering directly (avoids sort_multi which expects string field names)
        rank_expr = func.ts_rank(KnowledgeNode.search_vector, tsquery).desc()
        builder._order_by.append(rank_expr)

        builder.paginate(page, per_page)

        count_result = await self.session.execute(builder.build_count())
        total: int = count_result.scalar() or 0

        result = await self.session.execute(builder.build())
        items = list(result.scalars().all())

        return PageResult(items=items, total=total, page=page, per_page=per_page)

    # ── Slug Existence ─────────────────────────────────────────────

    async def slug_exists(self, slug: str, exclude_id: UUID | None = None) -> bool:
        """Check whether a slug is already in use."""
        stmt = select(KnowledgeNode).where(KnowledgeNode.slug == slug)
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        node = result.scalar_one_or_none()
        if node and exclude_id and node.id == exclude_id:
            return False
        return node is not None
