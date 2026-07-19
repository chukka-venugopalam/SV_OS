"""Graph Capability — explore graph structure and retrieve subgraphs.

Orchestrates: GraphEngine, TraversalEngine, KnowledgeEngine
"""

from __future__ import annotations

from uuid import UUID
from typing import Any


class GraphCapability:
    """Graph Capability — public API for graph exploration."""

    def __init__(self) -> None:
        # TODO: Inject GraphEngine, TraversalEngine, KnowledgeEngine
        pass

    async def get_node(self, node_id: UUID) -> dict | None:
        """Get a single knowledge node with content and metadata."""
        raise NotImplementedError

    async def get_subgraph(
        self, center_node_id: UUID, depth: int = 2
    ) -> dict:
        """Get a subgraph around a center node for visualization."""
        raise NotImplementedError

    async def get_statistics(self) -> dict:
        """Get graph-level statistics."""
        raise NotImplementedError
