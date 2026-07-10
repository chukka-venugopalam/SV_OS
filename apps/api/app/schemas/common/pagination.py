"""Pagination, sorting, and filtering DTOs.

Provides both offset-based (PageParams) and cursor-based (CursorParams)
pagination to support different query patterns:

- **Offset pagination**: Standard ``page`` + ``per_page``. Suitable for
  stable, ordered lists where pages don't change frequently (e.g. search
  results, career listings).
- **Cursor pagination**: Cursor-based for real-time feeds where new
  items are appended (e.g. activity logs, learning sessions).
"""

from __future__ import annotations

from typing import Literal, TypeVar

from pydantic import BaseModel, Field, field_validator

T = TypeVar('T')

# Type aliases
SortDirection = Literal['asc', 'desc']
"""Valid sort directions for list endpoints."""


# ── Sorting ────────────────────────────────────────────────────────


class SortParams(BaseModel):
    """Sort parameters for list endpoints.

    Usage:
        GET /nodes?sort_by=created_at&sort_direction=desc
    """

    sort_by: str = Field(
        default='created_at',
        max_length=50,
        description='Column or field name to sort by',
        examples=['created_at', 'title', 'difficulty', 'node_type'],
    )
    sort_direction: Literal['asc', 'desc'] = Field(
        default='desc',
        description='Sort direction (asc or desc)',
        examples=['asc', 'desc'],
    )

    @field_validator('sort_direction')
    @classmethod
    def validate_sort_direction(cls, v: str) -> str:
        """Ensure sort direction is valid."""
        if v.lower() not in ('asc', 'desc'):
            raise ValueError("sort_direction must be 'asc' or 'desc'")
        return v.lower()


# ── Filtering ──────────────────────────────────────────────────────


class FilterParams(BaseModel):
    """Generic filter parameters.

    Implementations should extend this with domain-specific filters::

        class NodeFilterParams(FilterParams):
            node_type: NodeType | None = None
            difficulty: Difficulty | None = None
            is_published: bool | None = None
    """

    query: str | None = Field(
        default=None,
        max_length=200,
        description='Free-text search query',
        examples=['python', 'react tutorial'],
    )


# ── Offset Pagination ──────────────────────────────────────────────


class PageParams(BaseModel):
    """Offset-based pagination request parameters.

    ``page`` is 1-indexed.  ``per_page`` is capped at 100 to prevent
    accidental large responses.
    """

    page: int = Field(
        default=1,
        ge=1,
        description='Page number (1-indexed)',
        examples=[1, 2, 3],
    )
    per_page: int = Field(
        default=20,
        ge=1,
        le=100,
        description='Items per page (max 100)',
        examples=[10, 20, 50],
    )

    @property
    def offset(self) -> int:
        """Calculate the SQL offset for this page."""
        return (self.page - 1) * self.per_page


class PageResponse[T](BaseModel):
    """Offset-based paginated response wrapper.

    Wraps a list of items with pagination metadata so clients can
    render page controls and understand the result set size.
    """

    items: list[T] = Field(description='List of items for this page')
    total: int = Field(ge=0, description='Total number of items across all pages')
    page: int = Field(ge=1, description='Current page number')
    per_page: int = Field(ge=1, le=100, description='Items per page')
    total_pages: int = Field(ge=0, description='Total number of pages')

    @field_validator('total_pages')
    @classmethod
    def compute_total_pages(cls, v: int, info) -> int:
        """Auto-compute total_pages from total and per_page if not provided."""
        if 'total' in info.data and 'per_page' in info.data:
            total = info.data['total']
            per_page = info.data['per_page']
            if per_page > 0:
                return max(0, (total + per_page - 1) // per_page)
        return v


# ── Cursor Pagination ──────────────────────────────────────────────


class CursorParams(BaseModel):
    """Cursor-based pagination request parameters.

    Cursor pagination is ideal for real-time feeds.  The client passes
    the ``cursor`` (opaque string) from the previous response to get
    the next page.  Pass ``limit`` to control page size.
    """

    cursor: str | None = Field(
        default=None,
        max_length=200,
        description='Opaque cursor from previous response (null for first page)',
        examples=[None, 'eyJpZCI6IjEyMyJ9'],
    )
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description='Maximum items to return (max 100)',
        examples=[10, 20, 50],
    )


class CursorResponse[T](BaseModel):
    """Cursor-based paginated response wrapper.

    The client passes ``next_cursor`` in the next request to fetch
    the subsequent page.  A ``None`` ``next_cursor`` means there are
    no more results.
    """

    items: list[T] = Field(description='List of items for this page')
    next_cursor: str | None = Field(
        default=None,
        description='Cursor for the next page (null if no more results)',
    )
    has_more: bool = Field(
        description='Whether there are more results after this page',
    )


# ── Convenience wrappers ───────────────────────────────────────────


class PaginatedData[T](BaseModel):
    """Union-style wrapper for paginated responses.

    Automatically selects offset or cursor pagination based on input.
    """

    items: list[T]
    total: int | None = None
    page: int | None = None
    per_page: int | None = None
    total_pages: int | None = None
    next_cursor: str | None = None
    has_more: bool | None = None

    @classmethod
    def from_page_response(cls, response: PageResponse[T]) -> PaginatedData[T]:
        """Create from offset-based pagination."""
        return cls(
            items=response.items,
            total=response.total,
            page=response.page,
            per_page=response.per_page,
            total_pages=response.total_pages,
        )

    @classmethod
    def from_cursor_response(cls, response: CursorResponse[T]) -> PaginatedData[T]:
        """Create from cursor-based pagination."""
        return cls(
            items=response.items,
            next_cursor=response.next_cursor,
            has_more=response.has_more,
        )
