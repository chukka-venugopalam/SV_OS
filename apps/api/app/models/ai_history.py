"""
History models for AI-generated content — quiz, planner, and project history.

Stores generated quizzes, learning plans, and project roadmaps for
reference, review, and iteration.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import AppBaseMixin


class QuizHistory(AppBaseMixin, Base):
    """A generated quiz or assessment for a user."""

    __tablename__ = 'quiz_history'

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    quiz_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment='mcq, flashcards, coding, interview, fill_blanks, true_false',
    )
    topic: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment='Topic or node the quiz covers',
    )
    difficulty: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default='intermediate',
    )
    questions: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment='List of question objects with choices, answers, explanations',
    )
    score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment='Score if user completed it (0.0 to 100.0)',
    )
    total_questions: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    correct_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )


class PlannerHistory(AppBaseMixin, Base):
    """A generated learning plan for a user."""

    __tablename__ = 'planner_history'

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    plan_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment='daily, weekly, monthly, career_roadmap',
    )
    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )
    goal: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment='The learning goal or target',
    )
    plan_content: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        comment='Structured plan with milestones, nodes, estimated times',
    )
    estimated_hours: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )
    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )
