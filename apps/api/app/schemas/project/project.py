"""Project DTOs — card, detail, and mutation contracts."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field, field_validator

from app.models.enums import Difficulty

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID


class ProjectCard(BaseModel):
    """Compact project card for grids and listing pages."""

    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Project title', max_length=300)
    description: str = Field(description='Short project description')
    difficulty: Difficulty = Field(description='Project difficulty level')
    estimated_hours: int = Field(description='Estimated time to complete', ge=0)
    tech_stack: list[str] = Field(default_factory=list, description='Technologies used')
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    is_published: bool = Field(description='Whether publicly visible')

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith('#'):
            msg = 'Color must start with #'
            raise ValueError(msg)
        return v


class ProjectDetail(BaseModel):
    """Full project detail with all metadata."""

    id: UUID = Field(description='Unique project identifier')
    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Project title', max_length=300)
    description: str = Field(description='Detailed project description')
    difficulty: Difficulty = Field(description='Project difficulty level')
    estimated_hours: int = Field(description='Estimated time to complete', ge=0)
    tech_stack: list[str] = Field(default_factory=list, description='Technologies used')
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')
    is_published: bool = Field(description='Whether publicly visible')
    created_at: datetime = Field(description='When the project was created')
    updated_at: datetime = Field(description='When the project was last updated')

    # Relationship counts
    requirement_count: int = Field(default=0, ge=0, description='Number of knowledge requirements')


class ProjectCreate(BaseModel):
    """Request contract for creating a new project."""

    slug: str = Field(
        description='URL-friendly unique identifier',
        max_length=200,
        pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
        examples=['build-a-rest-api'],
    )
    title: str = Field(description='Project title', max_length=300, min_length=1)
    description: str = Field(description='Detailed project description', max_length=10000)
    difficulty: Difficulty = Field(
        default=Difficulty.INTERMEDIATE,
        description='Project difficulty level',
    )
    estimated_hours: int = Field(
        default=10,
        ge=1,
        le=9999,
        description='Estimated time to complete',
    )
    tech_stack: list[str] = Field(default_factory=list, description='Technologies used')
    icon: str | None = Field(default=None, max_length=50, description='UI icon identifier')
    color: str | None = Field(default=None, max_length=7, description='Hex colour for UI')
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')
    is_published: bool = Field(default=True, description='Whether publicly visible')

    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if v != v.lower():
            msg = 'Slug must be lowercase'
            raise ValueError(msg)
        return v

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith('#'):
            msg = 'Color must start with #'
            raise ValueError(msg)
        return v


class ProjectUpdate(BaseModel):
    """Request contract for updating an existing project."""

    title: str | None = Field(default=None, max_length=300, min_length=1)
    description: str | None = Field(default=None, max_length=10000)
    difficulty: Difficulty | None = Field(default=None)
    estimated_hours: int | None = Field(default=None, ge=1, le=9999)
    tech_stack: list[str] | None = Field(default=None)
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=7)
    metadata: dict | None = Field(default=None)
    is_published: bool | None = Field(default=None)

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith('#'):
            msg = 'Color must start with #'
            raise ValueError(msg)
        return v
