"""User service — profile management, settings, and user operations.

Business logic for user profiles lives here.  Authentication-specific
logic (login, register, tokens) is in ``auth.py``.
"""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.user import User
from app.repositories import UnitOfWork
from app.repositories.errors import DuplicateEntityError, EntityNotFoundError

logger = get_logger(__name__)


class UserService:
    """Handles user profile operations.

    Composes repository operations through the Unit of Work.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_profile(self, user_id: UUID) -> User:
        """Get a user's full profile.

        Raises ``EntityNotFoundError`` if the user does not exist.
        """
        user = await self._uow.users.get_by_id(user_id)
        if not user:
            raise EntityNotFoundError('User', user_id)
        return user

    async def get_public_profile(self, username: str) -> User:
        """Get a user's public profile by username."""
        user = await self._uow.users.find_by_username(username)
        if not user:
            raise EntityNotFoundError('User', username)
        return user

    async def update_profile(
        self,
        user_id: UUID,
        display_name: str | None = None,
        avatar_url: str | None = None,
        bio: str | None = None,
        preferences: dict | None = None,
    ) -> User:
        """Update a user's profile fields.

        Only non-``None`` fields are applied.  Returns the updated user.
        """
        update_data: dict = {}
        if display_name is not None:
            update_data['display_name'] = display_name
        if avatar_url is not None:
            update_data['avatar_url'] = avatar_url
        if bio is not None:
            update_data['bio'] = bio
        if preferences is not None:
            update_data['preferences'] = preferences

        if not update_data:
            return await self.get_profile(user_id)

        user = await self._uow.users.update(user_id, **update_data)
        logger.info('profile_updated', user_id=str(user_id))
        return user

    async def get_dashboard(self, user_id: UUID) -> dict:
        """Get dashboard summary data for a user.

        Returns aggregated statistics: total progress, bookmarks,
        completed nodes, learning time, etc.
        """
        # Progress statistics
        progress_stats = await self._uow.user_progress.count_by_status(user_id)
        total_time = await self._uow.user_progress.total_time_for_user(user_id)
        completed = await self._uow.user_progress.count_completed(user_id)

        # Bookmarks count
        bookmarks_count = await self._uow.bookmarks.count_by_user(user_id)

        # Active recommendations
        recommendations_count = await self._uow.recommendations.count_active(user_id)

        # Recent activity (last 10 progress updates)
        recent_progress = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            page=1,
            per_page=10,
        )

        # Learning time stats
        learning_time = await self._uow.learning_sessions.total_time_for_user(user_id)

        return {
            'progress_by_status': progress_stats,
            'total_time_minutes': total_time,
            'completed_nodes': completed,
            'bookmarks_count': bookmarks_count,
            'recommendations_count': recommendations_count,
            'recent_progress': recent_progress.items if recent_progress else [],
            'learning_time_minutes': learning_time,
        }
