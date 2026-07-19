"""Path-finding DTOs for graph traversal endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.schemas.graph.edge import GraphEdge
    from app.schemas.graph.node import GraphNode


class PathStep(BaseModel):
    """A single step in a traversal path.

    Each step represents moving from one node to another via an edge.
    Useful for animating transitions in the UI.
    """

    from_node: GraphNode = Field(description='The source node of this step')
    to_node: GraphNode = Field(description='The target node of this step')
    via_edge: GraphEdge = Field(description='The edge connecting the two nodes')
    step_number: int = Field(ge=1, description='Position of this step in the path')


class ShortestPath(BaseModel):
    """Result of a shortest-path query between two nodes.

    Returns the minimal path as both a flat node list and a sequence
    of steps for animation, plus aggregate metrics.
    """

    source: GraphNode = Field(description='The starting node')
    target: GraphNode = Field(description='The destination node')
    nodes: list[GraphNode] = Field(description='All nodes along the path (ordered source → target)')
    edges: list[GraphEdge] = Field(description='All edges along the path (ordered)')
    steps: list[PathStep] = Field(description='Step-by-step breakdown for animation')
    total_weight: float = Field(ge=0.0, description='Sum of edge weights along the path')
    depth: int = Field(ge=0, description='Number of edges in the path')
