"""LearningGoal and LearningGoalNode models — Phase 5 audit Task 5.

Learning goals (e.g. "GATE exam prep", "AWS certification") are stored
separately from careers.  Each goal can link to multiple knowledge nodes
through the ``learning_goal_nodes`` join table.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import GoalType, pg_enum

if TYPE_CHECKING:
    from app.models.knowledge_node import KnowledgeNode


class LearningGoal(AppBaseMixin, Base):
    """A learning goal (exam, certification, interview prep, custom).

    Separate from ``Career`` — a goal has a ``goal_type`` discriminating
    what kind of milestone it represents, and links to knowledge nodes
    through ``LearningGoalNode`` with an ordered sequence.
    """

    __tablename__ = 'learning_goals'

    slug: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        nullable=False,
        index=True,
        comment='URL-safe unique identifier (e.g. "gate-cse")',
    )
    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment='Human-readable goal title',
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default='',
        server_default=text("''"),
        comment='Detailed description of the learning goal',
    )
    goal_type: Mapped[GoalType] = mapped_column(
        pg_enum(GoalType, 'goal_type_enum'),
        nullable=False,
        default=GoalType.CUSTOM,
        server_default=text("'custom'"),
        comment='Type of goal: exam, certification, interview_prep, custom',
    )

    # ── Relationships ──────────────────────────────────────────────

    goal_nodes: Mapped[list[LearningGoalNode]] = relationship(
        'LearningGoalNode',
        back_populates='goal',
        cascade='all, delete-orphan',
        order_by='LearningGoalNode.sequence_order',
    )

    def __repr__(self) -> str:
        return f'<LearningGoal id={self.id!r} slug={self.slug!r} type={self.goal_type}>'


class LearningGoalNode(AppBaseMixin, Base):
    """Many-to-many join between ``LearningGoal`` and ``KnowledgeNode``.

    Each record defines which nodes are part of a learning goal, in what
    order they should be studied, and how strongly they are required.
    """

    __tablename__ = 'learning_goal_nodes'

    __table_args__ = (
        UniqueConstraint(
            'goal_id',
            'node_id',
            name='uq_goal_node_pair',
        ),
    )

    goal_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('learning_goals.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Parent learning goal ID',
    )
    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Linked knowledge node ID',
    )
    requirement_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default='required',
        server_default=text("'required'"),
        comment='How strongly the node is required (required / recommended / bonus)',
    )
    sequence_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text('0'),
        nullable=False,
        comment='Display order within the goal roadmap',
    )

    # ── Relationships ──────────────────────────────────────────────

    goal: Mapped[LearningGoal] = relationship(
        'LearningGoal',
        back_populates='goal_nodes',
    )
    node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        back_populates='goal_requirements',
    )

    def __repr__(self) -> str:
        return (
            f'<LearningGoalNode goal={self.goal_id!r} '
            f'node={self.node_id!r} type={self.requirement_type}>'
        )
