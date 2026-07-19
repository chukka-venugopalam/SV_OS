"""Project and ProjectRequirement models.

Projects are hands-on build exercises (e.g. "Build a REST API").
ProjectRequirement is the many-to-many join between projects and
knowledge nodes.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import Difficulty, RequirementType, pg_enum

if TYPE_CHECKING:
    from uuid import UUID

    from app.models.knowledge_node import KnowledgeNode


class Project(AppBaseMixin, Base):
    """A hands-on project that applies knowledge node concepts.

    Projects tie together multiple knowledge nodes (through
    ``ProjectRequirement``) and are rated by difficulty and estimated
    hours.
    """

    __tablename__ = 'projects'

    slug: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        nullable=False,
        index=True,
        comment='URL-safe unique identifier',
    )
    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        comment='Human-readable project title',
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment='Project description and goals',
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        pg_enum(Difficulty, 'difficulty_enum'),
        default=Difficulty.INTERMEDIATE,
        server_default=text("'intermediate'"),
        nullable=False,
        index=True,
        comment='Project difficulty level',
    )
    estimated_hours: Mapped[int] = mapped_column(
        Integer,
        default=10,
        server_default=text('10'),
        nullable=False,
        comment='Estimated time to complete the project',
    )
    tech_stack: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        server_default=text("'{}'"),
        nullable=False,
        comment='Technologies / tools used in the project',
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
        comment='Whether the project is publicly visible',
    )

    # ── Relationships ──────────────────────────────────────────────

    requirements: Mapped[list[ProjectRequirement]] = relationship(
        'ProjectRequirement',
        back_populates='project',
        cascade='all, delete-orphan',
        order_by='ProjectRequirement.order_index',
    )

    def __repr__(self) -> str:
        return f'<Project id={self.id!r} slug={self.slug!r}>'


class ProjectRequirement(AppBaseMixin, Base):
    """Many-to-many join between ``Project`` and ``KnowledgeNode``.

    Defines which knowledge nodes are required (or recommended) to
    complete a project, with ordering.
    """

    __tablename__ = 'project_requirements'

    __table_args__ = (
        UniqueConstraint(
            'project_id',
            'node_id',
            'requirement_type',
            name='uq_project_req_project_node_type',
        ),
    )

    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('projects.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Parent project ID',
    )
    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Required knowledge node ID',
    )
    requirement_type: Mapped[RequirementType] = mapped_column(
        pg_enum(RequirementType, 'requirement_type_enum'),
        nullable=False,
        comment='How strongly the node is required (required / recommended)',
    )
    order_index: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text('0'),
        nullable=False,
        comment='Display ordering within the project',
    )

    # ── Relationships ──────────────────────────────────────────────

    project: Mapped[Project] = relationship(
        'Project',
        back_populates='requirements',
    )
    node: Mapped[KnowledgeNode] = relationship(
        'KnowledgeNode',
        back_populates='project_requirements',
    )

    def __repr__(self) -> str:
        return (
            f'<ProjectRequirement project={self.project_id!r} '
            f'node={self.node_id!r} type={self.requirement_type}>'
        )
