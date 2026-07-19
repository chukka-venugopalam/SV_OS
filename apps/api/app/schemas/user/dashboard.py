"""User dashboard DTOs — overview and statistics for the home screen."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from app.models.enums import Difficulty, NodeType, ProgressStatus


class InProgressItem(BaseModel):
    """A simplified in-progress item for the dashboard."""

    node_slug: str = Field(description='Knowledge node slug')
    node_title: str = Field(description='Knowledge node title')
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty')
    status: ProgressStatus = Field(description='Current progress status')
    time_spent_minutes: int = Field(default=0, ge=0, description='Time spent so far')
    estimated_minutes: int = Field(default=0, ge=0, description='Estimated total time')


class DashboardRecommendation(BaseModel):
    """A simplified recommendation card for the dashboard."""

    node_slug: str = Field(description='Recommended node slug')
    node_title: str = Field(description='Recommended node title')
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty')
    reason: str | None = Field(default=None, description='Why this was recommended')


class RecentActivity(BaseModel):
    """A single recent activity entry for the dashboard feed."""

    id: UUID = Field(description='Activity identifier')
    activity_type: str = Field(
        description='Type of activity',
        examples=['progress_update', 'bookmark_added', 'session_started', 'node_completed'],
    )
    node_slug: str | None = Field(default=None, description='Related node slug')
    node_title: str | None = Field(default=None, description='Related node title')
    description: str = Field(description='Human-readable activity description')
    timestamp: datetime = Field(description='When the activity occurred')


class UserStatistics(BaseModel):
    """Aggregated user statistics for the dashboard."""

    total_nodes_studied: int = Field(ge=0, description='Total distinct nodes studied')
    total_time_minutes: int = Field(ge=0, description='Total learning time in minutes')
    completed_nodes: int = Field(ge=0, description='Nodes completed')
    mastered_nodes: int = Field(ge=0, description='Nodes mastered')
    total_bookmarks: int = Field(ge=0, description='Total bookmarks')
    total_favorites: int = Field(ge=0, description='Total favourites')
    current_streak_days: int = Field(ge=0, description='Consecutive days of activity')
    longest_streak_days: int = Field(ge=0, description='Longest streak ever')


class DashboardSummary(BaseModel):
    """Complete user dashboard data for the home screen."""

    statistics: UserStatistics = Field(description='Aggregated user statistics')
    in_progress: list[InProgressItem] = Field(
        default_factory=list,
        description='Nodes currently in progress',
    )
    recent_activity: list[RecentActivity] = Field(
        default_factory=list,
        description='Recent activity feed (last 20 items)',
    )
    recommendations: list[DashboardRecommendation] = Field(
        default_factory=list,
        description='Personalised node recommendations',
    )
    updated_at: datetime = Field(description='When the dashboard was generated')
