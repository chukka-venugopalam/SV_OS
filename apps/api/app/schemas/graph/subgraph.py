"""Subgraph, neighborhood, and traversal result DTOs.

These schemas model subsets of the knowledge graph returned by
exploration and traversal endpoints.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.graph.edge import GraphEdge
from app.schemas.graph.node import GraphNode


class Neighborhood(BaseModel):
    """A node and its immediate neighbours in the graph.

    Returns the centre node plus all directly connected nodes and
    edges, enabling the frontend to render a localised graph view
    without loading the entire graph.
    """

    centre: GraphNode = Field(description='The central / focal node')
    nodes: list[GraphNode] = Field(description='All nodes in the neighbourhood (including centre)')
    edges: list[GraphEdge] = Field(description='All edges connecting nodes in this neighbourhood')


class Subgraph(BaseModel):
    """A subset of the knowledge graph.

    Contains a list of nodes and the edges that connect them.
    Used for filtered views, search-scoped graphs, and layout
    computations.
    """

    nodes: list[GraphNode] = Field(description='Nodes in this subgraph')
    edges: list[GraphEdge] = Field(description='Edges connecting the nodes')


class TraversalResult(BaseModel):
    """Result of a graph traversal operation.

    Returns the path from source to target with metadata about
    the traversal (depth, number of nodes visited, etc.).
    """

    path: list[GraphNode] = Field(
        description='Ordered list of nodes from source to target',
    )
    edges: list[GraphEdge] = Field(
        description='Edges along the traversal path',
    )
    depth: int = Field(ge=0, description='Traversal depth (number of edges)')
    nodes_visited: int = Field(ge=0, description='Total nodes visited during traversal')
