"""Bookmark DTOs — user-saved knowledge nodes."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from app.models.enums import Difficulty, NodeType


class BookmarkCreate(BaseModel):
    """Request contract for creating a bookmark."""

    node_id: UUID = Field(description='Knowledge node to bookmark')
    notes: str | None = Field(default=None, max_length=5000, description='Personal note')


class BookmarkDetail(BaseModel):
    """A single bookmark with node information."""

    id: UUID = Field(description='Unique bookmark identifier')
    node_id: UUID = Field(description='Bookmarked knowledge node')
    node_slug: str = Field(description='Knowledge node slug')
    node_title: str = Field(description='Knowledge node title')
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty')
    estimated_minutes: int = Field(description='Estimated study time', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    notes: str | None = Field(default=None, description='Personal note')
    created_at: datetime = Field(description='When the bookmark was created')


class BookmarkList(BaseModel):
    """Paginated list of user bookmarks."""

    items: list[BookmarkDetail]
    total: int = Field(ge=0, description='Total bookmarks')
