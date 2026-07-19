"""Learning session DTOs — study session tracking."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from app.models.enums import LearningStatus


class LearningSessionCreate(BaseModel):
    """Request contract for starting a new learning session."""

    node_id: UUID = Field(description='Knowledge node to study')
    notes: str | None = Field(default=None, max_length=5000, description='Initial session notes')


class LearningSessionUpdate(BaseModel):
    """Request contract for updating a learning session."""

    status: LearningStatus | None = Field(default=None, description='New session status')
    ended_at: datetime | None = Field(default=None, description='When the session ended')
    duration_minutes: int | None = Field(
        default=None,
        ge=1,
        le=9999,
        description='Minutes spent studying',
    )
    notes: str | None = Field(default=None, max_length=5000, description='Session notes')


class SessionSummary(BaseModel):
    """A single learning session summary."""

    id: UUID = Field(description='Unique session identifier')
    node_id: UUID = Field(description='Knowledge node studied')
    node_slug: str = Field(description='Knowledge node slug')
    node_title: str = Field(description='Knowledge node title')
    status: LearningStatus = Field(description='Current session status')
    started_at: datetime | None = Field(default=None, description='When the session started')
    ended_at: datetime | None = Field(default=None, description='When the session ended')
    duration_minutes: int | None = Field(default=None, description='Minutes spent studying', ge=1)
    notes: str | None = Field(default=None, description='Session notes')
