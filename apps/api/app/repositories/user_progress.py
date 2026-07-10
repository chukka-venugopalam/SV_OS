"""UserProgress repository — persistence operations for the ``UserProgress`` model."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select

from app.models.enums import ProgressStatus
from app.models.user_progress import UserProgress
from app.repositories.base import BaseRepository
from app.repositories.query_helpers import PageResult


class UserProgressRepository(BaseRepository[UserProgress]):
    """Repository for ``UserProgress`` persistence operations."""

    model = UserProgress

    # ── User-Centric Queries ───────────────────────────────────────

    async def find_by_user(
        self,
        user_id: UUID,
        status: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[UserProgress]:
        """Find progress records for a user, optionally filtered by status."""
        filters: dict[str, Any] = {'user_id': user_id}
        if status:
            filters['status'] = status
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='updated_at',
            sort_direction='desc',
        )

    async def find_by_user_and_node(
        self,
        user_id: UUID,
        node_id: UUID,
    ) -> UserProgress | None:
        """Find the progress record for a specific user/node pair."""
        stmt = select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.node_id == node_id,
            UserProgress.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_nodes_by_status(
        self,
        user_id: UUID,
        status: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[UserProgress]:
        """Find all nodes a user has at a particular progress status."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'user_id': user_id, 'status': status},
            sort_field='updated_at',
            sort_direction='desc',
        )

    # ── Status Transitions ─────────────────────────────────────────

    async def upsert_progress(
        self,
        user_id: UUID,
        node_id: UUID,
        status: str | None = None,
        time_spent_minutes: int | None = None,
        notes: str | None = None,
    ) -> UserProgress:
        """Create or update a progress record for a user/node pair.

        Only non-``None`` fields are applied.  If the record does not
        exist, it is created with the provided values.
        """
        existing = await self.find_by_user_and_node(user_id, node_id)
        if existing:
            update_data: dict[str, Any] = {}
            if status is not None:
                update_data['status'] = status
                # Auto-set timestamps based on status
                if status == ProgressStatus.LEARNING.value and existing.started_at is None:
                    from app.utils.date_utils import utc_now

                    update_data['started_at'] = utc_now()
                elif status == ProgressStatus.COMPLETED.value and existing.completed_at is None:
                    from app.utils.date_utils import utc_now

                    update_data['completed_at'] = utc_now()
                elif status == ProgressStatus.MASTERED.value and existing.mastered_at is None:
                    from app.utils.date_utils import utc_now

                    update_data['mastered_at'] = utc_now()
            if time_spent_minutes is not None:
                update_data['time_spent_minutes'] = (
                    existing.time_spent_minutes or 0
                ) + time_spent_minutes
            if notes is not None:
                update_data['notes'] = notes

            if update_data:
                return await self.update(existing.id, **update_data)
            return existing

        # Create new
        from app.utils.date_utils import utc_now

        create_data: dict[str, Any] = {
            'user_id': user_id,
            'node_id': node_id,
            'status': status or ProgressStatus.NOT_STARTED.value,
        }
        if status == ProgressStatus.LEARNING.value:
            create_data['started_at'] = utc_now()
        elif status == ProgressStatus.COMPLETED.value:
            create_data['completed_at'] = utc_now()
        if time_spent_minutes is not None:
            create_data['time_spent_minutes'] = time_spent_minutes
        if notes is not None:
            create_data['notes'] = notes

        return await self.create(**create_data)

    # ── Statistics ─────────────────────────────────────────────────

    async def count_by_status(self, user_id: UUID) -> dict[str, int]:
        """Count progress records for a user grouped by status."""
        stmt = (
            select(
                UserProgress.status,
                func.count().label('count'),
            )
            .where(
                UserProgress.user_id == user_id,
                UserProgress.is_deleted == False,  # noqa: E712
            )
            .group_by(UserProgress.status)
        )
        result = await self.session.execute(stmt)
        counts: dict[str, int] = {}
        for row in result.all():
            status_value = row[0].value if hasattr(row[0], 'value') else row[0]
            counts[status_value] = row[1]
        return counts

    async def total_time_for_user(self, user_id: UUID) -> int:
        """Sum total time spent across all progress records for a user."""
        stmt = select(func.coalesce(func.sum(UserProgress.time_spent_minutes), 0)).where(
            UserProgress.user_id == user_id,
            UserProgress.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def count_completed(self, user_id: UUID) -> int:
        """Count completed and mastered nodes for a user."""
        stmt = (
            select(func.count())
            .select_from(UserProgress)
            .where(
                UserProgress.user_id == user_id,
                UserProgress.status.in_(['completed', 'mastered']),
                UserProgress.is_deleted == False,  # noqa: E712
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
