"""Knowledge recommendation DTOs.

These schemas represent personalised content suggestions. They are
produced by the recommendation engine (future phase) but defined
here as stable API contracts.
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType


class KnowledgeRecommendation(BaseModel):
    """A single recommendation linking a user to a knowledge node.

    Carries the relevance score and a human-readable explanation so
    the UI can display "why this was recommended" information.
    """

    id: UUID = Field(description='Unique recommendation identifier')
    node_slug: str = Field(description='URL-friendly identifier of the recommended node')
    node_title: str = Field(description='Title of the recommended node')
    node_type: NodeType = Field(description='Type of the recommended node')
    difficulty: Difficulty = Field(description='Difficulty of the recommended node')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)

    # Recommendation-specific
    reason: str | None = Field(
        default=None,
        description='Human-readable explanation of why this was recommended',
        examples=[
            'Based on your interest in Python',
            'Popular among learners who completed SQL Basics',
        ],
    )
    score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description='Relevance score (higher = more relevant)',
    )
    is_dismissed: bool = Field(
        default=False,
        description='Whether the user dismissed this recommendation',
    )
