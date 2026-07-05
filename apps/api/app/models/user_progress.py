"""
UserProgress model — tracks a user's learning status on a knowledge node.

Maps to the ``user_progress`` table.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import ProgressStatus

if TYPE_CHECKING:
    from app.models.knowledge_node import KnowledgeNode
    from app.models.user import User


class UserProgress(AppBaseMixin, Base):
    """Tracks a ``User``'s learning progress on a specific ``KnowledgeNode``.

    Each (user, node) pair is unique.  Progress flows through the status
    lifecycle: not_started → learning → completed → mastered.
    """

    __tablename__ = 'user_progress'

    __table_args__ = (
        UniqueConstraint(
            'user_id', 'node_id',
            name='uq_progress_user_node',
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False, index=True,
        comment='User who made the progress',
    )
    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False, index=True,
        comment='Knowledge node being progressed',
    )
    status: Mapped[ProgressStatus] = mapped_column(
        Enum(ProgressStatus, name="progress_enum", native_enum=True, create_type=False),
        default=ProgressStatus.NOT_STARTED,
        server_default=text("'not_started'"),
        nullable=False, index=True,
        comment='Current progress status',
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment='When the user started learning this node',
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment='When the user completed this node',
    )
    mastered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment='When the user mastered this node',
    )
    time_spent_minutes: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text('0'),
        nullable=False,
        comment='Total time spent on this node (minutes)',
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment='Personal notes taken by the user',
    )

    # ── Relationships ──────────────────────────────────────────────

    user: Mapped['User'] = relationship(
        'User', back_populates='progress',
    )
    node: Mapped['KnowledgeNode'] = relationship(
        'KnowledgeNode', back_populates='progress_records',
    )

    def __repr__(self) -> str:
        return (
            f'<UserProgress user={self.user_id!r} '
            f'node={self.node_id!r} status={self.status.value}>'
        )
