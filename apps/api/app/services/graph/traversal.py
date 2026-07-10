"""
Graph Traversal Service — BFS, DFS, shortest path, and chain algorithms.

All algorithms operate asynchronously and delegate persistence to the
``GraphRepository``.  They are designed to scale to 100k+ nodes by using
iterative (not recursive) approaches and batch-loading where possible.

Complexity notations use V = vertices (nodes), E = edges (relationships),
and D = max traversal depth.
"""

from __future__ import annotations

from collections import deque
from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.repositories.graph import GraphRepository

logger = get_logger(__name__)


class GraphTraversalService:
    """Advanced graph traversal algorithms for the knowledge graph.

    Provides BFS, DFS, shortest-path (unweighted), and multi-level
    chain traversals for prerequisites and dependents.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._graph_repo: GraphRepository = uow.graph

    # ── Breadth-First Search ───────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def bfs(
        self,
        start_node_id: UUID,
        max_depth: int = 5,
        relationship_type: str | None = None,
    ) -> list[dict]:
        """Breadth-first traversal from a start node.

        Returns an ordered list of ``{node, depth, parent_id, edge}``
        entries discovered during BFS.
        """
        visited: set[UUID] = {start_node_id}
        queue: deque[tuple[UUID, int, UUID | None]] = deque()
        queue.append((start_node_id, 0, None))
        result: list[dict] = []

        while queue:
            current_id, depth, parent_id = queue.popleft()

            if depth > 0:
                result.append(
                    {
                        'node_id': str(current_id),
                        'depth': depth,
                        'parent_id': str(parent_id) if parent_id else None,
                    }
                )

            if depth >= max_depth:
                continue

            outgoing = await self._graph_repo.load_outgoing_edges(
                current_id,
                relationship_type=relationship_type,
                page=1,
                per_page=500,
            )
            for edge in outgoing.items:
                if edge and edge.target_node_id not in visited:
                    visited.add(edge.target_node_id)
                    queue.append((edge.target_node_id, depth + 1, current_id))

        return result

    # ── Depth-First Search ─────────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def dfs(
        self,
        start_node_id: UUID,
        max_depth: int = 10,
        relationship_type: str | None = None,
    ) -> list[dict]:
        """Depth-first traversal from a start node (iterative).

        Returns an ordered list of ``{node_id, depth}`` entries.
        """
        visited: set[UUID] = {start_node_id}
        stack: list[tuple[UUID, int]] = [(start_node_id, 0)]
        result: list[dict] = []

        while stack:
            current_id, depth = stack.pop()

            if depth > 0:
                result.append(
                    {
                        'node_id': str(current_id),
                        'depth': depth,
                    }
                )

            if depth >= max_depth:
                continue

            outgoing = await self._graph_repo.load_outgoing_edges(
                current_id,
                relationship_type=relationship_type,
                page=1,
                per_page=500,
            )
            for edge in reversed(outgoing.items):
                if edge and edge.target_node_id not in visited:
                    visited.add(edge.target_node_id)
                    stack.append((edge.target_node_id, depth + 1))

        return result

    # ── Shortest Learning Path (Unweighted BFS) ────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def shortest_learning_path(
        self,
        source_id: UUID,
        target_id: UUID,
        max_depth: int = 10,
    ) -> list[dict]:
        """Find the shortest learning path between two nodes using BFS.

        Returns an ordered list of steps from source to target.
        Each step contains ``node_id`` and the ``edge`` that led to it.
        Returns an empty list if no path exists within ``max_depth``.
        """
        if source_id == target_id:
            return []

        visited: set[UUID] = {source_id}
        # queue holds (current_id, path_so_far, edge_that_led_here)
        queue: deque[tuple[UUID, list[dict], dict | None]] = deque()
        queue.append((source_id, [], None))

        while queue:
            current_id, path, incoming_edge = queue.popleft()

            # Include the incoming edge that brought us here
            if incoming_edge:
                path = [*path, {'node_id': str(current_id), 'edge': _edge_to_dict(incoming_edge)}]
            else:
                path = [*path, {'node_id': str(current_id), 'edge': None}]

            if current_id == target_id and len(path) > 1:
                return path

            if len(path) > max_depth:
                continue

            outgoing = await self._graph_repo.load_outgoing_edges(
                current_id,
                page=1,
                per_page=200,
            )
            for edge in outgoing.items:
                if edge and edge.target_node_id not in visited:
                    visited.add(edge.target_node_id)
                    queue.append((edge.target_node_id, path, edge))

        return []

    # ── Prerequisite Chain (Multi-Level) ───────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def prerequisite_chain(
        self,
        node_id: UUID,
        max_depth: int = 5,
    ) -> list[list[dict]]:
        """Get the full prerequisite chain organised by depth level.

        Level 0: direct prerequisites
        Level 1: prerequisites of prerequisites
        etc.

        Returns a list of levels, where each level is a list of node dicts.
        """
        seen: set[UUID] = {node_id}
        chain: list[list[dict]] = []
        current_level: list[UUID] = [node_id]

        for _depth in range(max_depth):
            next_level: list[UUID] = []
            level_nodes: list[dict] = []

            for nid in current_level:
                prereqs = await self._graph_repo.load_prerequisites(nid)
                for prereq in prereqs:
                    if prereq.id not in seen:
                        seen.add(prereq.id)
                        next_level.append(prereq.id)
                        level_nodes.append(_node_to_dict(prereq))

            if level_nodes:
                chain.append(level_nodes)
            current_level = next_level

            if not current_level:
                break

        return chain

    # ── Dependent Chain (Multi-Level) ──────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def dependent_chain(
        self,
        node_id: UUID,
        max_depth: int = 5,
    ) -> list[list[dict]]:
        """Get the chain of nodes that depend on this node.

        Level 0: direct dependents (nodes that have this node as prerequisite)
        Level 1: dependents of dependents
        etc.
        """
        seen: set[UUID] = {node_id}
        chain: list[list[dict]] = []
        current_level: list[UUID] = [node_id]

        for _depth in range(max_depth):
            next_level: list[UUID] = []
            level_nodes: list[dict] = []

            for nid in current_level:
                dependents = await self._graph_repo.load_dependents(nid)
                for dep in dependents:
                    if dep.id not in seen:
                        seen.add(dep.id)
                        next_level.append(dep.id)
                        level_nodes.append(_node_to_dict(dep))

            if level_nodes:
                chain.append(level_nodes)
            current_level = next_level

            if not current_level:
                break

        return chain

    # ── Neighbors at Depth ─────────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def neighbors_at_depth(
        self,
        node_id: UUID,
        depth: int = 1,  # noqa: ARG002
        relationship_type: str | None = None,
    ) -> dict:
        """Get all neighbors of a node at the given depth.

        Returns a dict with ``outgoing``, ``incoming``, and
        ``edge_type_counts``.
        """
        all_neighbors = await self._graph_repo.load_all_neighbors(
            node_id=node_id,
            relationship_type=relationship_type,
        )
        edges = await self._graph_repo.load_edges_for_nodes(
            node_ids=[node_id],
            relationship_type=relationship_type,
        )
        edge_type_counts = await self._graph_repo.load_edge_types_for_node(node_id)

        return {
            'outgoing': [_node_to_dict(n) for n in all_neighbors.get('outgoing', [])],
            'incoming': [_node_to_dict(n) for n in all_neighbors.get('incoming', [])],
            'edges': [_edge_to_dict(e) for e in edges],
            'edge_type_counts': edge_type_counts,
        }

    # ── Subgraph Extraction ────────────────────────────────────────
    # Time: O(V + E) within depth D  |  Space: O(V)

    async def extract_subgraph(
        self,
        center_node_id: UUID,
        depth: int = 2,
        relationship_type: str | None = None,
    ) -> dict:
        """Extract a subgraph around a center node up to a given depth.

        Returns a dict with ``nodes``, ``edges``, and ``center_node_id``
        suitable for rendering in React Flow or similar graph visualisation.
        """
        visited: set[UUID] = {center_node_id}
        node_ids: set[UUID] = {center_node_id}
        edges: list[dict] = []
        queue: deque[tuple[UUID, int]] = deque()
        queue.append((center_node_id, 0))

        while queue:
            current_id, current_depth = queue.popleft()

            if current_depth >= depth:
                continue

            outgoing_edges = await self._graph_repo.load_outgoing_edges(
                current_id,
                relationship_type=relationship_type,
                page=1,
                per_page=200,
            )

            for edge in outgoing_edges.items:
                if not edge:
                    continue
                target_id = edge.target_node_id
                edges.append(_edge_to_dict(edge))
                if target_id not in visited:
                    visited.add(target_id)
                    node_ids.add(target_id)
                    queue.append((target_id, current_depth + 1))

        # Fetch all node details in batch
        nodes = []
        for nid in node_ids:
            node = await self._uow.knowledge_nodes.get_by_id(nid)
            if node:
                nodes.append(_node_to_dict(node))

        return {
            'nodes': nodes,
            'edges': edges,
            'center_node_id': str(center_node_id),
            'depth': depth,
        }


# ── Helper Functions ───────────────────────────────────────────────


def _node_to_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
    }


def _edge_to_dict(edge) -> dict:
    return {
        'id': str(edge.id),
        'source_id': str(edge.source_node_id),
        'target_id': str(edge.target_node_id),
        'relationship_type': edge.relationship_type.value
        if hasattr(edge.relationship_type, 'value')
        else edge.relationship_type,
        'direction': edge.direction.value
        if hasattr(edge.direction, 'value')
        else getattr(edge, 'direction', 'forward'),
    }
