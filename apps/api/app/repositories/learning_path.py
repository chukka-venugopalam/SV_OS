"""LearningPath repository — persistence operations for ``LearningPath`` and ``LearningSession`` models."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select

from app.models.learning_path import LearningPath, LearningSession
from app.repositories.base import BaseRepository
from app.repositories.query_helpers import PageResult, SortDirection


class LearningPathRepository(BaseRepository[LearningPath]):
    """Repository for ``LearningPath`` persistence operations."""

    model = LearningPath

    # ── Lookup Methods ─────────────────────────────────────────────

    async def find_by_difficulty(
        self,
        difficulty: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[LearningPath]:
        """Find learning paths by difficulty level."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'difficulty': difficulty},
            sort_field='title',
        )

    async def find_published(
        self,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[LearningPath]:
        """Find published learning paths."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'is_published': True},
            sort_field='title',
        )

    # ── Node Order Management ──────────────────────────────────────

    async def get_node_ids(self, path_id: UUID) -> list[UUID]:
        """Extract ordered node IDs from a learning path's ``node_order`` JSONB field."""
        path = await self.get_by_id(path_id)
        if not path:
            return []
        return [
            entry['node_id'] if isinstance(entry, dict) else entry
            for entry in (path.node_order or [])
        ]


class LearningSessionRepository(BaseRepository[LearningSession]):
    """Repository for ``LearningSession`` persistence operations."""

    model = LearningSession

    # ── User-Centric Queries ───────────────────────────────────────

    async def find_by_user(
        self,
        user_id: UUID,
        status: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[LearningSession]:
        """Find learning sessions for a user, optionally filtered by status."""
        filters: dict[str, Any] = {'user_id': user_id}
        if status:
            filters['status'] = status
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='started_at',
            sort_direction='desc',
        )

    async def find_by_user_and_node(
        self,
        user_id: UUID,
        node_id: UUID,
    ) -> LearningSession | None:
        """Find the most recent active session for a user on a node."""
        stmt = (
            select(LearningSession)
            .where(
                LearningSession.user_id == user_id,
                LearningSession.node_id == node_id,
                LearningSession.is_deleted == False,  # noqa: E712
            )
            .order_by(LearningSession.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_active_sessions(self, user_id: UUID) -> int:
        """Count active learning sessions for a user."""
        stmt = (
            select(func.count())
            .select_from(LearningSession)
            .where(
                LearningSession.user_id == user_id,
                LearningSession.status == 'active',
                LearningSession.is_deleted == False,  # noqa: E712
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def total_time_for_user(self, user_id: UUID) -> int:
        """Sum total learning minutes across all completed sessions for a user."""
        stmt = (
            select(func.coalesce(func.sum(LearningSession.duration_minutes), 0))
            .where(
                LearningSession.user_id == user_id,
                LearningSession.is_deleted == False,  # noqa: E712
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
