"""Skill DTOs with multiple representations.

The same underlying data is projected into different shapes depending
on the use case:

- ``SkillLink`` — Minimal reference for embedding in other DTOs
- ``SkillSummary`` — Compact card for grids and lists
- ``SkillDetail`` — Full detail view with relationships
- ``SkillCreate`` / ``SkillUpdate`` — Mutation contracts
- ``SkillRelationshipSchema`` — Directed edge between two skills
- ``SkillGraph`` — Subgraph of skills for visualisation
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, SkillRelationshipType


class SkillLink(BaseModel):
    """Minimal skill reference for embedding in other DTOs."""

    id: UUID = Field(description='Unique skill identifier')
    name: str = Field(description='Skill name', max_length=200)
    category: str | None = Field(default=None, description='Skill category', max_length=100)


class SkillSummary(BaseModel):
    """Compact skill card for grids and listing pages."""

    id: UUID = Field(description='Unique skill identifier')
    name: str = Field(description='Skill name', max_length=200)
    description: str | None = Field(default=None, description='Short description of the skill')
    category: str | None = Field(default=None, description='Skill category', max_length=100)
    difficulty: Difficulty = Field(description='Typical difficulty level')
    created_at: datetime = Field(description='When the skill was created')


class SkillDetail(BaseModel):
    """Full skill detail with relationship counts and metadata."""

    id: UUID = Field(description='Unique skill identifier')
    name: str = Field(description='Skill name', max_length=200)
    description: str | None = Field(default=None, description='Short description of the skill')
    category: str | None = Field(default=None, description='Skill category', max_length=100)
    difficulty: Difficulty = Field(description='Typical difficulty level')
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')
    created_at: datetime = Field(description='When the skill was created')
    updated_at: datetime = Field(description='When the skill was last updated')

    # Relationship counts
    prerequisite_count: int = Field(default=0, ge=0, description='Number of prerequisite skills')
    dependent_count: int = Field(default=0, ge=0, description='Number of skills that build upon this one')
    related_count: int = Field(default=0, ge=0, description='Number of related skills')


class SkillCreate(BaseModel):
    """Request contract for creating a new skill."""

    name: str = Field(description='Unique skill name', max_length=200, min_length=1)
    description: str | None = Field(default=None, description='Short description', max_length=5000)
    category: str | None = Field(default=None, description='Skill category', max_length=100)
    difficulty: Difficulty = Field(default=Difficulty.BEGINNER, description='Typical difficulty level')
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')


class SkillUpdate(BaseModel):
    """Request contract for updating an existing skill.

    All fields are optional — only provided fields will be updated.
    """

    description: str | None = Field(default=None, max_length=5000)
    category: str | None = Field(default=None, max_length=100)
    difficulty: Difficulty | None = Field(default=None)
    metadata: dict | None = Field(default=None)


class SkillRelationshipSchema(BaseModel):
    """A directed, typed relationship between two skills.

    Maps to a ``SkillRelationship`` record but uses skill names
    (instead of UUIDs) for readability.
    """

    id: UUID = Field(description='Unique relationship identifier')
    source_skill_id: UUID = Field(description='Source / prerequisite skill ID')
    target_skill_id: UUID = Field(description='Target / dependent skill ID')
    source_skill_name: str = Field(description='Source skill name', max_length=200)
    target_skill_name: str = Field(description='Target skill name', max_length=200)
    relationship_type: SkillRelationshipType = Field(description='Semantic type of the relationship')
    weight: float | None = Field(default=None, ge=0.0, le=1.0, description='Optional strength weight')


class SkillRelationshipCreate(BaseModel):
    """Request contract for creating a new skill relationship."""

    source_skill_id: UUID = Field(description='Source / prerequisite skill ID')
    target_skill_id: UUID = Field(description='Target / dependent skill ID')
    relationship_type: SkillRelationshipType = Field(description='Semantic type of the relationship')
    weight: float | None = Field(default=None, ge=0.0, le=1.0, description='Optional strength weight')


class SkillCategoryCount(BaseModel):
    """Number of skills grouped by category."""

    category: str | None = Field(description='Skill category (null = uncategorised)')
    count: int = Field(ge=0, description='Number of skills in this category')


class SkillGraph(BaseModel):
    """Subset of the skill graph for visualisation.

    Contains a list of skills and the relationships between them,
    enabling the frontend to render an interactive skill map.
    """

    skills: list[SkillLink] = Field(description='Skills in this subgraph')
    relationships: list[SkillRelationshipSchema] = Field(
        description='Relationships connecting the skills',
    )
    categories: list[SkillCategoryCount] = Field(
        default_factory=list,
        description='Skill counts by category for filtering',
    )
