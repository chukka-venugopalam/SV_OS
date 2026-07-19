"""User service — profile management, settings, and user operations.

Business logic for user profiles lives here.  Authentication-specific
logic (login, register, tokens) is in ``auth.py``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

from app.repositories.errors import EntityNotFoundError

if TYPE_CHECKING:
    from uuid import UUID

    from app.models.user import User
    from app.repositories import UnitOfWork

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
            msg = 'User'
            raise EntityNotFoundError(msg, user_id)
        return user

    async def get_public_profile(self, username: str) -> User:
        """Get a user's public profile by username."""
        user = await self._uow.users.find_by_username(username)
        if not user:
            msg = 'User'
            raise EntityNotFoundError(msg, username)
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
        """Get dashboard summary data for a user with "Continue Learning" support.

        Returns enriched progress statistics with node details so the
        frontend can display "Continue Learning" cards without additional
        API calls.  Includes:
        - Progress statistics
        - In-progress items with node titles, slugs, difficulty
        - Recent activity with node metadata
        - Bookmark and recommendation counts
        - Learning time stats
        """
        # Progress statistics
        progress_stats = await self._uow.user_progress.count_by_status(user_id)
        total_time = await self._uow.user_progress.total_time_for_user(user_id)
        completed = await self._uow.user_progress.count_completed(user_id)

        # Bookmarks count
        bookmarks_count = await self._uow.bookmarks.count_by_user(user_id)

        # Active recommendations
        recommendations_count = await self._uow.recommendations.count_active(user_id)

        # In-progress items with node enrichment (for "Continue Learning")
        in_progress = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status='learning',
            page=1,
            per_page=10,
        )

        # Enrich in-progress items with node data
        node_ids = [p.node_id for p in in_progress.items if p]
        nodes = await self._uow.knowledge_nodes.get_many(node_ids)
        node_map = {n.id: n for n in nodes}

        enriched_progress = []
        for p in in_progress.items:
            if not p:
                continue
            node = node_map.get(p.node_id)
            enriched_progress.append(
                {
                    'node_id': str(p.node_id),
                    'node_slug': node.slug if node else None,
                    'node_title': node.title if node else None,
                    'node_type': node.node_type.value
                    if node and hasattr(node.node_type, 'value')
                    else None,
                    'difficulty': node.difficulty.value
                    if node and hasattr(node.difficulty, 'value')
                    else None,
                    'estimated_minutes': node.estimated_minutes if node else None,
                    'status': p.status.value if hasattr(p.status, 'value') else p.status,
                    'time_spent_minutes': p.time_spent_minutes,
                    'updated_at': p.updated_at.isoformat() if p.updated_at else None,
                },
            )

        # Recent activity (last 10 progress records)
        recent_progress = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            page=1,
            per_page=10,
        )

        # Enrich recent activity with node data
        recent_node_ids = [p.node_id for p in recent_progress.items if p]
        recent_nodes = await self._uow.knowledge_nodes.get_many(recent_node_ids)
        recent_node_map = {n.id: n for n in recent_nodes}

        enriched_recent = []
        for p in recent_progress.items:
            if not p:
                continue
            node = recent_node_map.get(p.node_id)
            enriched_recent.append(
                {
                    'node_slug': node.slug if node else None,
                    'node_title': node.title if node else None,
                    'status': p.status.value if hasattr(p.status, 'value') else p.status,
                    'node_type': node.node_type.value
                    if node and hasattr(node.node_type, 'value')
                    else None,
                    'difficulty': node.difficulty.value
                    if node and hasattr(node.difficulty, 'value')
                    else None,
                    'updated_at': p.updated_at.isoformat() if p.updated_at else None,
                },
            )

        # Learning time stats
        learning_time = await self._uow.learning_sessions.total_time_for_user(user_id)

        # Total nodes for completion context
        total_nodes = await self._uow.knowledge_nodes.count()

        return {
            'progress_by_status': progress_stats,
            'total_time_minutes': total_time,
            'completed_nodes': completed,
            'total_nodes': total_nodes,
            'bookmarks_count': bookmarks_count,
            'recommendations_count': recommendations_count,
            'learning_time_minutes': learning_time,
            # "Continue Learning" data — enriched with node details
            'in_progress': enriched_progress,
            'recent_activity': enriched_recent,
        }
