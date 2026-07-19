"""Search history DTOs — recording and retrieving past searches."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID


class SearchHistoryCreate(BaseModel):
    """Request contract for recording a search in history."""

    query: str = Field(description='Search query text', max_length=500, min_length=1)
    filters: dict = Field(default_factory=dict, description='Filters applied during search')
    results_count: int = Field(default=0, ge=0, description='Number of results returned')


class SearchHistoryResponse(BaseModel):
    """A single search history entry returned by the API."""

    id: UUID = Field(description='Unique search history identifier')
    query: str = Field(description='Search query text')
    filters: dict = Field(default_factory=dict, description='Filters applied during search')
    results_count: int = Field(default=0, ge=0, description='Number of results returned')
    created_at: datetime = Field(description='When the search was performed')
