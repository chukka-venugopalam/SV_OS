"""Favorite repository — persistence operations for the ``Favorite`` model.

Provides user-centric queries for managing favorited knowledge nodes.
Favorites serve as explicit like/save signals for the recommendation engine.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import select

from app.models.favorite import Favorite
from app.repositories.base import BaseRepository

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class FavoriteRepository(BaseRepository[Favorite]):
    """Repository for ``Favorite`` persistence operations."""

    model = Favorite

    # ── User-Centric Queries ───────────────────────────────────────

    async def find_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Favorite]:
        """Find all favorites for a user with pagination."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'user_id': user_id},
            sort_field='created_at',
            sort_direction='desc',
        )

    async def find_by_user_and_node(
        self,
        user_id: UUID,
        node_id: UUID,
    ) -> Favorite | None:
        """Find a specific favorite by user and node."""
        stmt = select(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.node_id == node_id,
            not Favorite.is_deleted,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_by_user(self, user_id: UUID) -> int:
        """Count how many favorites a user has."""
        return await self.count(filters={'user_id': user_id})

    async def is_favorited(self, user_id: UUID, node_id: UUID) -> bool:
        """Check whether a user has favorited a specific node."""
        return await self.exists(user_id=user_id, node_id=node_id)
