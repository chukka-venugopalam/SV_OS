"""User repository — persistence operations for the ``User`` model."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, or_, select

from app.models.user import User
from app.repositories.base import BaseRepository
from app.repositories.errors import DuplicateEntityError, EntityNotFoundError
from app.repositories.query_helpers import PageResult, SortDirection


class UserRepository(BaseRepository[User]):
    """Repository for ``User`` persistence operations.

    Adds user-specific query methods such as finding by email or
    username, and profile lookups.
    """

    model = User

    # ── Lookup Methods ─────────────────────────────────────────────

    async def find_by_email(self, email: str) -> User | None:
        """Find an active user by email address."""
        return await self.get_by_field('email', email)

    async def find_by_username(self, username: str) -> User | None:
        """Find an active user by username."""
        return await self.get_by_field('username', username)

    async def find_by_email_or_username(self, email_or_username: str) -> User | None:
        """Find an active user by either email or username."""
        stmt = select(User).where(
            or_(
                User.email == email_or_username,
                User.username == email_or_username,
            ),
        )
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_by_role(self, role: str, page: int = 1, per_page: int = 20) -> PageResult[User]:
        """Find users by role with pagination."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'role': role},
            sort_field='created_at',
            sort_direction=SortDirection.DESC,
        )

    # ── Profile Management ─────────────────────────────────────────

    async def update_profile(
        self,
        user_id: UUID,
        display_name: str | None = None,
        avatar_url: str | None = None,
        bio: str | None = None,
        preferences: dict[str, Any] | None = None,
    ) -> User:
        """Update a user's profile fields.

        Only non-``None`` fields are applied.
        """
        update_data: dict[str, Any] = {}
        if display_name is not None:
            update_data['display_name'] = display_name
        if avatar_url is not None:
            update_data['avatar_url'] = avatar_url
        if bio is not None:
            update_data['bio'] = bio
        if preferences is not None:
            update_data['preferences'] = preferences

        if not update_data:
            user = await self.get_by_id(user_id)
            if not user:
                raise EntityNotFoundError('User', user_id)
            return user

        return await self.update(user_id, **update_data)

    async def record_login(self, user_id: UUID) -> User:
        """Record a login event by updating ``last_login_at``."""
        from app.utils.date_utils import utc_now

        return await self.update(user_id, last_login_at=utc_now())

    # ── Statistics ─────────────────────────────────────────────────

    async def count_active_users(self) -> int:
        """Count active (non-deleted, is_active=True) users."""
        return await self.count(filters={'is_active': True})

    async def count_by_role(self, role: str) -> int:
        """Count users with a specific role."""
        return await self.count(filters={'role': role})

    # ── Email/Username Uniqueness ──────────────────────────────────

    async def is_email_taken(self, email: str, exclude_id: UUID | None = None) -> bool:
        """Check whether an email is already in use by another active user."""
        stmt = select(User).where(User.email == email)
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if user and exclude_id and user.id == exclude_id:
            return False
        return user is not None

    async def is_username_taken(self, username: str, exclude_id: UUID | None = None) -> bool:
        """Check whether a username is already in use by another active user."""
        stmt = select(User).where(User.username == username)
        stmt = self._apply_active_filter(stmt)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()
        if user and exclude_id and user.id == exclude_id:
            return False
        return user is not None
