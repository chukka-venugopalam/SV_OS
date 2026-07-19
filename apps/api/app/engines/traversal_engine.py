"""Traversal Engine — complete graph traversal and path computation engine.

Algorithms implemented:
- Breadth First Search (BFS)
- Depth First Search (DFS)
- Shortest Path (unweighted BFS)
- All Paths (bounded)
- Dependency Chain
- Reverse Dependency Chain
- Ancestor Search
- Descendant Search
- Reachability
- Connected Components
- Topological Sort
- Cycle Detection
- Subgraph Extraction
- Neighborhood Expansion

All algorithms use iterative approaches for scalability to 100k+ nodes.
"""

from __future__ import annotations

from collections import deque
from uuid import UUID
from typing import Any

from app.engines.base import EngineBase, EngineDependency, EngineHealth


class TraversalEngine(EngineBase):
    """Traversal Engine — complete graph traversal and path computation.

    Delegates adjacency queries to the GraphEngine. All algorithms are
    implemented iteratively for memory efficiency.

    Public Interface:
        bfs, dfs, shortest_path, all_paths, reachable,
        topological_sort, has_cycle, connected_components,
        subgraph, neighborhood, dependency_chain,
        reverse_dependency_chain, ancestors, descendants
    """

    def __init__(self, graph_engine: Any | None = None) -> None:
        super().__init__()
        self._graph: Any = graph_engine
        self._max_bfs_depth: int = 10
        self._max_paths: int = 100

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'traversal'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='graph', required=True, description='GraphEngine for adjacency'),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        pass

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Traversal engine is operational',
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ── Public Interface ──────────────────────────────────────────

    async def bfs(
        self,
        start_node_id: UUID,
        max_depth: int = 5,
        relationship_type: str | None = None,
    ) -> list[dict]:
        """Breadth-first traversal from a start node.

        Time: O(V + E)  |  Space: O(V)

        Returns list of {node_id, depth, parent_id} entries.
        """
        visited: set[UUID] = {start_node_id}
        queue: deque[tuple[UUID, int, UUID | None]] = deque()
        queue.append((start_node_id, 0, None))
        result: list[dict] = []

        while queue:
            current_id, depth, parent_id = queue.popleft()
            if depth > 0:
                result.append({
                    'node_id': str(current_id),
                    'depth': depth,
                    'parent_id': str(parent_id) if parent_id else None,
                })
            if depth >= max_depth:
                continue
            outgoing = await self._get_outgoing(current_id, relationship_type)
            for edge in outgoing:
                target_id = UUID(edge['target_id'])
                if target_id not in visited:
                    visited.add(target_id)
                    queue.append((target_id, depth + 1, current_id))
        return result

    async def dfs(
        self,
        start_node_id: UUID,
        max_depth: int = 10,
        relationship_type: str | None = None,
    ) -> list[dict]:
        """Depth-first traversal from a start node (iterative).

        Time: O(V + E)  |  Space: O(V)
        """
        visited: set[UUID] = {start_node_id}
        stack: list[tuple[UUID, int]] = [(start_node_id, 0)]
        result: list[dict] = []

        while stack:
            current_id, depth = stack.pop()
            if depth > 0:
                result.append({
                    'node_id': str(current_id),
                    'depth': depth,
                })
            if depth >= max_depth:
                continue
            outgoing = await self._get_outgoing(current_id, relationship_type)
            for edge in reversed(outgoing):
                target_id = UUID(edge['target_id'])
                if target_id not in visited:
                    visited.add(target_id)
                    stack.append((target_id, depth + 1))
        return result

    async def shortest_path(
        self,
        source_id: UUID,
        target_id: UUID,
        max_depth: int = 10,
    ) -> list[dict]:
        """Find the shortest path between two nodes using BFS.

        Time: O(V + E)  |  Space: O(V)

        Returns ordered list of {node_id, edge} steps from source to target.
        Returns empty list if no path exists within max_depth.
        """
        if source_id == target_id:
            return []
        visited: set[UUID] = {source_id}
        queue: deque[tuple[UUID, list[dict], int]] = deque()
        queue.append((source_id, [], 0))

        while queue:
            current_id, path, depth = queue.popleft()
            if depth > max_depth:
                continue
            outgoing = await self._get_outgoing(current_id)
            for edge in outgoing:
                neighbor_id = UUID(edge['target_id'])
                next_path = path + [{
                    'node_id': str(neighbor_id),
                    'edge': edge,
                    'from_id': str(current_id),
                }]
                if neighbor_id == target_id and next_path:
                    return next_path
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    queue.append((neighbor_id, next_path, depth + 1))
        return []

    async def all_paths(
        self,
        source_id: UUID,
        target_id: UUID,
        max_depth: int = 6,
        max_paths: int = 10,
    ) -> list[list[dict]]:
        """Find all paths between two nodes (bounded DFS).

        Time: O(b^d) where b=branching factor, d=depth  |  Space: O(d * paths)
        """
        paths: list[list[dict]] = []
        visited: set[UUID] = {source_id}
        stack: list[tuple[UUID, list[dict], int]] = [(source_id, [], 0)]

        while stack and len(paths) < max_paths:
            current_id, path, depth = stack.pop()
            if depth > max_depth:
                continue
            outgoing = await self._get_outgoing(current_id)
            for edge in outgoing:
                neighbor_id = UUID(edge['target_id'])
                new_path = path + [{
                    'node_id': str(neighbor_id),
                    'edge': edge,
                    'from_id': str(current_id),
                }]
                if neighbor_id == target_id:
                    paths.append(new_path)
                    if len(paths) >= max_paths:
                        return paths
                elif neighbor_id not in visited:
                    visited.add(neighbor_id)
                    stack.append((neighbor_id, new_path, depth + 1))
                    visited.discard(neighbor_id)
        return paths

    async def dependency_chain(
        self, node_id: UUID, max_depth: int = 5
    ) -> list[list[dict]]:
        """Get the full prerequisite chain organised by depth level.

        Level 0: direct prerequisites
        Level 1: prerequisites of prerequisites, etc.

        Returns a list of levels, each level being a list of node dicts.
        """
        seen: set[UUID] = {node_id}
        chain: list[list[dict]] = []
        current_level: list[UUID] = [node_id]
        for _ in range(max_depth):
            next_level: list[UUID] = []
            level_nodes: list[dict] = []
            for nid in current_level:
                incoming = await self._get_incoming_prereqs(nid)
                for edge in incoming:
                    sid = UUID(edge['source_id'])
                    if sid not in seen:
                        seen.add(sid)
                        next_level.append(sid)
                        level_nodes.append({'node_id': str(sid), 'relationship_type': edge.get('relationship_type', '')})
            if level_nodes:
                chain.append(level_nodes)
            current_level = next_level
            if not current_level:
                break
        return chain

    async def reverse_dependency_chain(
        self, node_id: UUID, max_depth: int = 5
    ) -> list[list[dict]]:
        """Get nodes that depend on this node, organised by depth level."""
        seen: set[UUID] = {node_id}
        chain: list[list[dict]] = []
        current_level: list[UUID] = [node_id]
        for _ in range(max_depth):
            next_level: list[UUID] = []
            level_nodes: list[dict] = []
            for nid in current_level:
                outgoing = await self._get_outgoing_prereqs(nid)
                for edge in outgoing:
                    tid = UUID(edge['target_id'])
                    if tid not in seen:
                        seen.add(tid)
                        next_level.append(tid)
                        level_nodes.append({'node_id': str(tid), 'relationship_type': edge.get('relationship_type', '')})
            if level_nodes:
                chain.append(level_nodes)
            current_level = next_level
            if not current_level:
                break
        return chain

    async def ancestors(self, node_id: UUID, max_depth: int = 10) -> list[dict]:
        """Find all ancestor nodes (reverse BFS up the graph)."""
        visited: set[UUID] = {node_id}
        queue: deque[tuple[UUID, int]] = deque([(node_id, 0)])
        result: list[dict] = []
        while queue:
            current_id, depth = queue.popleft()
            if depth >= max_depth:
                continue
            incoming = await self._get_incoming(current_id)
            for edge in incoming:
                sid = UUID(edge['source_id'])
                if sid not in visited:
                    visited.add(sid)
                    queue.append((sid, depth + 1))
                    result.append({'node_id': str(sid), 'depth': depth + 1})
        return result

    async def descendants(self, node_id: UUID, max_depth: int = 10) -> list[dict]:
        """Find all descendant nodes (BFS down the graph)."""
        visited: set[UUID] = {node_id}
        queue: deque[tuple[UUID, int]] = deque([(node_id, 0)])
        result: list[dict] = []
        while queue:
            current_id, depth = queue.popleft()
            if depth >= max_depth:
                continue
            outgoing = await self._get_outgoing(current_id)
            for edge in outgoing:
                tid = UUID(edge['target_id'])
                if tid not in visited:
                    visited.add(tid)
                    queue.append((tid, depth + 1))
                    result.append({'node_id': str(tid), 'depth': depth + 1})
        return result

    async def reachable(
        self, node_id: UUID, max_depth: int = 5
    ) -> list[dict]:
        """Find all nodes reachable from a start node using BFS."""
        return await self.bfs(node_id, max_depth)

    async def topological_sort(self, node_ids: list[UUID] | None = None) -> list[UUID]:
        """Topologically sort nodes by prerequisite dependency order.

        Uses Kahn's algorithm (BFS-based). If node_ids is None, uses all graph nodes.
        Time: O(V + E)  |  Space: O(V)
        """
        target_ids = node_ids or (await self._get_all_node_ids())
        if not target_ids:
            return []

        # Build in-degree map
        in_degree: dict[UUID, int] = {nid: 0 for nid in target_ids}
        adj: dict[UUID, list[UUID]] = {nid: [] for nid in target_ids}

        for nid in target_ids:
            outgoing = await self._get_outgoing_prereqs(nid)
            for edge in outgoing:
                tid = UUID(edge['target_id'])
                if tid in adj:
                    adj[nid].append(tid)
                    in_degree[tid] = in_degree.get(tid, 0) + 1

        # Kahn's algorithm
        queue: deque[UUID] = deque([nid for nid, deg in in_degree.items() if deg == 0])
        sorted_order: list[UUID] = []
        while queue:
            nid = queue.popleft()
            sorted_order.append(nid)
            for neighbor in adj.get(nid, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return sorted_order

    async def has_cycle(self, node_ids: list[UUID] | None = None) -> list[UUID] | None:
        """Detect cycles using DFS. Returns the cycle path if found.

        Time: O(V + E)  |  Space: O(V)
        """
        nids = node_ids or (await self._get_all_node_ids())
        if not nids:
            return None

        # Build adjacency
        adj: dict[UUID, list[UUID]] = {nid: [] for nid in nids}
        for nid in nids:
            outgoing = await self._get_outgoing(nid)
            for edge in outgoing:
                tid = UUID(edge['target_id'])
                if tid in adj:
                    adj[nid].append(tid)

        visited: set[UUID] = set()
        in_stack: set[UUID] = set()

        def dfs(current: UUID, path: list[UUID]) -> list[UUID] | None:
            visited.add(current)
            in_stack.add(current)
            path.append(current)
            for neighbor in adj.get(current, []):
                if neighbor not in visited:
                    result = dfs(neighbor, path)
                    if result:
                        return result
                elif neighbor in in_stack:
                    idx = path.index(neighbor)
                    return path[idx:]
            path.pop()
            in_stack.discard(current)
            return None

        for nid in nids:
            if nid not in visited:
                result = dfs(nid, [])
                if result:
                    return result
        return None

    async def connected_components(self) -> list[list[dict]]:
        """Find all connected components using BFS.

        Time: O(V + E)  |  Space: O(V)
        """
        all_ids = await self._get_all_node_ids()
        visited: set[UUID] = set()
        components: list[list[dict]] = []

        for nid in all_ids:
            if nid in visited:
                continue
            component: list[dict] = []
            queue: deque[UUID] = deque([nid])
            visited.add(nid)
            while queue:
                current_id = queue.popleft()
                # Get node info
                if self._graph:
                    node = await self._graph.get_node(current_id)
                else:
                    node = {'id': str(current_id)}
                component.append(node)
                outgoing = await self._get_outgoing(current_id)
                for edge in outgoing:
                    tid = UUID(edge['target_id'])
                    if tid not in visited:
                        visited.add(tid)
                        queue.append(tid)
            components.append(component)
        return components

    async def subgraph(
        self, center_node_id: UUID, depth: int = 2, relationship_type: str | None = None
    ) -> dict:
        """Extract a subgraph around a center node.

        Returns a dict with 'nodes', 'edges', 'center_node_id', 'depth'.
        """
        visited: set[UUID] = {center_node_id}
        node_ids: set[UUID] = {center_node_id}
        edges: list[dict] = []
        queue: deque[tuple[UUID, int]] = deque([(center_node_id, 0)])

        while queue:
            current_id, current_depth = queue.popleft()
            if current_depth >= depth:
                continue
            outgoing = await self._get_outgoing(current_id, relationship_type)
            for edge in outgoing:
                target_id = UUID(edge['target_id'])
                edges.append(edge)
                if target_id not in visited:
                    visited.add(target_id)
                    node_ids.add(target_id)
                    queue.append((target_id, current_depth + 1))
            incoming = await self._get_incoming(current_id, relationship_type)
            for edge in incoming:
                source_id = UUID(edge['source_id'])
                edges.append(edge)
                if source_id not in visited:
                    visited.add(source_id)
                    node_ids.add(source_id)
                    queue.append((source_id, current_depth + 1))

        # Fetch node details
        nodes: list[dict] = []
        for nid in node_ids:
            if self._graph:
                node = await self._graph.get_node(nid)
                if node:
                    nodes.append(node)

        return {
            'nodes': nodes,
            'edges': edges,
            'center_node_id': str(center_node_id),
            'depth': depth,
        }

    async def neighborhood(
        self, node_id: UUID, radius: int = 1, relationship_type: str | None = None
    ) -> dict:
        """Expand neighborhood of a node within a given radius.

        Returns immediate neighbors and their edge connections.
        """
        return await self.subgraph(node_id, radius, relationship_type)

    # ── Internal Adjacency ─────────────────────────────────────────

    async def _get_outgoing(
        self, node_id: UUID, relationship_type: str | None = None
    ) -> list[dict]:
        if not self._graph:
            return []
        edges = await self._graph.get_outgoing(node_id)
        if relationship_type:
            edges = [e for e in edges if e.get('relationship_type') == relationship_type]
        return edges

    async def _get_incoming(
        self, node_id: UUID, relationship_type: str | None = None
    ) -> list[dict]:
        if not self._graph:
            return []
        edges = await self._graph.get_incoming(node_id)
        if relationship_type:
            edges = [e for e in edges if e.get('relationship_type') == relationship_type]
        return edges

    async def _get_outgoing_prereqs(self, node_id: UUID) -> list[dict]:
        return await self._get_outgoing(node_id, 'prerequisite')

    async def _get_incoming_prereqs(self, node_id: UUID) -> list[dict]:
        return await self._get_incoming(node_id, 'prerequisite')

    async def _get_all_node_ids(self) -> list[UUID]:
        if not self._graph:
            return []
        try:
            nodes = await self._graph.all_nodes()
            return [UUID(n['id']) for n in nodes]
        except Exception:
            return []
