"""Graph Navigation Service — path finding, traversal, and journey generation.

Builds on the lower-level ``GraphTraversalService`` with richer navigation
operations:

- **Shortest Path**: Fewest-hops (BFS) or minimum cumulative hours (Dijkstra)
- **Longest Path**: DAG-only — tractable because cycle detection in
  Stage 5.1 rejects cyclic imports at import time
- **Topological Order**: Full DAG topological sort
- **Domain Traversal**: Navigate the graph filtered by domain
- **Learning Journey**: Generate a personalised learning journey from
  a source node to a target node
"""

from __future__ import annotations

import heapq
from collections import deque
from typing import TYPE_CHECKING, Any, Literal

from structlog.stdlib import get_logger

from app.services.graph.traversal import GraphTraversalService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

# ── Difficulty → Minutes Map ───────────────────────────────────────

DIFFICULTY_MINUTES: dict[str, int] = {
    'beginner': 30,
    'intermediate': 60,
    'advanced': 120,
    'expert': 180,
}


def _difficulty_minutes(difficulty) -> int:
    """Resolve a difficulty enum or string to estimated minutes."""
    diff_str = difficulty.value if hasattr(difficulty, 'value') else str(difficulty)
    return DIFFICULTY_MINUTES.get(diff_str.lower(), 45)


