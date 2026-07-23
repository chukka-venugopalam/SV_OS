"""Recommendation repository — persistence operations for the ``Recommendation`` model."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import func, select

from app.models.recommendation import Recommendation
from app.repositories.base import BaseRepository

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class RecommendationRepository(BaseRepository[Recommendation]):
    """Repository for ``Recommendation`` persistence operations."""

    model = Recommendation

    # ── User-Centric Queries ───────────────────────────────────────

    async def find_by_user(
        self,
        user_id: UUID,
        recommendation_type: str | None = None,
        include_dismissed: bool = False,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Recommendation]:
        """Find recommendations for a user.

        By default, excludes dismissed recommendations.
        """
        filters: dict[str, Any] = {'user_id': user_id}
        if recommendation_type:
            filters['recommendation_type'] = recommendation_type
        if not include_dismissed:
            filters['is_dismissed'] = False
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='score',
            sort_direction='desc',
        )

    async def find_active_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Recommendation]:
        """Find active (non-dismissed) recommendations for a user."""
        return await self.find_by_user(
            user_id=user_id,
            include_dismissed=False,
            page=page,
            per_page=per_page,
        )

    async def find_by_type(
        self,
        user_id: UUID,
        recommendation_type: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Recommendation]:
        """Find recommendations of a specific type for a user."""
        return await self.find_by_user(
            user_id=user_id,
            recommendation_type=recommendation_type,
            page=page,
            per_page=per_page,
        )

    # ── Dismissal ──────────────────────────────────────────────────

    async def dismiss(self, recommendation_id: UUID) -> Recommendation:
        """Dismiss a recommendation (soft-delete)."""
        return await self.update(
            recommendation_id,
            is_dismissed=True,
        )

    async def dismiss_all_for_user(self, user_id: UUID) -> int:
        """Dismiss all active recommendations for a user.

        Returns the number of recommendations dismissed.
        """
        recommendations = await self.find_by(
            conditions=[
                type('FC', (), {'field': 'user_id', 'value': user_id, 'operator': 'eq'})(),
                type('FC', (), {'field': 'is_dismissed', 'value': False, 'operator': 'eq'})(),
            ],
            include_deleted=False,
        )
        for rec in recommendations:
            rec.is_dismissed = True
        await self.session.flush()
        return len(recommendations)

    # ── Statistics ─────────────────────────────────────────────────

    async def count_by_type(self, user_id: UUID) -> list[dict[str, Any]]:
        """Count recommendations for a user grouped by type."""
        stmt = (
            select(
                Recommendation.recommendation_type,
                func.count().label('count'),
            )
            .where(
                Recommendation.user_id == user_id,
                Recommendation.is_dismissed.isnot(True),
                Recommendation.is_deleted.isnot(True),
            )
            .group_by(Recommendation.recommendation_type)
        )
        result = await self.session.execute(stmt)
        return [
            {
                'recommendation_type': row[0].value if hasattr(row[0], 'value') else row[0],
                'count': row[1],
            }
            for row in result.all()
        ]

    async def count_active(self, user_id: UUID) -> int:
        """Count active (non-dismissed) recommendations for a user."""
        return await self.count(filters={'user_id': user_id, 'is_dismissed': False})
