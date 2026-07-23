"""SearchHistory repository — persistence operations for the ``SearchHistory`` model."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import func, select

from app.models.search_history import SearchHistory
from app.repositories.base import BaseRepository

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class SearchHistoryRepository(BaseRepository[SearchHistory]):
    """Repository for ``SearchHistory`` persistence operations."""

    model = SearchHistory

    # ── User-Centric Queries ───────────────────────────────────────

    async def find_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[SearchHistory]:
        """Find search history for a user, most recent first."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'user_id': user_id},
            sort_field='created_at',
            sort_direction='desc',
        )

    async def find_recent_by_user(
        self,
        user_id: UUID,
        limit: int = 10,
    ) -> list[SearchHistory]:
        """Find the most recent search queries for a user."""
        return await self.get_all(
            filters={'user_id': user_id},
            sort_field='created_at',
            sort_direction='desc',
            limit=limit,
        )

    async def find_distinct_queries(
        self,
        user_id: UUID,
        query_prefix: str | None = None,
        limit: int = 10,
    ) -> list[str]:
        """Find distinct recent search queries for autocomplete suggestions."""
        stmt = (
            select(SearchHistory.query)
            .where(
                SearchHistory.user_id == user_id,
                SearchHistory.is_deleted.isnot(True),
            )
            .distinct()
            .order_by(SearchHistory.created_at.desc())
            .limit(limit)
        )
        if query_prefix:
            stmt = stmt.where(SearchHistory.query.ilike(f'{query_prefix}%'))

        result = await self.session.execute(stmt)
        return [row[0] for row in result.all()]

    # ── Trending Queries ───────────────────────────────────────────

    async def find_trending(
        self,
        limit: int = 10,
        since_days: int = 7,
    ) -> list[dict[str, Any]]:
        """Find trending search queries across all users."""
        from datetime import timedelta

        from app.utils.date_utils import utc_now

        since = utc_now() - timedelta(days=since_days)

        stmt = (
            select(
                SearchHistory.query,
                func.count().label('count'),
            )
            .where(
                SearchHistory.created_at >= since,
                SearchHistory.is_deleted.isnot(True),
            )
            .group_by(SearchHistory.query)
            .order_by(func.count().desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return [{'query': row[0], 'count': row[1]} for row in result.all()]

    # ── Cleanup ────────────────────────────────────────────────────

    async def clear_for_user(self, user_id: UUID) -> int:
        """Soft-delete all search history records for a user.

        Returns the number of records cleared.
        """
        stmt = select(SearchHistory).where(
            SearchHistory.user_id == user_id,
            SearchHistory.is_deleted.isnot(True),
        )
        result = await self.session.execute(stmt)
        records = list(result.scalars().all())
        for record in records:
            record.is_deleted = True
        await self.session.flush()
        return len(records)
