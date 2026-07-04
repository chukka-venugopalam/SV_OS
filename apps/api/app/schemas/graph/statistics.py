"""Graph statistics DTOs for dashboard and summary endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import EdgeType, NodeType


class NodeTypeCount(BaseModel):
    """Count of nodes grouped by node_type."""

    node_type: NodeType = Field(description='The node type')
    count: int = Field(ge=0, description='Number of nodes of this type')


class EdgeTypeCount(BaseModel):
    """Count of edges grouped by relationship_type."""

    relationship_type: EdgeType = Field(description='The edge type')
    count: int = Field(ge=0, description='Number of edges of this type')


class GraphStatistics(BaseModel):
    """Aggregate statistics about the knowledge graph.

    Provides summary metrics for dashboard widgets and graph
    overview pages. All counts are for published, non-deleted
    nodes and edges only.
    """

    total_nodes: int = Field(ge=0, description='Total number of published nodes')
    total_edges: int = Field(ge=0, description='Total number of edges')
    nodes_by_type: list[NodeTypeCount] = Field(description='Node counts grouped by type')
    edges_by_type: list[EdgeTypeCount] = Field(description='Edge counts grouped by relationship type')
    max_depth: int = Field(ge=0, description='Maximum prerequisite depth in the graph')
    avg_resources_per_node: float = Field(ge=0.0, description='Average number of learning resources per node')
    total_careers: int = Field(ge=0, description='Total number of published careers')
    total_projects: int = Field(ge=0, description='Total number of published projects')
