"""Favorite model — user-favourite knowledge nodes for personalisation.

Maps to the ``favorites`` table.  Separate from bookmarks — favourites
are used for recommendation signals, bookmarks for later reference.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from app.models.knowledge_node import KnowledgeNode
    from app.models.user import User


class Favorite(AppBaseMixin, Base):
    """A favourite / liked knowledge node.

    Each (user, node) pair is unique.  Favourites influence the
    recommendation engine and provide a quick-access list for the
    user.
    """

    __tablename__ = 'favorites'

    __table_args__ = (
        UniqueConstraint(
            'user_id',
            'node_id',
            name='uq_favorite_user_node',
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='User who favourited the node',
    )
    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        comment='Favourited knowledge node',
    )

    # ── Relationships ──────────────────────────────────────────────

    user: Mapped[User] = relationship(
        'User',
        back_populates='favorites',
    )
    node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        back_populates='favorites',
    )

    def __repr__(self) -> str:
        return f'<Favorite user={self.user_id!r} node={self.node_id!r}>'
