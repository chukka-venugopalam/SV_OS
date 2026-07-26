"""Career requirement DTOs for linking careers to knowledge nodes."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType, RequirementType


class CareerRequirement(BaseModel):
    """A single knowledge requirement for a career.

    Links a career to a knowledge node with a typed strength and
    ordering.  Used in the career roadmap and requirement listing.
    """

    node_slug: str = Field(description='Knowledge node identifier', max_length=200)
    node_title: str = Field(description='Node display title', max_length=300)
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty level')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    requirement_type: RequirementType = Field(description='How strongly the node is required')
    order_index: int = Field(ge=0, description='Display order within the career roadmap')


class RequirementDetail(BaseModel):
    """Detailed view of a career requirement with node metadata.

    Provides the full node information alongside the requirement
    metadata for rendering a detailed requirement card.
    """

    id: UUID = Field(description='Requirement record identifier')
    career_slug: str = Field(description='Career identifier')
    node_id: UUID = Field(description='Knowledge node identifier')
    node_slug: str = Field(description='Knowledge node slug')
    node_title: str = Field(description='Node display title')
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty level')
    requirement_type: RequirementType = Field(description='How strongly the node is required')
    order_index: int = Field(ge=0, description='Display order within the career roadmap')
