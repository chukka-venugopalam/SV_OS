"""Search result DTOs for knowledge node search.

Provides multiple representations of search results including
highlighted fragments and grouped results.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType


class SearchHighlight(BaseModel):
    """A highlighted text fragment from a search result."""

    field: str = Field(
        description='The field that matched (title, description, content)',
        examples=['title', 'description', 'content'],
    )
    fragment: str = Field(
        description='Highlighted text fragment with <mark> tags',
        examples=['Learn <mark>Python</mark> from scratch'],
    )


class KnowledgeSearchResult(BaseModel):
    """A single node search result with relevance information.

    Includes the matched fields as highlights so the UI can render
    them with emphasis.  The rank helps sort results.
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

    # Search-specific
    rank: float = Field(default=0.0, description='Relevance ranking score (higher = more relevant)')
    highlights: list[SearchHighlight] = Field(
        default_factory=list,
        description='Highlighted text fragments from matched fields',
    )


class GroupedSearchResult(BaseModel):
    """Search results grouped by node_type.

    Enables the UI to show sections like "Subjects", "Concepts",
    "Technologies" with counts for each group.
    """

    node_type: NodeType = Field(description='The group / node type')
    total: int = Field(ge=0, description='Total results in this group')
    items: list[KnowledgeSearchResult] = Field(
        description='Search results in this group',
    )
