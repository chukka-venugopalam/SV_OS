"""Knowledge node DTOs with multiple representations.

The same underlying data is projected into different shapes depending
on the use case:

- ``KnowledgeNodeCard`` — Compact card for grids and lists
- ``KnowledgeNodeSummary`` — Standard list item with metadata
- ``KnowledgeNodeDetail`` — Full detail view with all relationships
- ``KnowledgeNodeCreate`` / ``KnowledgeNodeUpdate`` — Mutation contracts
- ``KnowledgeNodeLink`` — Minimal reference for embedding in other DTOs
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import Difficulty, NodeType


class KnowledgeNodeLink(BaseModel):
    """Minimal node reference for embedding in other DTOs.

    Used when a node appears as a relationship target in career,
    project, or edge contexts.
    """

    id: UUID = Field(description='Unique node identifier')
    slug: str = Field(description='URL-friendly identifier', examples=['python-basics'])
    title: str = Field(description='Node display title', max_length=300)
    node_type: NodeType = Field(description='Type discriminator')


class KnowledgeNodeCard(BaseModel):
    """Compact card representation for grids and lists.

    Contains just enough information to render a clickable card.
    """

    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Node display title', max_length=300)
    description: str = Field(description='Short abstract / summary')
    node_type: NodeType = Field(description='Type discriminator')
    difficulty: Difficulty = Field(description='Educational difficulty')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    is_published: bool = Field(description='Whether publicly visible')

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate hex colour format."""
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must start with #')
        return v


class KnowledgeNodeSummary(BaseModel):
    """Standard list item with engagement metadata.

    Used in search results, filtered lists, and dashboard widgets.
    """

    id: UUID = Field(description='Unique node identifier')
    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Node display title', max_length=300)
    description: str = Field(description='Short abstract / summary')
    node_type: NodeType = Field(description='Type discriminator')
    difficulty: Difficulty = Field(description='Educational difficulty')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    view_count: int = Field(default=0, description='Total page view count', ge=0)
    is_published: bool = Field(description='Whether publicly visible')
    created_at: datetime = Field(description='When the node was created')
    updated_at: datetime = Field(description='When the node was last updated')
    tags: list[str] = Field(default_factory=list, description='Tag names attached to this node')


class KnowledgeNodeDetail(BaseModel):
    """Full detail view exposing all node data and relationships.

    This is the richest representation, loaded when a user navigates
    to a specific node page.  Embedded relationships are represented
    as ``KnowledgeNodeLink`` to avoid deep nesting.
    """

    id: UUID = Field(description='Unique node identifier')
    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Node display title', max_length=300)
    description: str = Field(description='Short abstract / summary')
    content: str | None = Field(default=None, description='Full rich-text / Markdown body')
    node_type: NodeType = Field(description='Type discriminator')
    difficulty: Difficulty = Field(description='Educational difficulty')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')
    view_count: int = Field(default=0, description='Total page view count', ge=0)
    is_published: bool = Field(description='Whether publicly visible')
    created_at: datetime = Field(description='When the node was created')
    updated_at: datetime = Field(description='When the node was last updated')
    tags: list[str] = Field(default_factory=list, description='Tag names attached to this node')

    # Relationship counts (not full lists — those are separate endpoints)
    prerequisite_count: int = Field(default=0, description='Number of prerequisite nodes', ge=0)
    resource_count: int = Field(default=0, description='Number of learning resources', ge=0)
    career_count: int = Field(
        default=0, description='Number of careers referencing this node', ge=0
    )
    project_count: int = Field(
        default=0, description='Number of projects referencing this node', ge=0
    )

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate hex colour format."""
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must start with #')
        return v


class KnowledgeNodeCreate(BaseModel):
    """Request contract for creating a new knowledge node."""

    slug: str = Field(
        description='URL-friendly unique identifier',
        max_length=200,
        pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$',
        examples=['python-basics'],
    )
    title: str = Field(description='Node display title', max_length=300, min_length=1)
    description: str = Field(description='Short abstract / summary', max_length=5000)
    content: str | None = Field(default=None, description='Full rich-text / Markdown body')
    node_type: NodeType = Field(description='Type discriminator')
    difficulty: Difficulty = Field(
        default=Difficulty.BEGINNER, description='Educational difficulty'
    )
    estimated_minutes: int = Field(
        default=30, ge=1, le=99999, description='Estimated study time in minutes'
    )
    icon: str | None = Field(default=None, max_length=50, description='UI icon identifier')
    color: str | None = Field(default=None, max_length=7, description='Hex colour for UI')
    metadata: dict = Field(default_factory=dict, description='Arbitrary metadata')
    is_published: bool = Field(default=True, description='Whether publicly visible')

    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Ensure slug is lowercase and URL-safe."""
        if v != v.lower():
            raise ValueError('Slug must be lowercase')
        return v

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate hex colour format."""
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must start with #')
        return v


class KnowledgeNodeUpdate(BaseModel):
    """Request contract for updating an existing knowledge node.

    All fields are optional — only provided fields will be updated.
    """

    title: str | None = Field(default=None, max_length=300, min_length=1)
    description: str | None = Field(default=None, max_length=5000)
    content: str | None = Field(default=None)
    difficulty: Difficulty | None = Field(default=None)
    estimated_minutes: int | None = Field(default=None, ge=1, le=99999)
    icon: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=7)
    metadata: dict | None = Field(default=None)
    is_published: bool | None = Field(default=None)

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate hex colour format."""
        if v is not None and not v.startswith('#'):
            raise ValueError('Color must start with #')
        return v


class KnowledgeNodeList(BaseModel):
    """Paginated list of knowledge node summaries."""

    items: list[KnowledgeNodeSummary]
    total: int = Field(ge=0, description='Total nodes matching the query')
