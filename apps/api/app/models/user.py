"""
User model — represents a platform user (learner or admin).

Maps to the ``users`` table.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import UserRole, pg_enum

if TYPE_CHECKING:
    from app.models.knowledge_node import KnowledgeNode
    from app.models.user_progress import UserProgress
    from app.models.bookmark import Bookmark
    from app.models.favorite import Favorite
    from app.models.search_history import SearchHistory
    from app.models.learning_path import LearningSession
    from app.models.audit_log import AuditLog
    from app.models.recommendation import Recommendation
    from app.models.chat_session import ChatSession, ChatMessage
    from app.models.ai_memory import AIMemory, AIPreference
    from app.models.ai_history import QuizHistory, PlannerHistory


class User(AppBaseMixin, Base):
    """A registered user of the Learning OS.

    Supports two roles (learner / admin) and carries optional profile
    fields (avatar, bio) plus JSONB preferences for extensibility.
    """

    __tablename__ = 'users'

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True,
        comment='Verified email address (unique)',
    )
    username: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True,
        comment='Public username (unique)',
    )
    display_name: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True, comment='Display name shown in the UI',
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment='URL of the user profile picture',
    )
    bio: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True, comment='Short biography text',
    )
    password_hash: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True,
        comment='Bcrypt hash of the user password',
    )
    role: Mapped[UserRole] = mapped_column(
        pg_enum(UserRole, "user_role_enum"),
        default=UserRole.LEARNER, server_default=text("'learner'"),
        nullable=False, comment='Authorization role',
    )
    preferences: Mapped[dict] = mapped_column(
        JSONB, default=dict, server_default=text("'{}'::jsonb"),
        nullable=False, comment='User preferences stored as JSONB',
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text('true'),
        nullable=False, comment='Whether the account is active',
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment='Timestamp of the most recent login',
    )

    # ── Relationships ──────────────────────────────────────────────
    progress: Mapped[list[UserProgress]] = relationship(
        'UserProgress', back_populates='user',
        cascade='all, delete-orphan',
    )
    bookmarks: Mapped[list[Bookmark]] = relationship(
        'Bookmark', back_populates='user',
        cascade='all, delete-orphan',
    )
    favorites: Mapped[list['Favorite']] = relationship(
        'Favorite', back_populates='user',
        cascade='all, delete-orphan',
    )
    search_history: Mapped[list['SearchHistory']] = relationship(
        'SearchHistory', back_populates='user',
        cascade='all, delete-orphan',
    )
    learning_sessions: Mapped[list['LearningSession']] = relationship(
        'LearningSession', back_populates='user',
        cascade='all, delete-orphan',
    )
    audit_logs: Mapped[list['AuditLog']] = relationship(
        'AuditLog', back_populates='user',
        # No cascade — audit logs should persist (user_id → NULL) when user is deleted
        # to match the FK constraint: ON DELETE SET NULL
    )
    recommendations: Mapped[list['Recommendation']] = relationship(
        'Recommendation', back_populates='user',
        cascade='all, delete-orphan',
    )
    chat_sessions: Mapped[list['ChatSession']] = relationship(
        'ChatSession', back_populates='user',
        cascade='all, delete-orphan',
    )
    ai_memories: Mapped[list['AIMemory']] = relationship(
        'AIMemory', back_populates='user',
        cascade='all, delete-orphan',
    )
    ai_preferences: Mapped[list['AIPreference']] = relationship(
        'AIPreference', back_populates='user',
        cascade='all, delete-orphan',
    )

    def __repr__(self) -> str:
        return f'<User id={self.id!r} username={self.username!r} role={self.role.value}>'
