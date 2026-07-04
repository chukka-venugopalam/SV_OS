"""User progress DTOs — tracking learning status on knowledge nodes."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType, ProgressStatus


class ProgressUpdate(BaseModel):
    """Request contract for updating progress on a knowledge node."""

    status: ProgressStatus = Field(description='New progress status')
    notes: str | None = Field(default=None, max_length=5000, description='Personal notes')


class ProgressDetail(BaseModel):
    """A single progress record for a user on a knowledge node."""

    id: UUID = Field(description='Unique progress identifier')
    node_id: UUID = Field(description='Knowledge node identifier')
    node_slug: str = Field(description='Knowledge node slug')
    node_title: str = Field(description='Knowledge node title')
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty')
    estimated_minutes: int = Field(description='Estimated study time', ge=0)
    status: ProgressStatus = Field(description='Current progress status')
    started_at: datetime | None = Field(default=None, description='When learning started')
    completed_at: datetime | None = Field(default=None, description='When completed')
    mastered_at: datetime | None = Field(default=None, description='When mastered')
    time_spent_minutes: int = Field(default=0, ge=0, description='Total time spent in minutes')
    notes: str | None = Field(default=None, description='Personal notes')
    updated_at: datetime = Field(description='When progress was last updated')


class ProgressStatistics(BaseModel):
    """Aggregated progress statistics for a user."""

    total_nodes: int = Field(ge=0, description='Total nodes in the system')
    not_started: int = Field(ge=0, description='Nodes not yet started')
    in_progress: int = Field(ge=0, description='Nodes currently being learned')
    completed: int = Field(ge=0, description='Nodes completed')
    mastered: int = Field(ge=0, description='Nodes mastered')
    total_time_minutes: int = Field(ge=0, description='Total learning time across all nodes')
    completion_percentage: float = Field(
        ge=0.0, le=100.0,
        description='Overall completion percentage (completed + mastered)',
    )
