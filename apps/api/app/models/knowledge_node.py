"""
KnowledgeNode model — the central entity of the knowledge graph.

Every piece of knowledge (subject, concept, technology, tool) is stored
in the ``knowledge_nodes`` table and typed via the ``node_type``
discriminator column.

Subject, Concept, and Technology are **not** separate ORM subclasses —
they are values of the ``NodeType`` enum on the ``node_type`` column.
This avoids the complexity of polymorphic inheritance while keeping
the schema clean and extensible.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import Difficulty, NodeType, pg_enum

if TYPE_CHECKING:
    from app.models.bookmark import Bookmark
    from app.models.career import CareerRequirement
    from app.models.favorite import Favorite
    from app.models.knowledge_edge import KnowledgeEdge
    from app.models.learning_resource import LearningResource
    from app.models.project import ProjectRequirement
    from app.models.tag import NodeTag
    from app.models.user_progress import UserProgress


class KnowledgeNode(AppBaseMixin, Base):
    """A single node in the knowledge graph.

    Represents a learnable unit — a subject, concept, technology, or
    tool.  The ``node_type`` column discriminates the kind, and the
    ``search_vector`` column enables PostgreSQL full-text search.
    """

    __tablename__ = 'knowledge_nodes'

    slug: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        nullable=False,
        index=True,
        comment='URL-safe unique identifier (e.g. "python-basics")',
    )
    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment='Human-readable title of the node',
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment='Short description / abstract of the node',
    )
    content: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment='Full rich-text / Markdown content body',
    )
    node_type: Mapped[NodeType] = mapped_column(
        pg_enum(NodeType, 'node_type_enum'),
        nullable=False,
        index=True,
        comment='Discriminator — subject, concept, technology, or tool',
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        pg_enum(Difficulty, 'difficulty_enum'),
        default=Difficulty.BEGINNER,
        server_default=text("'beginner'"),
        nullable=False,
        index=True,
        comment='Educational difficulty level',
    )
    estimated_minutes: Mapped[int] = mapped_column(
        Integer,
        default=30,
        server_default=text('30'),
        nullable=False,
        comment='Estimated time to learn / complete in minutes',
    )
    icon: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment='Icon identifier (Lucide / custom icon name)',
    )
    color: Mapped[str | None] = mapped_column(
        String(7),
        nullable=True,
        comment='Hex colour code for UI display (e.g. "#3B82F6")',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
        comment='Arbitrary metadata JSON blob for extensibility',
    )
    search_vector: Mapped[str | None] = mapped_column(
        TSVECTOR,
        nullable=True,
        comment='PostgreSQL full-text search vector (auto-populated by trigger)',
    )
    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text('0'),
        nullable=False,
        comment='Total page-view counter',
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text('true'),
        nullable=False,
        index=True,
        comment='Whether the node is publicly visible',
    )

    # ── Relationships ──────────────────────────────────────────────

    # Edges (source — outgoing)
    outgoing_edges: Mapped[list[KnowledgeEdge]] = relationship(
        'KnowledgeEdge',
        foreign_keys='KnowledgeEdge.source_node_id',
        back_populates='source_node',
        cascade='all, delete-orphan',
    )

    # Edges (target — incoming)
    incoming_edges: Mapped[list[KnowledgeEdge]] = relationship(
        'KnowledgeEdge',
        foreign_keys='KnowledgeEdge.target_node_id',
        back_populates='target_node',
        cascade='all, delete-orphan',
    )

    resources: Mapped[list[LearningResource]] = relationship(
        'LearningResource',
        back_populates='node',
        cascade='all, delete-orphan',
    )
    progress_records: Mapped[list[UserProgress]] = relationship(
        'UserProgress',
        back_populates='node',
        cascade='all, delete-orphan',
    )
    bookmarks: Mapped[list[Bookmark]] = relationship(
        'Bookmark',
        back_populates='node',
        cascade='all, delete-orphan',
    )
    favorites: Mapped[list[Favorite]] = relationship(
        'Favorite',
        back_populates='node',
        cascade='all, delete-orphan',
    )
    node_tags: Mapped[list[NodeTag]] = relationship(
        'NodeTag',
        back_populates='node',
        cascade='all, delete-orphan',
    )
    career_requirements: Mapped[list[CareerRequirement]] = relationship(
        'CareerRequirement',
        back_populates='node',
        cascade='all, delete-orphan',
    )
    project_requirements: Mapped[list[ProjectRequirement]] = relationship(
        'ProjectRequirement',
        back_populates='node',
        cascade='all, delete-orphan',
    )

    def __repr__(self) -> str:
        return f'<KnowledgeNode id={self.id!r} slug={self.slug!r} type={self.node_type}>'
