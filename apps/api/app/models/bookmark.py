"""
Bookmark model — user-saved knowledge nodes for quick access.

Maps to the ``bookmarks`` table.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.knowledge_node import KnowledgeNode


class Bookmark(AppBaseMixin, Base):
    """A user-saved bookmark for a knowledge node.

    Each (user, node) pair is unique — a user cannot bookmark the same
    node twice.
    """

    __tablename__ = 'bookmarks'

    __table_args__ = (
        UniqueConstraint(
            'user_id', 'node_id',
            name='uq_bookmark_user_node',
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False, index=True,
        comment='User who created the bookmark',
    )
    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        comment='Bookmarked knowledge node',
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment='Optional personal note attached to the bookmark',
    )

    # ── Relationships ──────────────────────────────────────────────

    user: Mapped['User'] = relationship(
        'User', back_populates='bookmarks',
    )
    node: Mapped['KnowledgeNode'] = relationship(
        'KnowledgeNode', back_populates='bookmarks',
    )

    def __repr__(self) -> str:
        return (
            f'<Bookmark user={self.user_id!r} node={self.node_id!r}>'
        )
