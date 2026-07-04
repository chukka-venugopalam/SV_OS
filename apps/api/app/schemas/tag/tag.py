"""Tag DTOs with multiple representations.

Tags are free-form labels for categorising knowledge nodes. These
schemas support the tagging system with summary, detail, and
association DTOs.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TagSummary(BaseModel):
    """Compact tag representation for grids and filter lists."""

    id: UUID = Field(description='Unique tag identifier')
    name: str = Field(description='Tag name (lowercase, hyphenated)', max_length=100)
    description: str | None = Field(default=None, description='Optional description of the tag intent')
    node_count: int = Field(default=0, ge=0, description='Number of nodes with this tag')


class TagDetail(BaseModel):
    """Full tag detail with metadata."""

    id: UUID = Field(description='Unique tag identifier')
    name: str = Field(description='Tag name (lowercase, hyphenated)', max_length=100)
    description: str | None = Field(default=None, description='Optional description of the tag intent')
    created_at: datetime = Field(description='When the tag was created')
    updated_at: datetime = Field(description='When the tag was last updated')

    # Relationship counts
    node_count: int = Field(default=0, ge=0, description='Number of nodes with this tag')


class TagCreate(BaseModel):
    """Request contract for creating a new tag."""

    name: str = Field(
        description='Unique tag name (lowercase, hyphenated)',
        max_length=100,
        min_length=1,
        pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
        examples=['beginner-friendly', 'math-heavy', 'web-dev'],
    )
    description: str | None = Field(
        default=None,
        max_length=5000,
        description='Optional description of the tag intent',
    )


class TagUpdate(BaseModel):
    """Request contract for updating a tag.

    All fields are optional — only provided fields will be updated.
    """

    description: str | None = Field(default=None, max_length=5000)


class NodeTagInfo(BaseModel):
    """Association between a node and a tag.

    Returned when listing tags attached to a knowledge node, or
    nodes attached to a tag.
    """

    node_id: UUID = Field(description='Knowledge node identifier')
    tag_id: UUID = Field(description='Tag identifier')
    tag_name: str = Field(description='Tag name', max_length=100)
    node_slug: str | None = Field(default=None, description='Knowledge node slug')
    node_title: str | None = Field(default=None, description='Knowledge node title')


class NodeTagCreate(BaseModel):
    """Request contract for attaching a tag to a node."""

    tag_id: UUID = Field(description='Tag identifier to attach')
    node_id: UUID | None = Field(
        default=None,
        description='Knowledge node identifier (inferred from URL if not provided)',
    )


class TagList(BaseModel):
    """Paginated list of tags."""

    items: list[TagSummary]
    total: int = Field(ge=0, description='Total tags matching the query')
