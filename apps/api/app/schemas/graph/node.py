"""Graph node DTO for visualisation and exploration.

The ``GraphNode`` is the vertex representation used in graph
endpoints. It carries visual styling and position hints so the
frontend can render it without additional lookups.
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import Difficulty, NodeType


class GraphNode(BaseModel):
    """A node in the knowledge graph, as returned by graph endpoints.

    Designed for visualisation: carries position hints (x, y for
    force-directed layouts), styling (icon, color), and sizing
    (size based on view_count or importance).
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
    view_count: int = Field(default=0, description='Popularity indicator for sizing', ge=0)

    # Layout hints (null until computed by layout engine)
    x: float | None = Field(default=None, description='X position in visualisation layout')
    y: float | None = Field(default=None, description='Y position in visualisation layout')
