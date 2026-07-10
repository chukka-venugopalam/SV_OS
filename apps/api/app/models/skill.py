"""
Skill and SkillRelationship models.

Skills are individual abilities (e.g. "SQL Querying", "API Design").
SkillRelationship describes how skills relate to each other
(e.g. "SQL Querying" is a prerequisite for "Database Design").
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import AppBaseMixin
from app.models.enums import Difficulty, SkillRelationshipType, pg_enum

if TYPE_CHECKING:
    pass  # Skill is defined in this file — no forward import needed


class Skill(AppBaseMixin, Base):
    """A discrete, measurable ability (e.g. "REST API Design", "Python").

    Skills are cross-cutting — they may be taught by multiple knowledge
    nodes and are linked to each other via ``SkillRelationship``.
    """

    __tablename__ = 'skills'

    name: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        nullable=False,
        comment='Unique skill name',
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment='Short description of the skill',
    )
    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment='Skill category (e.g. "Programming Language", "Soft Skill")',
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        pg_enum(Difficulty, 'difficulty_enum'),
        default=Difficulty.BEGINNER,
        server_default=text("'beginner'"),
        nullable=False,
        comment='Typical difficulty level',
    )
    extra_metadata: Mapped[dict] = mapped_column(
        'metadata',
        JSONB,
        default=dict,
        server_default=text("'{}'::jsonb"),
        nullable=False,
        comment='Arbitrary metadata JSON blob',
    )

    # ── Relationships ──────────────────────────────────────────────

    # Outgoing skill relationships
    outgoing_relationships: Mapped[list[SkillRelationship]] = relationship(
        'SkillRelationship',
        foreign_keys='SkillRelationship.source_skill_id',
        back_populates='source_skill',
        cascade='all, delete-orphan',
    )
    # Incoming skill relationships
    incoming_relationships: Mapped[list[SkillRelationship]] = relationship(
        'SkillRelationship',
        foreign_keys='SkillRelationship.target_skill_id',
        back_populates='target_skill',
        cascade='all, delete-orphan',
    )

    def __repr__(self) -> str:
        return f'<Skill id={self.id!r} name={self.name!r}>'


class SkillRelationship(AppBaseMixin, Base):
    """A directed, typed relationship between two skills.

    E.g. ``Python`` (source) → ``Django`` (target) with type
    ``builds_upon`` means Django builds upon Python skills.
    """

    __tablename__ = 'skill_relationships'

    __table_args__ = (
        UniqueConstraint(
            'source_skill_id',
            'target_skill_id',
            'relationship_type',
            name='uq_skill_rel_source_target_type',
        ),
    )

    source_skill_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('skills.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Source / prerequisite skill ID',
    )
    target_skill_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey('skills.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='Target / dependent skill ID',
    )
    relationship_type: Mapped[SkillRelationshipType] = mapped_column(
        pg_enum(SkillRelationshipType, 'skill_relationship_type_enum'),
        nullable=False,
        comment='Semantic type of the skill relationship',
    )
    weight: Mapped[float | None] = mapped_column(
        nullable=True,
        comment='Optional strength / relevance weight',
    )

    # ── Relationships ──────────────────────────────────────────────

    source_skill: Mapped[Skill] = relationship(
        'Skill',
        foreign_keys=[source_skill_id],
        back_populates='outgoing_relationships',
    )
    target_skill: Mapped[Skill] = relationship(
        'Skill',
        foreign_keys=[target_skill_id],
        back_populates='incoming_relationships',
    )

    def __repr__(self) -> str:
        return (
            f'<SkillRelationship {self.source_skill_id!r} → '
            f'{self.target_skill_id!r} type={self.relationship_type.value}>'
        )
