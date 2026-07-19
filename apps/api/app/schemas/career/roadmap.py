"""Career roadmap and progress DTOs.

The roadmap is an ordered sequence of knowledge nodes grouped by
requirement type.  Progress tracks the user's completion status
against each requirement.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType, ProgressStatus, RequirementType

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID


class RoadmapStep(BaseModel):
    """A single step in a career roadmap.

    Each step is a knowledge node the user should learn, annotated
    with how strongly it's required and where it sits in the
    recommended learning order.
    """

    node_id: UUID = Field(description='Knowledge node identifier')
    slug: str = Field(description='URL-friendly identifier')
    title: str = Field(description='Node display title')
    description: str = Field(description='Short abstract / summary')
    node_type: NodeType = Field(description='Type discriminator')
    difficulty: Difficulty = Field(description='Educational difficulty')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)

    # Roadmap-specific
    requirement_type: RequirementType = Field(description='How strongly this node is required')
    order_index: int = Field(ge=0, description='Display order within the roadmap')
    is_completed: bool = Field(
        default=False,
        description='Whether the user has completed this step',
    )
    status: ProgressStatus = Field(
        default=ProgressStatus.NOT_STARTED,
        description='User progress status',
    )


class CareerRoadmap(BaseModel):
    """A complete career roadmap with ordered steps.

    Returned by ``GET /careers/{slug}/roadmap``.  Includes both
    the career info and the full learning plan.
    """

    career_slug: str = Field(description='Career identifier')
    career_title: str = Field(description='Career display title')
    total_steps: int = Field(ge=0, description='Total number of steps in the roadmap')
    completed_steps: int = Field(ge=0, description='Number of steps completed by the user')
    estimated_total_minutes: int = Field(
        ge=0,
        description='Sum of estimated study time across all steps',
    )
    steps: list[RoadmapStep] = Field(description='Ordered roadmap steps')


class CareerProgress(BaseModel):
    """User's progress summary for a specific career.

    Provides a high-level view of how far along the user is in
    completing the career requirements.
    """

    career_slug: str = Field(description='Career identifier')
    career_title: str = Field(description='Career display title')
    total_requirements: int = Field(ge=0, description='Total number of requirements')
    completed_requirements: int = Field(ge=0, description='Number of completed requirements')
    in_progress_requirements: int = Field(ge=0, description='Number of requirements in progress')
    completion_percentage: float = Field(
        ge=0.0,
        le=100.0,
        description='Overall completion percentage',
    )
    last_activity_at: datetime | None = Field(
        default=None,
        description='Most recent progress update',
    )
