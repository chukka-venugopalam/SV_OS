"""Search result DTOs with highlighting, grouping, and suggestions."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.models.enums import Difficulty, NodeType


class HighlightFragment(BaseModel):
    """A single text fragment with match highlighting information."""

    field: str = Field(
        description='The field that matched (title, description, content)',
        examples=['title', 'description'],
    )
    text: str = Field(
        description='Text fragment with matched segment',
        examples=['Learn <mark>Python</mark> from scratch'],
    )


class SearchResult(BaseModel):
    """A single search result with highlights and metadata."""

    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Node display title', max_length=300)
    description: str = Field(description='Short abstract / summary')
    node_type: NodeType = Field(description='Type discriminator')
    difficulty: Difficulty = Field(description='Educational difficulty')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)
    is_published: bool = Field(description='Whether publicly visible')

    # Search-specific
    rank: float = Field(default=0.0, description='Relevance rank (higher = more relevant)')
    highlights: list[HighlightFragment] = Field(
        default_factory=list,
        description='Highlighted text fragments',
    )


class GroupedResult(BaseModel):
    """Search results grouped by node_type for faceted display."""

    node_type: NodeType = Field(description='The group / node type')
    total: int = Field(ge=0, description='Total results in this group')
    items: list[SearchResult] = Field(description='Results in this group')


class SearchSuggestion(BaseModel):
    """A single autocomplete suggestion."""

    text: str = Field(description='Suggested search query', examples=['python', 'react tutorial'])
    node_type: NodeType | None = Field(default=None, description='Node type of the top result')
    result_count: int = Field(ge=0, description='Number of results for this suggestion')
