"""
ChatSession and ChatMessage models — conversational AI persistence.

chat_sessions: A single conversation belonging to a user.
chat_messages: Individual messages within a conversation.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from app.models.user import User


class ChatSession(AppBaseMixin, Base):
    """A single chat conversation belonging to a user."""

    __tablename__ = 'chat_sessions'

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        default='New Conversation',
    )
    session_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default='chat',
        comment='chat, tutor, planner, career_mentor, project_mentor, quiz, explain',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    message_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text('0'),
        nullable=False,
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text('false'),
        nullable=False,
    )

    user: Mapped[User] = relationship('User', back_populates='chat_sessions')
    messages: Mapped[list[ChatMessage]] = relationship(
        'ChatMessage',
        back_populates='session',
        cascade='all, delete-orphan',
        order_by='ChatMessage.created_at',
    )


class ChatMessage(AppBaseMixin, Base):
    """A single message within a chat conversation."""

    __tablename__ = 'chat_messages'

    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('chat_sessions.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment='user, assistant, system',
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    content_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default='text',
        comment='text, markdown, quiz, plan, project, career',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
    token_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text('0'),
        nullable=False,
    )
    model_used: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    session: Mapped[ChatSession] = relationship(
        'ChatSession',
        back_populates='messages',
    )
