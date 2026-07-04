"""Career DTOs — overview, detail, and mutation contracts."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import DemandLevel


class CareerCard(BaseModel):
    """Compact career card for grids and listing pages."""

    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Career title', max_length=300)
    description: str = Field(description='Short career description')
    demand_level: DemandLevel = Field(description='Market demand trend')
    average_salary: str | None = Field(default=None, description='Salary range display string')
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    is_published: bool = Field(description='Whether publicly visible')

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must start with #')
        return v


class CareerOverview(BaseModel):
    """Career overview with key metrics for the detail page header."""

    id: UUID = Field(description='Unique career identifier')
    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Career title', max_length=300)
    description: str = Field(description='Detailed career description')
    demand_level: DemandLevel = Field(description='Market demand trend')
    average_salary: str | None = Field(default=None, description='Salary range display string')
    required_experience: str | None = Field(default=None, description='Experience level needed')
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    is_published: bool = Field(description='Whether publicly visible')
    created_at: datetime = Field(description='When the career was created')
    updated_at: datetime = Field(description='When the career was last updated')

    # Relationship counts
    requirement_count: int = Field(default=0, ge=0, description='Number of knowledge requirements')


class CareerDetail(BaseModel):
    """Full career detail with all associated data."""

    id: UUID = Field(description='Unique career identifier')
    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Career title', max_length=300)
    description: str = Field(description='Detailed career description')
    demand_level: DemandLevel = Field(description='Market demand trend')
    average_salary: str | None = Field(default=None, description='Salary range display string')
    required_experience: str | None = Field(default=None, description='Experience level needed')
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')
    is_published: bool = Field(description='Whether publicly visible')
    created_at: datetime = Field(description='When the career was created')
    updated_at: datetime = Field(description='When the career was last updated')


class CareerCreate(BaseModel):
    """Request contract for creating a new career."""

    slug: str = Field(
        description='URL-friendly unique identifier',
        max_length=200,
        pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
        examples=['frontend-developer'],
    )
    title: str = Field(description='Career title', max_length=300, min_length=1)
    description: str = Field(description='Detailed career description', max_length=10000)
    demand_level: DemandLevel = Field(default=DemandLevel.GROWING, description='Market demand trend')
    average_salary: str | None = Field(default=None, max_length=100, description='Salary range display string')
    required_experience: str | None = Field(default=None, max_length=50, description='Experience level needed')
    icon: str | None = Field(default=None, max_length=50, description='UI icon identifier')
    color: str | None = Field(default=None, max_length=7, description='Hex colour for UI')
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')
    is_published: bool = Field(default=True, description='Whether publicly visible')

    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if v != v.lower():
            raise ValueError('Slug must be lowercase')
        return v

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must start with #')
        return v


class CareerUpdate(BaseModel):
    """Request contract for updating an existing career."""

    title: str | None = Field(default=None, max_length=300, min_length=1)
    description: str | None = Field(default=None, max_length=10000)
    demand_level: DemandLevel | None = Field(default=None)
    average_salary: str | None = Field(default=None, max_length=100)
    required_experience: str | None = Field(default=None, max_length=50)
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=7)
    metadata: dict | None = Field(default=None)
    is_published: bool | None = Field(default=None)

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must start with #')
        return v
