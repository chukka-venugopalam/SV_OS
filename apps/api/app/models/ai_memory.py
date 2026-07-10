"""
AIMemory and AIPreference models — persistent AI context for personalisation.

AIMemory stores long-term knowledge about the user's learning journey.
AIPreference stores user's AI interaction preferences.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from app.models.user import User


class AIMemory(AppBaseMixin, Base):
    """Long-term memory about a user's learning journey.

    Each row represents a distinct memory fact.  Type discriminates
    the kind of memory: weak_concept, career_goal, learning_style,
    completed_goal, interest, struggle, achievement.
    """

    __tablename__ = 'ai_memories'

    __table_args__ = (
        # One type per user has at most one active entry
        # (enforced at application layer, not unique constraint)
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    memory_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment=(
            'weak_concept, career_goal, learning_style, completed_goal,'
            ' interest, struggle, achievement'
        ),
    )
    key: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment='Machine-readable key (e.g. "python-basics", "visual")',
    )
    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment='Human-readable value or description',
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        server_default=text('1.0'),
        nullable=False,
        comment='Confidence score 0.0 to 1.0',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )

    user: Mapped[User] = relationship('User', back_populates='ai_memories')


class AIPreference(AppBaseMixin, Base):
    """User preferences for AI interaction behaviour."""

    __tablename__ = 'ai_preferences'

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True,
    )
    preferred_model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment='Preferred LLM model (e.g. gpt-4o, claude-3-opus)',
    )
    explanation_style: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default='balanced',
        comment='simple, detailed, balanced, socratic, example_driven',
    )
    temperature: Mapped[float] = mapped_column(
        Float,
        default=0.7,
        server_default=text('0.7'),
        nullable=False,
        comment='LLM temperature preference',
    )
    max_tokens: Mapped[int] = mapped_column(
        Integer,
        default=2048,
        comment='Max tokens per response',
    )
    auto_generate_titles: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        comment='Auto-generate conversation titles',
    )
    include_citations: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        comment='Include knowledge graph citations in responses',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )

    user: Mapped[User] = relationship('User', back_populates='ai_preferences')
