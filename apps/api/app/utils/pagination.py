"""Pagination utilities for list endpoints."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class PaginationParams:
    """Normalised pagination parameters extracted from query strings."""

    page: int = 1
    per_page: int = 20

    def __post_init__(self) -> None:
        """Clamp values to allowed ranges."""
        # Use object.__setattr__ because the dataclass is frozen
        if self.page < 1:
            object.__setattr__(self, 'page', 1)
        if self.per_page < 1:
            object.__setattr__(self, 'per_page', 1)
        if self.per_page > 100:
            object.__setattr__(self, 'per_page', 100)

    @property
    def skip(self) -> int:
        """Number of records to skip (for SQL OFFSET)."""
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        """Number of records to fetch (for SQL LIMIT)."""
        return self.per_page


@dataclass(frozen=True)
class Page[T]:
    """A single page of results with metadata."""

    items: list[T]
    total: int
    page: int
    per_page: int

    @property
    def total_pages(self) -> int:
        """Total number of pages."""
        return max(1, math.ceil(self.total / self.per_page)) if self.total else 1

    @property
    def has_next(self) -> bool:
        """Whether there is a next page."""
        return self.page < self.total_pages

    @property
    def has_prev(self) -> bool:
        """Whether there is a previous page."""
        return self.page > 1

    def to_dict(self) -> dict:
        """Serialise to the standard paginated response format."""
        return {
            'items': self.items,
            'total': self.total,
            'page': self.page,
            'per_page': self.per_page,
            'total_pages': self.total_pages,
        }


def paginate[T](
    items: list[T],
    total: int,
    params: PaginationParams,
) -> Page[T]:
    """Wrap a list of items and a total count into a ``Page``."""
    return Page(
        items=items,
        total=total,
        page=params.page,
        per_page=params.per_page,
    )
