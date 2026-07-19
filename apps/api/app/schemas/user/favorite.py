"""Favorite DTOs — user-liked knowledge nodes for recommendations."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from app.models.enums import Difficulty, NodeType


class FavoriteCreate(BaseModel):
    """Request contract for favouriting a knowledge node."""

    node_id: UUID = Field(description='Knowledge node to favourite')


class FavoriteDetail(BaseModel):
    """A single favourite with node information."""

    id: UUID = Field(description='Unique favourite identifier')
    node_id: UUID = Field(description='Favourited knowledge node')
    node_slug: str = Field(description='Knowledge node slug')
    node_title: str = Field(description='Knowledge node title')
    node_type: NodeType = Field(description='Type of knowledge node')
    difficulty: Difficulty = Field(description='Node difficulty')
    estimated_minutes: int = Field(description='Estimated study time', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    created_at: datetime = Field(description='When the favourite was created')


class FavoriteList(BaseModel):
    """Paginated list of user favourites."""

    items: list[FavoriteDetail]
    total: int = Field(ge=0, description='Total favourites')
