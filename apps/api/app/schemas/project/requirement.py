"""Project requirement DTOs for linking projects to knowledge nodes."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType, RequirementType


class ProjectRequirement(BaseModel):
    """A single knowledge requirement for a project."""

    node_slug: str = Field(description='Knowledge node identifier', max_length=200)
    node_title: str = Field(description='Node display title', max_length=300)
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty level')
    requirement_type: RequirementType = Field(description='How strongly the node is required')
    order_index: int = Field(ge=0, description='Display order within the project roadmap')


class RequiredSkill(BaseModel):
    """A skill required for a project with optional proficiency level."""

    name: str = Field(description='Skill name', max_length=200)
    category: str | None = Field(default=None, description='Skill category', examples=['Programming Language'])
    difficulty: Difficulty = Field(description='Required proficiency level')
    is_essential: bool = Field(default=True, description='Whether this skill is essential or optional')
