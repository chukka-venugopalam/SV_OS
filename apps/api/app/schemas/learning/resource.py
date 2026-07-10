"""Learning resource DTOs — summary, detail, and create contracts."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import Difficulty, ResourceType


class LearningResourceSummary(BaseModel):
    """Compact resource card for listing pages."""

    id: UUID = Field(description='Unique resource identifier')
    title: str = Field(description='Resource title', max_length=300)
    url: str = Field(description='URL to access the resource')
    resource_type: ResourceType = Field(description='Category of the resource')
    platform: str | None = Field(default=None, description='Platform name', max_length=100)
    is_free: bool = Field(description='Whether freely accessible')
    duration_minutes: int | None = Field(
        default=None, description='Estimated consumption time', ge=1
    )
    difficulty: Difficulty = Field(description='Resource difficulty level')
    language: str = Field(default='en', description='ISO language code', max_length=10)


class LearningResourceDetail(BaseModel):
    """Full resource detail with all metadata."""

    id: UUID = Field(description='Unique resource identifier')
    node_id: UUID = Field(description='Parent knowledge node identifier')
    title: str = Field(description='Resource title', max_length=300)
    url: str = Field(description='URL to access the resource')
    resource_type: ResourceType = Field(description='Category of the resource')
    platform: str | None = Field(default=None, description='Platform name', max_length=100)
    is_free: bool = Field(description='Whether freely accessible')
    duration_minutes: int | None = Field(
        default=None, description='Estimated consumption time', ge=1
    )
    difficulty: Difficulty = Field(description='Resource difficulty level')
    language: str = Field(default='en', description='ISO language code', max_length=10)


class LearningResourceCreate(BaseModel):
    """Request contract for adding a learning resource to a node."""

    title: str = Field(description='Resource title', max_length=300, min_length=1)
    url: str = Field(description='URL to access the resource', max_length=2000)
    resource_type: ResourceType = Field(description='Category of the resource')
    platform: str | None = Field(default=None, max_length=100, description='Platform name')
    is_free: bool = Field(default=True, description='Whether freely accessible')
    duration_minutes: int | None = Field(
        default=None, ge=1, le=99999, description='Estimated consumption time'
    )
    difficulty: Difficulty = Field(
        default=Difficulty.BEGINNER, description='Resource difficulty level'
    )
    language: str = Field(default='en', max_length=10, description='ISO language code')

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Ensure URL starts with http:// or https://."""
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v
