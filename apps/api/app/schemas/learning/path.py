"""Learning path DTOs — curated sequences of knowledge nodes."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from app.models.enums import Difficulty


class PathNode(BaseModel):
    """A single node in a learning path sequence."""

    node_id: UUID = Field(description='Knowledge node identifier')
    slug: str = Field(description='URL-friendly identifier')
    title: str = Field(description='Node display title')
    difficulty: Difficulty = Field(description='Node difficulty level')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    order: int = Field(ge=0, description='Position in the learning path (0-indexed)')
    optional: bool = Field(default=False, description='Whether this node is optional in the path')


class LearningPathSummary(BaseModel):
    """Compact learning path card for listing pages."""

    id: UUID = Field(description='Unique path identifier')
    title: str = Field(description='Path title', max_length=300)
    description: str | None = Field(default=None, description='Short path description')
    difficulty: Difficulty = Field(description='Overall path difficulty')
    estimated_hours: int | None = Field(default=None, description='Estimated total time', ge=1)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    is_published: bool = Field(description='Whether publicly visible')
    node_count: int = Field(default=0, ge=0, description='Number of nodes in the path')
    created_at: datetime = Field(description='When the path was created')


class LearningPathDetail(BaseModel):
    """Full learning path detail with all nodes in order."""

    id: UUID = Field(description='Unique path identifier')
    title: str = Field(description='Path title', max_length=300)
    description: str | None = Field(default=None, description='Short path description')
    difficulty: Difficulty = Field(description='Overall path difficulty')
    estimated_hours: int | None = Field(default=None, description='Estimated total time', ge=1)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    is_published: bool = Field(description='Whether publicly visible')
    nodes: list[PathNode] = Field(description='Ordered list of nodes in the path')
    created_at: datetime = Field(description='When the path was created')
    updated_at: datetime = Field(description='When the path was last updated')
