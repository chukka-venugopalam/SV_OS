"""
Career and CareerRequirement models.

Careers represent professional paths (e.g. "Frontend Developer").
CareerRequirement is the many-to-many join between careers and
knowledge nodes, with a typed requirement strength.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import DemandLevel, RequirementType, pg_enum

if TYPE_CHECKING:
    from app.models.knowledge_node import KnowledgeNode


class Career(AppBaseMixin, Base):
    """A professional career path (e.g. "Data Scientist", "DevOps Engineer").

    Careers link to knowledge nodes through ``CareerRequirement`` to
    define the skill map needed for each role.
    """

    __tablename__ = 'careers'

    slug: Mapped[str] = mapped_column(
        String(200), unique=True, nullable=False, index=True,
        comment='URL-safe unique identifier (e.g. "frontend-developer")',
    )
    title: Mapped[str] = mapped_column(
        String(300), nullable=False,
        comment='Human-readable career title',
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False,
        comment='Detailed description of the career path',
    )
    average_salary: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True,
        comment='Display string for average salary (e.g. "$80k-$120k")',
    )
    demand_level: Mapped[DemandLevel] = mapped_column(
        pg_enum(DemandLevel, "demand_enum"),
        default=DemandLevel.GROWING, server_default=text("'growing'"),
        nullable=False, index=True,
        comment='Market demand trend',
    )
    required_experience: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True,
        comment='Years or level of experience needed (e.g. "3-5 years")',
    )
    icon: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True,
        comment='Icon identifier for UI display',
    )
    color: Mapped[Optional[str]] = mapped_column(
        String(7), nullable=True,
        comment='Hex colour for UI display',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata', JSONB, default=dict, server_default=text("'{}'::jsonb"),
        nullable=False,
        comment='Arbitrary metadata JSON blob',
    )
    is_published: Mapped[bool] = mapped_column(
        default=True, server_default=text('true'),
        nullable=False,
        comment='Whether the career is publicly visible',
    )

    # ── Relationships ──────────────────────────────────────────────

    requirements: Mapped[list['CareerRequirement']] = relationship(
        'CareerRequirement', back_populates='career',
        cascade='all, delete-orphan',
        order_by='CareerRequirement.order_index',
    )

    def __repr__(self) -> str:
        return f'<Career id={self.id!r} slug={self.slug!r}>'


class CareerRequirement(AppBaseMixin, Base):
    """Many-to-many join between ``Career`` and ``KnowledgeNode``.

    Each record defines how strongly a knowledge node is required for
    a given career (required / recommended / bonus) and its ordering
    within the career roadmap.
    """

    __tablename__ = 'career_requirements'

    __table_args__ = (
        UniqueConstraint(
            'career_id', 'node_id', 'requirement_type',
            name='uq_career_req_career_node_type',
        ),
    )

    career_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('careers.id', ondelete='CASCADE'),
        nullable=False, index=True,
        comment='Parent career ID',
    )
    node_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
        nullable=False, index=True,
        comment='Required knowledge node ID',
    )
    requirement_type: Mapped[RequirementType] = mapped_column(
        pg_enum(RequirementType, "requirement_type_enum"),
        nullable=False,
        comment='How strongly the node is required (required / recommended / bonus)',
    )
    order_index: Mapped[int] = mapped_column(
        Integer, default=0, server_default=text('0'),
        nullable=False,
        comment='Display ordering within the career roadmap',
    )

    # ── Relationships ──────────────────────────────────────────────

    career: Mapped['Career'] = relationship(
        'Career', back_populates='requirements',
    )
    node: Mapped['KnowledgeNode'] = relationship(
        'KnowledgeNode', back_populates='career_requirements',
    )

    def __repr__(self) -> str:
        return (
            f'<CareerRequirement career={self.career_id!r} '
            f'node={self.node_id!r} type={self.requirement_type.value}>'
        )
