"""Progress service — business logic for user progress tracking."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.user_progress import UserProgress
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class ProgressService:
    """Business logic for user progress operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_progress(self, user_id: UUID, node_id: UUID) -> UserProgress | None:
        """Get progress for a specific user/node pair."""
        return await self._uow.user_progress.find_by_user_and_node(user_id, node_id)

    async def list_user_progress(
        self,
        user_id: UUID,
        status: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[UserProgress]:
        """List progress records for a user."""
        return await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status=status,
            page=page,
            per_page=per_page,
        )

    async def update_progress(
        self,
        user_id: UUID,
        node_id: UUID,
        status: str | None = None,
        time_spent_minutes: int | None = None,
        notes: str | None = None,
    ) -> UserProgress:
        """Create or update progress for a user/node pair."""
        return await self._uow.user_progress.upsert_progress(
            user_id=user_id,
            node_id=node_id,
            status=status,
            time_spent_minutes=time_spent_minutes,
            notes=notes,
        )

    async def get_statistics(self, user_id: UUID) -> dict:
        """Get aggregated progress statistics for a user."""
        by_status = await self._uow.user_progress.count_by_status(user_id)
        total_time = await self._uow.user_progress.total_time_for_user(user_id)
        completed = await self._uow.user_progress.count_completed(user_id)

        return {
            'by_status': by_status,
            'total_time_minutes': total_time,
            'completed_nodes': completed,
        }
