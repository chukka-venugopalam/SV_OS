"""PasswordResetRepository — data access for password reset tokens."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import select

from app.models.password_reset import PasswordResetToken
from app.repositories.base import BaseRepository

if TYPE_CHECKING:
    from uuid import UUID


class PasswordResetRepository(BaseRepository[PasswordResetToken]):
    """Repository for password reset token operations."""

    model = PasswordResetToken

    async def find_valid_token(self, token_hash: str) -> PasswordResetToken | None:
        """Find a valid (unused, non-expired) token by hash."""
        stmt = (
            select(self.model)
            .where(self.model.token_hash == token_hash)
            .where(not self.model.is_used)
            .where(not self.model.is_deleted)
            .where(self.model.expires_at > datetime.now(UTC))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_as_used(self, token_id: UUID) -> None:
        """Mark a token as used."""
        token = await self.get_by_id(token_id)
        if token:
            token.is_used = True
            await self.session.flush()

    async def invalidate_user_tokens(self, user_id: UUID) -> int:
        """Invalidate all active tokens for a user (e.g. after password change).

        Returns the number of tokens invalidated.
        """
        stmt = (
            select(self.model)
            .where(self.model.user_id == user_id)
            .where(not self.model.is_used)
            .where(not self.model.is_deleted)
        )
        result = await self.session.execute(stmt)
        tokens = list(result.scalars().all())
        for token in tokens:
            token.is_used = True
        await self.session.flush()
        return len(tokens)
