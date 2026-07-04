"""Career recommendation and related career DTOs."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import DemandLevel


class RelatedCareer(BaseModel):
    """A career that is related to another career.

    Relatedness is determined by shared knowledge node requirements.
    """

    slug: str = Field(description='Career identifier', max_length=200)
    title: str = Field(description='Career title', max_length=300)
    demand_level: DemandLevel = Field(description='Market demand trend')
    overlap_score: float = Field(
        ge=0.0, le=1.0,
        description='Fraction of shared knowledge requirements (1.0 = identical requirements)',
    )


class CareerRecommendation(BaseModel):
    """A recommended career for a user.

    Recommendations are based on the user's current skills, progress,
    and preferences.
    """

    slug: str = Field(description='Career identifier', max_length=200)
    title: str = Field(description='Career title', max_length=300)
    description: str = Field(description='Short career description')
    demand_level: DemandLevel = Field(description='Market demand trend')
    average_salary: str | None = Field(default=None, description='Salary range display string')
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)

    # Recommendation-specific
    match_score: float = Field(
        ge=0.0, le=1.0,
        description='How well this career matches the user profile',
    )
    missing_requirements: int = Field(
        ge=0,
        description='Number of requirements the user has not yet completed',
    )
    reason: str | None = Field(
        default=None,
        description='Human-readable explanation for the recommendation',
        examples=['Your Python and SQL skills align well with data engineering'],
    )
