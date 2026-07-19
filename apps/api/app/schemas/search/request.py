"""Search request DTOs — search, autocomplete, and filter contracts."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.models.enums import Difficulty, NodeType


class SearchRequest(BaseModel):
    """Request contract for the main search endpoint."""

    q: str = Field(
        description='Search query text',
        max_length=200,
        min_length=1,
        examples=['python', 'react tutorial'],
    )
    node_type: NodeType | None = Field(
        default=None,
        description='Filter by node type',
        examples=['subject', 'concept', 'technology'],
    )
    difficulty: Difficulty | None = Field(
        default=None,
        description='Filter by difficulty level',
    )
    is_published: bool = Field(
        default=True,
        description='Only include published nodes',
    )
    page: int = Field(default=1, ge=1, description='Page number')
    per_page: int = Field(default=20, ge=1, le=100, description='Results per page')


class AutocompleteRequest(BaseModel):
    """Request contract for the autocomplete endpoint."""

    q: str = Field(
        description='Partial search query',
        max_length=100,
        min_length=1,
        examples=['pyt', 'rea'],
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=20,
        description='Maximum number of suggestions',
    )


class FilterRequest(BaseModel):
    """Request contract for fetching available search filters.

    Returns the available node types, difficulties, and other filter
    options without returning search results.
    """

    q: str | None = Field(
        default=None,
        description='Optional search query for relevance',
        max_length=200,
    )
