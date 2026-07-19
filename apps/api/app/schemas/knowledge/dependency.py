"""Dependency and prerequisite DTOs for the knowledge graph.

These schemas model the prerequisite relationships between nodes and
support dependency tree traversal for rendering roadmaps and learning
paths.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from uuid import UUID

    from app.models.enums import Difficulty, EdgeType, NodeType


class DependencyNode(BaseModel):
    """A single node in a dependency tree.

    Carries enough information to render the node in a tree or graph
    visualisation without requiring additional API calls.
    """

    id: UUID = Field(description='Unique node identifier')
    slug: str = Field(description='URL-friendly identifier', max_length=200)
    title: str = Field(description='Node display title', max_length=300)
    node_type: NodeType = Field(description='Type discriminator')
    difficulty: Difficulty = Field(description='Educational difficulty')
    estimated_minutes: int = Field(description='Estimated study time in minutes', ge=0)
    icon: str | None = Field(default=None, description='UI icon identifier')
    color: str | None = Field(default=None, description='Hex colour for UI', max_length=7)


class KnowledgeDependency(BaseModel):
    """A single dependency edge between two nodes.

    Describes how one node relates to another — used for prerequisite
    chains, "related to" associations, and graph edges in API responses.
    """

    source: DependencyNode = Field(
        description='Source / prerequisite node (the one you must learn first)',
    )
    target: DependencyNode = Field(
        description='Target / dependent node (the one that requires the source)',
    )
    relationship_type: EdgeType = Field(description='Semantic type of the relationship')
    description: str = Field(
        default='',
        description='Human-readable description of the relationship',
    )
    weight: float = Field(default=1.0, ge=0.0, le=1.0, description='Relationship strength')


class DependencyTree(BaseModel):
    """A nested dependency tree rooted at a specific node.

    The tree is built by traversing prerequisite edges recursively.
    Each node carries its own prerequisites as nested children,
    enabling the UI to render an indented roadmap or tree view.
    """

    node: DependencyNode = Field(description='The root node of this tree')
    depth: int = Field(ge=0, description='Depth from the root (0 = root node itself)')
    prerequisites: list[DependencyTree] = Field(
        default_factory=list,
        description='Prerequisite nodes (recursive — each has its own prerequisites)',
    )
    related: list[DependencyNode] = Field(
        default_factory=list,
        description='Related nodes (non-prerequisite relationships)',
    )
