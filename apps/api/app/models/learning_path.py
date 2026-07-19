"""LearningPath and LearningSession models.

A LearningPath is a curated sequence of knowledge nodes (like a
playlist or curriculum).  A LearningSession tracks a single study
session within a path.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import Difficulty, LearningStatus, pg_enum
from app.utils.date_utils import utc_now

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from app.models.knowledge_node import KnowledgeNode
    from app.models.user import User


class LearningPath(AppBaseMixin, Base):
    """A curated, ordered sequence of knowledge nodes.

    Learning paths bundle nodes into a recommended learning journey
    (e.g. "Python for Data Science", "Web Development Fundamentals").
    They can be created by admins or community contributors.
    """

    __tablename__ = 'learning_paths'

    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment='Human-readable path title',
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment='Short description of the learning path',
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        pg_enum(Difficulty, 'difficulty_enum'),
        default=Difficulty.BEGINNER,
        server_default=text("'beginner'"),
        nullable=False,
        comment='Overall difficulty of the path',
    )
    estimated_hours: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment='Estimated total time to complete the path',
    )
    icon: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment='Icon identifier for UI display',
    )
    color: Mapped[str | None] = mapped_column(
        String(7),
        nullable=True,
        comment='Hex colour for UI display',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
        comment='Arbitrary metadata JSON blob',
    )
    is_published: Mapped[bool] = mapped_column(
        default=True,
        server_default=text('true'),
        nullable=False,
        comment='Whether the path is publicly visible',
    )

    # ── Node membership via JSONB order (simpler than a join table for MVP) ──
    # In a future phase this could be normalised into a path_nodes table.
    node_order: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        server_default=text("'[]'::jsonb"),
        nullable=False,
        comment='Ordered array of node IDs [{node_id: UUID, order: int, optional: bool}]',
    )

    def __repr__(self) -> str:
        return f'<LearningPath id={self.id!r} title={self.title!r}>'


class LearningSession(AppBaseMixin, Base):
    """A single study session tracked for a user.

    Records when a user started and stopped studying a particular
    knowledge node, along with the time spent and any notes taken.
    """

    __tablename__ = 'learning_sessions'

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='User who studied',
    )
    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Knowledge node studied',
    )
    status: Mapped[LearningStatus] = mapped_column(
        pg_enum(LearningStatus, 'learning_status_enum'),
        default=LearningStatus.ACTIVE,
        server_default=text("'active'"),
        nullable=False,
        comment='Current status of the session',
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=True,
        comment='When the session started (defaults to creation time)',
    )
    ended_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment='When the session ended',
    )
    duration_minutes: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment='Total active minutes in this session',
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment='User notes taken during the session',
    )

    # ── Relationships ──────────────────────────────────────────────

    user: Mapped[User] = relationship(
        'User',
        back_populates='learning_sessions',
    )
    node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        # Deliberately no back_populates — KnowledgeNode does not
        # define a ``learning_sessions`` relationship.  Adding one
        # would pull all LearningSession records into memory every
        # time a KnowledgeNode is loaded, causing N+1 queries.
    )

    def __repr__(self) -> str:
        return (
            f'<LearningSession id={self.id!r} '
            f'user={self.user_id!r} node={self.node_id!r} '
            f'status={self.status}>'
        )
