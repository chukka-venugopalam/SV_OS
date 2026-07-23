"""Graph service — business logic for knowledge graph operations.

Graph algorithms (shortest path, ranking, traversal) live here.
Persistence queries are delegated to ``GraphRepository``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

from app.models.knowledge_node import KnowledgeNode

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)


class GraphService:
    """Business logic for knowledge graph operations.

    Composes graph traversal, node neighborhood exploration, and
    edge queries using the read-only ``GraphRepository`` and
    other repositories as needed.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    # ── Neighborhood Exploration ───────────────────────────────────

    async def get_neighborhood(
        self,
        node_id: UUID,
        _depth: int = 1,
        relationship_type: str | None = None,
    ) -> dict:
        """Get the neighborhood around a node up to a given depth.

        Returns a dict with ``node``, ``neighbors`` (outgoing and incoming),
        and ``edges``.
        """
        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        if not node:
            return {'node': None, 'neighbors': {'outgoing': [], 'incoming': []}, 'edges': []}

        neighbors = await self._uow.graph.load_all_neighbors(
            node_id=node_id,
            relationship_type=relationship_type,
        )
        edges = await self._uow.graph.load_edges_for_nodes(
            node_ids=[node_id],
            relationship_type=relationship_type,
        )
        edge_type_counts = await self._uow.graph.load_edge_types_for_node(node_id)

        return {
            'node': node,
            'neighbors': neighbors,
            'edges': edges,
            'edge_type_counts': edge_type_counts,
        }

    # ── Prerequisite Chain ─────────────────────────────────────────

    async def get_prerequisite_chain(self, node_id: UUID) -> list[list[KnowledgeNode]]:
        """Get the prerequisite chain for a node, organised by depth level.

        Level 0: direct prerequisites
        Level 1: prerequisites of prerequisites
        etc.
        """
        seen = {node_id}
        chain = []
        current_level = [node_id]

        while current_level:
            next_level = []
            level_nodes = []
            for nid in current_level:
                prereqs = await self._uow.graph.load_prerequisites(nid)
                for prereq in prereqs:
                    if prereq.id not in seen:
                        seen.add(prereq.id)
                        next_level.append(prereq.id)
                        level_nodes.append(prereq)
            if level_nodes:
                chain.append(level_nodes)
            current_level = next_level

        return chain

    # ── Path Finding ───────────────────────────────────────────────

    async def find_path(
        self,
        source_id: UUID,
        target_id: UUID,
        max_depth: int = 5,
    ) -> list[dict]:
        """Find a path between two nodes using BFS.

        Returns a list of steps, each with ``node`` and ``edge`` info.
        Returns an empty list if no path is found within ``max_depth``.
        """
        from collections import deque

        if source_id == target_id:
            return []

        visited = {source_id}
        queue: deque = deque()
        queue.append((source_id, []))

        while queue:
            current_id, path = queue.popleft()
            if len(path) >= max_depth:
                continue

            outgoing = await self._uow.graph.load_outgoing_edges(current_id)
            for edge in outgoing.items:
                if edge and edge.target_node_id not in visited:
                    new_path = [*path, {'node_id': current_id, 'edge': edge}]
                    if edge.target_node_id == target_id:
                        return [*new_path, {'node_id': target_id, 'edge': None}]
                    visited.add(edge.target_node_id)
                    queue.append((edge.target_node_id, new_path))

        return []

    # ── Statistics ─────────────────────────────────────────────────

    async def get_graph_statistics(self) -> dict:
        """Get aggregate graph statistics."""
        # Count active nodes by type
        from sqlalchemy import func, select

        stmt = (
            select(
                KnowledgeNode.node_type,
                func.count().label('count'),
            )
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .group_by(KnowledgeNode.node_type)
        )
        result = await self._uow.session.execute(stmt)
        node_type_counts = {
            row[0].value if hasattr(row[0], 'value') else row[0]: row[1] for row in result.all()
        }

        # Total edges
        edge_count = await self._uow.knowledge_edges.count()

        # Total nodes
        total_nodes = sum(node_type_counts.values())

        return {
            'total_nodes': total_nodes,
            'total_edges': edge_count,
            'node_type_counts': node_type_counts,
        }
