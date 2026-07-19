"""Reusable query helpers for the repository layer.

Provides composable building blocks that avoid duplicated query logic
across feature repositories.  All helpers return SQLAlchemy statement
modifiers (``where`` clauses, ``order_by`` expressions, etc.) rather
than executing queries.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, TypeVar

from sqlalchemy import ColumnElement, Select, UnaryExpression, and_, desc, func, select
from sqlalchemy.orm import DeclarativeBase

from app.repositories.errors import QueryError

ModelT = TypeVar('ModelT', bound=DeclarativeBase)

# ── Sort Direction ─────────────────────────────────────────────────


class SortDirection:
    """Sort direction constants."""

    ASC = 'asc'
    DESC = 'desc'


# ── Page / Cursor Result Types ─────────────────────────────────────


@dataclass
class PageResult[ModelT: DeclarativeBase]:
    """A page of results with total count metadata."""

    items: list[ModelT]
    total: int
    page: int
    per_page: int

    @property
    def total_pages(self) -> int:
        return max(1, math.ceil(self.total / self.per_page)) if self.total else 1

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        return self.page > 1


@dataclass
class CursorPageResult[ModelT: DeclarativeBase]:
    """A cursor-based page of results."""

    items: list[ModelT]
    cursor: str | None = None
    has_more: bool = False


# ── Filter Operators ───────────────────────────────────────────────


@dataclass
class FilterCondition:
    """A single filter condition with operator."""

    field: str
    value: Any
    operator: str = 'eq'  # eq, neq, gt, gte, lt, lte, in, not_in, like, ilike, contains, is_null


FILTER_OPERATOR_MAP: dict[str, str] = {
    'eq': '__eq__',
    'neq': '__ne__',
    'gt': '__gt__',
    'gte': '__ge__',
    'lt': '__lt__',
    'lte': '__le__',
    'in': 'in_',
    'not_in': 'not_in',
    'like': 'like',
    'ilike': 'ilike',
}


# ── Query Builder ──────────────────────────────────────────────────


class QueryBuilder[ModelT: DeclarativeBase]:
    """Fluent builder for constructing SQLAlchemy SELECT queries.

    Usage::

        query = QueryBuilder(User).filter_by(is_active=True).sort('created_at', 'desc')
        stmt = query.build()
        result = await session.execute(stmt)
    """

    def __init__(self, model: type[ModelT]) -> None:
        self.model = model
        self._filters: list[ColumnElement[bool]] = []
        self._order_by: list[UnaryExpression] = []
        self._limit: int | None = None
        self._offset: int | None = None
        self._search_vector_column: str | None = None

    def filter(self, condition: ColumnElement[bool]) -> QueryBuilder[ModelT]:
        """Add a raw SQLAlchemy filter condition."""
        self._filters.append(condition)
        return self

    def filter_by(self, **kwargs: Any) -> QueryBuilder[ModelT]:
        """Add equality filters (``field=value``)."""
        for field, value in kwargs.items():
            column = getattr(self.model, field, None)
            if column is not None:
                self._filters.append(column == value)
        return self

    def filter_condition(self, condition: FilterCondition) -> QueryBuilder[ModelT]:
        """Apply a single ``FilterCondition`` with the specified operator."""
        column = getattr(self.model, condition.field, None)
        if column is None:
            msg = f'Unknown filter field: {condition.field}'
            raise QueryError(msg)

        op = condition.operator
        if op == 'eq':
            expr = column == condition.value
        elif op == 'neq':
            expr = column != condition.value
        elif op == 'gt':
            expr = column > condition.value
        elif op == 'gte':
            expr = column >= condition.value
        elif op == 'lt':
            expr = column < condition.value
        elif op == 'lte':
            expr = column <= condition.value
        elif op == 'in':
            expr = column.in_(condition.value)
        elif op == 'not_in':
            expr = column.notin_(condition.value)
        elif op == 'like':
            expr = column.like(condition.value)
        elif op == 'ilike':
            expr = column.ilike(condition.value)
        elif op == 'contains':
            expr = column.contains(condition.value)
        elif op == 'is_null':
            expr = column.is_(None) if condition.value else column.isnot(None)
        else:
            msg = f'Unsupported filter operator: {op}'
            raise QueryError(msg)

        self._filters.append(expr)
        return self

    def apply_filters(self, conditions: list[FilterCondition]) -> QueryBuilder[ModelT]:
        """Apply multiple filter conditions."""
        for condition in conditions:
            self.filter_condition(condition)
        return self

    def sort(self, field: str, direction: str = SortDirection.ASC) -> QueryBuilder[ModelT]:
        """Add an ORDER BY clause."""
        column = getattr(self.model, field, None)
        if column is None:
            msg = f'Unknown sort field: {field}'
            raise QueryError(msg)
        order_expr: UnaryExpression = (
            desc(column) if direction == SortDirection.DESC else column.asc()
        )  # type: ignore[assignment]
        self._order_by.append(order_expr)
        return self

    def sort_multi(self, sorts: list[tuple[str, str]]) -> QueryBuilder[ModelT]:
        """Apply multiple sort criteria."""
        for field, direction in sorts:
            self.sort(field, direction)
        return self

    def limit(self, limit: int) -> QueryBuilder[ModelT]:
        """Set the maximum number of rows to return."""
        self._limit = limit
        return self

    def offset(self, offset: int) -> QueryBuilder[ModelT]:
        """Set the number of rows to skip."""
        self._offset = offset
        return self

    def paginate(self, page: int = 1, per_page: int = 20) -> QueryBuilder[ModelT]:
        """Apply offset/limit for page-based pagination."""
        self._limit = per_page
        self._offset = (page - 1) * per_page
        return self

    def active(self) -> QueryBuilder[ModelT]:
        """Filter for non-deleted records (soft-delete)."""
        if hasattr(self.model, 'is_deleted'):
            self._filters.append(not self.model.is_deleted)
        return self

    def build(self) -> Select:
        """Build the final ``Select`` statement."""
        stmt = select(self.model)
        if self._filters:
            stmt = stmt.where(and_(*self._filters))
        if self._order_by:
            stmt = stmt.order_by(*self._order_by)
        if self._offset is not None:
            stmt = stmt.offset(self._offset)
        if self._limit is not None:
            stmt = stmt.limit(self._limit)
        return stmt

    def build_count(self) -> Select:
        """Build a ``SELECT count(*)`` statement with the same filters."""
        stmt = select(func.count()).select_from(self.model)
        if self._filters:
            stmt = stmt.where(and_(*self._filters))
        return stmt


# ── Helper Functions ───────────────────────────────────────────────


def build_pagination_query[ModelT: DeclarativeBase](
    model: type[ModelT],
    filters: dict[str, Any] | None = None,
    sort_field: str | None = None,
    sort_direction: str = SortDirection.ASC,
    page: int = 1,
    per_page: int = 20,
) -> tuple[Select, Select]:
    """Build a paginated query and its count query.

    Returns a tuple of ``(page_query, count_query)``.
    """
    builder = QueryBuilder(model).active()

    if filters:
        for field, value in filters.items():
            if value is not None:
                builder.filter(getattr(model, field) == value)

    if sort_field:
        builder.sort(sort_field, sort_direction)

    builder.paginate(page, per_page)

    return builder.build(), builder.build_count()


async def paginate_query[ModelT: DeclarativeBase](
    model: type[ModelT],
    filters: dict[str, Any] | None = None,
    sort_field: str | None = None,
    sort_direction: str = SortDirection.ASC,
    page: int = 1,
    per_page: int = 20,
) -> tuple[Select, Select]:
    """Convenience wrapper — same signature as ``build_pagination_query``."""
    return build_pagination_query(model, filters, sort_field, sort_direction, page, per_page)
