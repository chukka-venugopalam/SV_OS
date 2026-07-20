"""Tag and NodeTag models — content tagging system.

Tags are free-form labels (e.g. "beginner-friendly", "math-heavy").
NodeTag is the many-to-many join between tags and knowledge nodes.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin

if TYPE_CHECKING:
    from app.models.knowledge_node import KnowledgeNode


class Tag(AppBaseMixin, Base):
    """A reusable tag / label for categorising knowledge nodes.

    Tags are free-form (unlike enums) and can be created on the fly.
    """

    __tablename__ = 'tags'

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        comment='Unique tag name (lowercase, hyphenated)',
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment='Optional description of the tag intent',
    )

    # ── Relationships ──────────────────────────────────────────────

    node_tags: Mapped[list[NodeTag]] = relationship(
        'NodeTag',
        back_populates='tag',
        cascade='all, delete-orphan',
    )

    def __repr__(self) -> str:
        return f'<Tag id={self.id!r} name={self.name!r}>'


class NodeTag(AppBaseMixin, Base):
    """Many-to-many join between ``Tag`` and ``KnowledgeNode``."""

    __tablename__ = 'node_tags'

    __table_args__ = (
        UniqueConstraint(
            'node_id',
            'tag_id',
            name='uq_node_tag_node_tag',
        ),
    )

    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Knowledge node ID',
    )
    tag_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('tags.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Tag ID',
    )

    # ── Relationships ──────────────────────────────────────────────

    node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        back_populates='node_tags',
    )
    tag: Mapped[Tag] = relationship(
        'Tag',
        back_populates='node_tags',
    )

    def __repr__(self) -> str:
        return f'<NodeTag node={self.node_id!r} tag={self.tag_id!r}>'
