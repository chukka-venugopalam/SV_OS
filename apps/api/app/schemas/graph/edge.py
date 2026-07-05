"""Graph edge DTO for visualisation and exploration.

The ``GraphEdge`` is the connection between two ``GraphNode``\'s,
carrying the relationship type, direction, and weight.
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import EdgeDirection, EdgeType


class GraphEdge(BaseModel):
    """A directed edge in the knowledge graph for visualisation.

    Maps directly to a ``KnowledgeEdge`` record but uses node slugs
    (instead of UUIDs) for readability in debug contexts and logs.
    """

    id: UUID = Field(description='Unique edge identifier')
    source_id: UUID = Field(description='Source node UUID')
    target_id: UUID = Field(description='Target node UUID')
    source_slug: str = Field(description='Source node slug', examples=['python'])
    target_slug: str = Field(description='Target node slug', examples=['fastapi'])
    relationship_type: EdgeType = Field(description='Semantic type of the relationship')
    direction: EdgeDirection = Field(
        default=EdgeDirection.FORWARD,
        description='Directionality of the edge',
    )
    description: str = Field(default='', description='Human-readable description of the relationship')
    weight: float = Field(default=1.0, ge=0.0, le=1.0, description='Relationship strength for layout')
