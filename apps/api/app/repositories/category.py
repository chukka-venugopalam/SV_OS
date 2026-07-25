"""Category repository — canonical domain/category taxonomy persistence."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import select

from app.models.category import Category
from app.repositories.base import BaseRepository

if TYPE_CHECKING:
    from uuid import UUID


class CategoryRepository(BaseRepository[Category]):
    """Repository for ``Category`` model operations.

    Provides category-specific lookups in addition to the standard
    ``BaseRepository`` CRUD methods.
    """

    model = Category

    async def find_by_slug(self, slug: str) -> Category | None:
        """Find a category by its slug."""
        stmt = select(Category).where(
            Category.slug == slug,
            Category.is_deleted.isnot(True),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_by_display_name(self, name: str) -> Category | None:
        """Find a category by display name (case-sensitive)."""
        stmt = select(Category).where(
            Category.display_name == name,
            Category.is_deleted.isnot(True),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_children(self, parent_id: UUID) -> list[Category]:
        """Find all child categories of a given parent."""
        stmt = (
            select(Category)
            .where(
                Category.parent_id == parent_id,
                Category.is_deleted.isnot(True),
            )
            .order_by(Category.display_name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self) -> list[Category]:
        """List all categories ordered by display name."""
        stmt = (
            select(Category).where(Category.is_deleted.isnot(True)).order_by(Category.display_name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
