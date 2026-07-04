"""Project learning outcomes and technology stack DTOs."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TechStack(BaseModel):
    """A technology used in a project with metadata."""

    name: str = Field(description='Technology name', max_length=100)
    category: str | None = Field(
        default=None,
        description='Technology category',
        examples=['Language', 'Framework', 'Database', 'Tool'],
    )
    is_primary: bool = Field(
        default=True,
        description='Whether this is a primary technology (vs supporting)',
    )


class LearningOutcome(BaseModel):
    """A specific learning outcome achieved by completing a project."""

    description: str = Field(
        description='What the learner will be able to do after completing this project',
        max_length=1000,
        examples=['Design and implement a RESTful API with FastAPI'],
    )
    category: str | None = Field(
        default=None,
        description='Outcome category',
        examples=['Backend', 'Frontend', 'DevOps', 'Database'],
    )
    is_primary: bool = Field(
        default=True,
        description='Whether this is a primary learning outcome (vs secondary)',
    )
