"""LearningResource model — an external learning material linked to a node.

Maps to the ``learning_resources`` table.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import Difficulty, ResourceType, pg_enum

if TYPE_CHECKING:
    from app.models.knowledge_node import KnowledgeNode


class LearningResource(AppBaseMixin, Base):
    """An external resource that helps learn a knowledge node.

    Resources can be videos, articles, courses, books, documentation,
    tools, podcasts, or interactive tutorials.  Each resource is linked
    to exactly one ``KnowledgeNode``.
    """

    __tablename__ = 'learning_resources'

    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Knowledge node this resource belongs to',
    )
    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment='Resource title',
    )
    url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment='URL to access the resource',
    )
    resource_type: Mapped[ResourceType] = mapped_column(
        pg_enum(ResourceType, 'resource_type_enum'),
        nullable=False,
        index=True,
        comment='Category of the resource (video, article, course, etc.)',
    )
    platform: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment='Platform name (e.g. "YouTube", "Coursera", "MDN")',
    )
    is_free: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text('true'),
        nullable=False,
        comment='Whether the resource is freely accessible',
    )
    duration_minutes: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment='Estimated time to consume the resource',
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        pg_enum(Difficulty, 'difficulty_enum'),
        default=Difficulty.BEGINNER,
        server_default=text("'beginner'"),
        nullable=False,
        comment='Difficulty level of this specific resource',
    )
    language: Mapped[str] = mapped_column(
        String(10),
        default='en',
        server_default=text("'en'"),
        nullable=False,
        comment='ISO language code (e.g. "en", "es", "fr")',
    )

    # ── Relationships ──────────────────────────────────────────────

    node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        back_populates='resources',
    )

    def __repr__(self) -> str:
        return f'<LearningResource id={self.id!r} title={self.title!r} type={self.resource_type}>'
