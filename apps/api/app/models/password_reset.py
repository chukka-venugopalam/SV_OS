"""PasswordResetToken model — stores password reset tokens.

Each token is a short-lived, single-use random string that allows
a user to reset their password without being authenticated.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from app.models.user import User


class PasswordResetToken(AppBaseMixin, Base):
    """A single-use password reset token for a user.

    Tokens are short-lived (default 1 hour) and are hashed before
    storage.  The plain-text token is returned in the API response
    so it can be sent via email (or returned directly in dev).
    """

    __tablename__ = 'password_reset_tokens'

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='User who requested the password reset',
    )
    token_hash: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        comment='SHA-256 hash of the reset token',
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment='Timestamp when the token expires',
    )
    is_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text('false'),
        nullable=False,
        comment='Whether the token has been used',
    )

    # ── Relationships ──────────────────────────────────────────────

    user: Mapped[User] = relationship(
        'User',
        back_populates='password_reset_tokens',
    )

    def __repr__(self) -> str:
        return f'<PasswordResetToken user={self.user_id!r} used={self.is_used}>'