class GraphNavigationService:
    """Rich navigation operations over the knowledge graph.

    Provides path finding (shortest, longest), traversal (BFS, DFS),
    topological ordering, domain-scoped navigation, and learning
    journey generation.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._traversal = GraphTraversalService(uow)

    # ── Shortest Path ──────────────────────────────────────────────
    # Fewest-Hops (BFS): O(V + E)
    # Min-Hours (Dijkstra): O((V + E) log V)

    async def shortest_path(
        self,
        from_slug: str,
        to_slug: str,
        metric: Literal['hops', 'hours'] = 'hops',
        max_depth: int = 10,
    ) -> dict[str, Any]:
        """Find the shortest path between two nodes.

        Args:
            from_slug: Starting node slug.
            to_slug: Target node slug.
            metric: ``'hops'`` (fewest edges, BFS) or ``'hours'``
                (minimum cumulative estimated time, Dijkstra).
            max_depth: Maximum path length to consider.

        Returns:
            Dict with ``path`` (ordered node list), ``edges``,
            ``total_estimated_hours``, ``depth``, and metric info.

        **Design note**: ``'hours'`` uses Dijkstra on the edge graph
        with per-node ``estimated_minutes`` as edge weight. Since
        ``estimated_minutes`` is always positive, Dijkstra is correct
        and efficient. BFS is used for ``'hops'`` since all edges have
        unit weight.
        """
        from_node = await self._uow.knowledge_nodes.get_by_slug(from_slug)
        to_node = await self._uow.knowledge_nodes.get_by_slug(to_slug)

        if from_node.id == to_node.id:
            return self._empty_path_result(from_slug, to_slug, metric)

        if metric == 'hours':
            return await self._shortest_path_weighted(from_node.id, to_node.id, max_depth)
        return await self._shortest_path_unweighted(from_node.id, to_node.id, max_depth)

    def _empty_path_result(
        self,
        from_slug: str,
        to_slug: str,
        metric: str,
    ) -> dict[str, Any]:
        return {
            'path': [],
            'edges': [],
            'total_estimated_hours': 0.0,
            'depth': 0,
            'metric': metric,
            'from_slug': from_slug,
            'to_slug': to_slug,
        }

    async def _shortest_path_unweighted(
        self,
        source_id: UUID,
        target_id: UUID,
        max_depth: int = 10,
    ) -> dict[str, Any]:
        """BFS-based shortest path (fewest edges / hops)."""
        visited: set[UUID] = {source_id}
        queue: deque[list[UUID]] = deque()
        queue.append([source_id])

        while queue:
            path = queue.popleft()
            current_id = path[-1]

            if current_id == target_id and len(path) > 1:
                return await self._build_path_response(path)

            if len(path) - 1 >= max_depth:
                continue

            outgoing = await self._uow.graph.load_outgoing_edges(
                current_id,
                page=1,
                per_page=200,
            )
            for edge in outgoing.items:
                if edge and edge.target_node_id not in visited:
                    visited.add(edge.target_node_id)
                    queue.append([*path, edge.target_node_id])

        return {
            'path': [],
            'edges': [],
            'total_estimated_hours': 0.0,
            'depth': 0,
            'metric': 'hops',
            'from_slug': '',
            'to_slug': '',
            'error': 'No path found within max_depth',
        }

    async def _shortest_path_weighted(
        self,
        source_id: UUID,
        target_id: UUID,
        max_depth: int = 10,
    ) -> dict[str, Any]:
        """Dijkstra-based shortest path (minimum cumulative estimated hours).

        Uses per-node ``estimated_minutes`` as edge weight. All edge
        weights are positive (minutes > 0), so Dijkstra is correct.
        """
        heap: list[tuple[float, list[UUID]]] = []
        heapq.heappush(heap, (0.0, [source_id]))
        best_costs: dict[UUID, float] = {source_id: 0.0}

        while heap:
            cost, path = heapq.heappop(heap)
            current_id = path[-1]

            if current_id == target_id and len(path) > 1:
                return await self._build_path_response(path, cost)

            if len(path) - 1 >= max_depth:
                continue

            outgoing = await self._uow.graph.load_outgoing_edges(
                current_id,
                page=1,
                per_page=200,
            )
            for edge in outgoing.items:
                if not edge:
                    continue
                target_node = await self._uow.knowledge_nodes.get_by_id(edge.target_node_id)
                if not target_node:
                    continue
                edge_weight = _difficulty_minutes(target_node.difficulty) / 60.0
                new_cost = cost + edge_weight

                if (
                    edge.target_node_id not in best_costs
                    or new_cost < best_costs[edge.target_node_id]
                ):
                    best_costs[edge.target_node_id] = new_cost
                    heapq.heappush(heap, (new_cost, [*path, edge.target_node_id]))

        return {
            'path': [],
            'edges': [],
            'total_estimated_hours': 0.0,
            'depth': 0,
            'metric': 'hours',
            'from_slug': '',
            'to_slug': '',
            'error': 'No path found within max_depth',
        }

    async def _build_path_response(
        self,
        node_ids: list[UUID],
        total_hours: float | None = None,
    ) -> dict[str, Any]:
        """Build the response dict from a list of node IDs along a path."""
        nodes = []
        edges = []

        for nid in node_ids:
            node = await self._uow.knowledge_nodes.get_by_id(nid)
            if node:
                nodes.append(_node_to_nav_dict(node))

        for idx in range(len(node_ids) - 1):
            src_id = node_ids[idx]
            tgt_id = node_ids[idx + 1]
            between = await self._uow.graph.load_edges_for_nodes(
                node_ids=[src_id, tgt_id],
            )
            for edge in between:
                src_match = str(edge.source_node_id) == str(src_id)
                tgt_match = str(edge.target_node_id) == str(tgt_id)
                if src_match and tgt_match:
                    edges.append(_edge_to_nav_dict(edge))
                    break

        if total_hours is None:
            total_hours = sum(
                n.get('estimated_minutes', 0) / 60.0 for n in nodes if n.get('estimated_minutes')
            )

        return {
            'path': nodes,
            'edges': edges,
            'total_estimated_hours': round(total_hours, 1),
            'depth': len(node_ids) - 1,
            'metric': 'hours' if total_hours else 'hops',
            'from_slug': nodes[0]['slug'] if nodes else '',
            'to_slug': nodes[-1]['slug'] if nodes else '',
        }

    # ── Longest Path (DAG Only) ────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)
    #
    # **Critical precondition**: The graph must be a DAG. Cycle detection
    # in Stage 5.1's import pipeline rejects cyclic graphs before they
    # can be imported. Longest-path in a general graph is NP-hard, but
    # the DAG invariant makes this tractable via a single pass over
    # topological order.

    async def longest_path(self, slug: str, max_depth: int = 20) -> dict[str, Any]:
        """Find the longest prerequisite chain ending at the given node.

        Computed as a single forward pass over topological order.
        This is tractable specifically because the import pipeline
        (Stage 5.1) rejects cyclic graphs at import time, ensuring
        the graph is always a DAG.

        Args:
            slug: The target node slug.
            max_depth: Maximum number of prerequisite levels to traverse.
        """
        from sqlalchemy import select

        from app.models.knowledge_edge import KnowledgeEdge

        node = await self._uow.knowledge_nodes.get_by_slug(slug)

        # 1. Build the full prerequisite subgraph (depth-limited)
        prereq_ids: set[UUID] = set()
        visited: set[UUID] = set()
        queue: deque[tuple[UUID, int]] = deque([(node.id, 0)])

        while queue:
            current_id, depth = queue.popleft()
            if current_id in visited:
                continue
            visited.add(current_id)
            prereq_ids.add(current_id)
            if depth >= max_depth:
                continue
            prereqs = await self._uow.graph.load_prerequisites(current_id)
            for p in prereqs:
                if p.id not in visited:
                    queue.append((p.id, depth + 1))

        if not prereq_ids:
            return {
                'path': [_node_to_nav_dict(node)],
                'depth': 0,
                'total_estimated_hours': round(
                    _difficulty_minutes(node.difficulty) / 60.0,
                    1,
                ),
                'deepest_node': node.slug,
            }

        # 2. Get all edges within the subgraph
        edge_stmt = select(KnowledgeEdge).where(
            KnowledgeEdge.source_node_id.in_(list(prereq_ids)),
            KnowledgeEdge.target_node_id.in_(list(prereq_ids)),
            KnowledgeEdge.relationship_type == 'prerequisite',
            KnowledgeEdge.is_deleted.isnot(True),
        )
        edge_result = await self._uow.session.execute(edge_stmt)
        all_edges = list(edge_result.scalars().all())

        # 3. Build adjacency list and in-degree map
        in_degree: dict[UUID, int] = {nid: 0 for nid in prereq_ids}
        adj: dict[UUID, list[UUID]] = {nid: [] for nid in prereq_ids}

        for edge in all_edges:
            src = edge.source_node_id
            tgt = edge.target_node_id
            if src in adj and tgt in in_degree:
                adj[src].append(tgt)
                in_degree[tgt] = in_degree.get(tgt, 0) + 1

        # 4. Kahn's algorithm for topological order + longest path
        topo_queue: deque[UUID] = deque(
            [nid for nid, deg in in_degree.items() if deg == 0],
        )
        topo_order: list[UUID] = []
        while topo_queue:
            nid = topo_queue.popleft()
            topo_order.append(nid)
            for neighbor in adj.get(nid, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    topo_queue.append(neighbor)

        # Detect cycles (violates the DAG precondition)
        if len(topo_order) != len(prereq_ids):
            return {
                'path': [],
                'depth': -1,
                'error': 'Cycle detected in prerequisite graph — longest path requires a DAG',
                'deepest_node': node.slug,
            }

        # 5. Single forward pass for longest path
        depth_map: dict[UUID, int] = {nid: 0 for nid in prereq_ids}
        predecessor: dict[UUID, UUID | None] = {nid: None for nid in prereq_ids}

        for nid in topo_order:
            for neighbor in adj.get(nid, []):
                if depth_map[neighbor] < depth_map[nid] + 1:
                    depth_map[neighbor] = depth_map[nid] + 1
                    predecessor[neighbor] = nid

        # 6. Trace back the deepest path to target node
        deepest_depth = depth_map.get(node.id, 0)
        path_ids: list[UUID] = []
        current_id_p: UUID | None = node.id
        while current_id_p is not None:
            path_ids.append(current_id_p)
            current_id_p = predecessor.get(current_id_p)
        path_ids.reverse()

        # 7. Fetch node details for the path
        path_nodes = []
        for nid in path_ids:
            n = await self._uow.knowledge_nodes.get_by_id(nid)
            if n:
                path_nodes.append(_node_to_nav_dict(n))

        total_hours = sum(p.get('estimated_minutes', 30) / 60.0 for p in path_nodes)

        return {
            'path': path_nodes,
            'depth': deepest_depth,
            'total_estimated_hours': round(total_hours, 1),
            'deepest_node': node.slug,
            'topological_order_length': len(topo_order),
        }

    # ── Topological Order ──────────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def topological_order(self, domain: str | None = None) -> list[dict[str, Any]]:
        """Compute a topological ordering of the knowledge graph.

        Uses Kahn's algorithm. Returns empty list if a cycle is detected
        (though the import pipeline should prevent cycles).
        """
        from sqlalchemy import select

        from app.models.knowledge_edge import KnowledgeEdge
        from app.models.knowledge_node import KnowledgeNode

        # Fetch nodes
        stmt = select(KnowledgeNode).where(
            KnowledgeNode.is_deleted.isnot(True),
            KnowledgeNode.is_published,
        )
        result = await self._uow.session.execute(stmt)
        all_nodes = list(result.scalars().all())

        # Filter by domain if specified
        if domain:
            all_nodes = [n for n in all_nodes if n.extra_metadata.get('domain') == domain]

        node_ids = {n.id for n in all_nodes}
        if not node_ids:
            return []

        # Get all prerequisite edges within this set
        edge_stmt = select(KnowledgeEdge).where(
            KnowledgeEdge.source_node_id.in_(list(node_ids)),
            KnowledgeEdge.target_node_id.in_(list(node_ids)),
            KnowledgeEdge.relationship_type == 'prerequisite',
            KnowledgeEdge.is_deleted.isnot(True),
        )
        edge_result = await self._uow.session.execute(edge_stmt)
        edges = list(edge_result.scalars().all())

        # Kahn's algorithm
        in_degree: dict[UUID, int] = {nid: 0 for nid in node_ids}
        adj: dict[UUID, list[UUID]] = {nid: [] for nid in node_ids}

        for edge in edges:
            src = edge.source_node_id
            tgt = edge.target_node_id
            if src in adj and tgt in in_degree:
                adj[src].append(tgt)
                in_degree[tgt] = in_degree.get(tgt, 0) + 1

        topo_queue: deque[UUID] = deque(
            [nid for nid, deg in in_degree.items() if deg == 0],
        )
        topo_order: list[UUID] = []
        while topo_queue:
            nid = topo_queue.popleft()
            topo_order.append(nid)
            for neighbor in adj.get(nid, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    topo_queue.append(neighbor)

        if len(topo_order) != len(node_ids):
            logger.warning(
                'cycle_detected_in_topological_order',
                total_nodes=len(node_ids),
                ordered=len(topo_order),
            )
            return []

        node_map = {n.id: n for n in all_nodes}
        return [_node_to_nav_dict(node_map[nid]) for nid in topo_order if nid in node_map]

    # ── Domain Traversal ───────────────────────────────────────────

    async def domain_traversal(
        self,
        domain: str,
        max_depth: int = 10,
    ) -> list[dict[str, Any]]:
        """Traverse the graph within a single domain, returning nodes
        in dependency-safe order.
        """
        ordered = await self.topological_order(domain=domain)
        max_depth = max_depth or 0
        if max_depth > 0:
            return ordered[:max_depth]
        return ordered

    async def cross_domain_traversal(
        self,
        from_domain: str,
        to_domain: str,
        max_depth: int = 10,
    ) -> dict[str, Any]:
        """Find a path that crosses from one domain to another."""
        from sqlalchemy import select

        from app.models.knowledge_node import KnowledgeNode

        # Find nodes in each domain
        from_nodes_stmt = select(KnowledgeNode).where(
            KnowledgeNode.extra_metadata['domain'].astext == from_domain,
            KnowledgeNode.is_deleted.isnot(True),
            KnowledgeNode.is_published,
        )
        to_nodes_stmt = select(KnowledgeNode).where(
            KnowledgeNode.extra_metadata['domain'].astext == to_domain,
            KnowledgeNode.is_deleted.isnot(True),
            KnowledgeNode.is_published,
        )
        from_result = await self._uow.session.execute(from_nodes_stmt)
        to_result = await self._uow.session.execute(to_nodes_stmt)
        from_nodes = list(from_result.scalars().all())
        to_nodes = list(to_result.scalars().all())

        if not from_nodes or not to_nodes:
            return {
                'path': [],
                'from_domain': from_domain,
                'to_domain': to_domain,
                'error': 'One or both domains have no published nodes',
            }

        best_path = None
        best_length = float('inf')

        for fn in from_nodes[:5]:
            for tn in to_nodes[:5]:
                path_result = await self.shortest_path(
                    fn.slug,
                    tn.slug,
                    metric='hops',
                    max_depth=max_depth,
                )
                depth = path_result.get('depth', 0)
                if depth > 0 and depth < best_length:
                    best_length = depth
                    best_path = path_result

        if best_path:
            best_path['from_domain'] = from_domain
            best_path['to_domain'] = to_domain
            return best_path

        return {
            'path': [],
            'from_domain': from_domain,
            'to_domain': to_domain,
            'error': f'No path found from {from_domain}'
            f' to {to_domain} within max_depth={max_depth}',
        }

    # ── Learning Journey Generation ────────────────────────────────

    async def generate_learning_journey(
        self,
        from_slug: str,
        to_slug: str,
        strategy: str = 'fastest',
    ) -> dict[str, Any]:
        """Generate a personalised learning journey from one node to
        another, using the chosen strategy.

        Strategies:
        - ``fastest``: Minimum cumulative estimated hours
        - ``complete``: Full transitive closure in topological order
        - ``breadth_first``: BFS-based exploration, level by level
        - ``depth_first``: Deep dive down the prerequisite chain first
        """
        if strategy == 'fastest':
            return await self.shortest_path(from_slug, to_slug, metric='hours')
        if strategy == 'breadth_first':
            return await self.shortest_path(from_slug, to_slug, metric='hops')
        if strategy == 'complete':
            return await self._generate_complete_journey(from_slug, to_slug)
        if strategy == 'depth_first':
            return await self._generate_depth_first_journey(to_slug)
        return await self.shortest_path(from_slug, to_slug, metric='hours')

    async def _generate_complete_journey(
        self,
        from_slug: str,
        to_slug: str,
    ) -> dict[str, Any]:
        """Generate a complete journey covering all prerequisites
        in topological order (no shortcuts — learn everything)."""
        to_node = await self._uow.knowledge_nodes.get_by_slug(to_slug)

        prereq_ids: list[UUID] = []
        visited: set[UUID] = set()
        queue: deque[UUID] = deque([to_node.id])

        while queue:
            current_id = queue.popleft()
            if current_id in visited:
                continue
            visited.add(current_id)
            if current_id != to_node.id:
                prereq_ids.append(current_id)
            prereqs = await self._uow.graph.load_prerequisites(current_id)
            for p in prereqs:
                if p.id not in visited:
                    queue.append(p.id)
            from_node_full = await self._uow.knowledge_nodes.get_by_slug(from_slug)
            if from_node_full and from_node_full.id not in visited:
                queue.append(from_node_full.id)

        prereq_ids.reverse()

        nodes = []
        for nid in prereq_ids:
            n = await self._uow.knowledge_nodes.get_by_id(nid)
            if n:
                nodes.append(_node_to_nav_dict(n))

        nodes.append(_node_to_nav_dict(to_node))

        total_hours = sum(n.get('estimated_minutes', 30) / 60.0 for n in nodes)

        return {
            'path': nodes,
            'depth': len(nodes) - 1,
            'total_estimated_hours': round(total_hours, 1),
            'strategy': 'complete',
            'from_slug': from_slug,
            'to_slug': to_slug,
        }

    async def _generate_depth_first_journey(
        self,
        to_slug: str,
    ) -> dict[str, Any]:
        """Generate a journey that dives deep down the prerequisite
        chain first (depth-first order)."""
        return await self.longest_path(to_slug)


# ── Helper Functions ───────────────────────────────────────────────


def _node_to_nav_dict(node) -> dict[str, Any]:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
        'estimated_minutes': getattr(node, 'estimated_minutes', 30),
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
    }


def _edge_to_nav_dict(edge) -> dict[str, Any]:
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
        'weight': getattr(edge, 'weight', 1.0),
    }
