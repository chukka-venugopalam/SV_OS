"""Learning history and search history DTOs."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType, ProgressStatus


class LearningHistoryItem(BaseModel):
    """A single learning history entry — a progress record on a node."""

    node_id: UUID = Field(description='Knowledge node identifier')
    node_slug: str = Field(description='Knowledge node slug')
    node_title: str = Field(description='Knowledge node title')
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty')
    estimated_minutes: int = Field(description='Estimated study time', ge=0)
    status: ProgressStatus = Field(description='Current progress status')
    time_spent_minutes: int = Field(default=0, ge=0, description='Total time spent in minutes')
    started_at: datetime | None = Field(default=None, description='When learning started')
    completed_at: datetime | None = Field(default=None, description='When completed')
    updated_at: datetime = Field(description='When the progress was last updated')


class SearchHistoryItem(BaseModel):
    """A single search history entry."""

    id: UUID = Field(description='Unique search history identifier')
    query: str = Field(description='Search query text')
    filters: dict = Field(default_factory=dict, description='Filters applied during search')
    results_count: int = Field(default=0, ge=0, description='Number of results returned')
    created_at: datetime = Field(description='When the search was performed')


class SearchHistoryCreate(BaseModel):
    """Request contract for recording a search in history."""

    query: str = Field(description='Search query text', max_length=500)
    filters: dict = Field(default_factory=dict, description='Filters applied')
    results_count: int = Field(default=0, ge=0, description='Number of results returned')
