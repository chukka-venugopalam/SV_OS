"""Statistics Service — graph-wide aggregate statistics.

Provides computed statistics about the entire knowledge graph:
total nodes/edges, distribution by domain/type/difficulty, deepest
chain, most connected nodes, root/leaf nodes, graph density.

**Performance note**: All statistics are aggregates over the entire
graph. Results are suitable for caching with a short TTL — recompute
on read only when the graph has changed since the last import.
"""

from __future__ import annotations

from collections import Counter
from typing import TYPE_CHECKING, Any

from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)


class StatisticsService:
    """Graph-wide aggregate statistics.

    All methods return dicts suitable for JSON serialisation.
    Caching is recommended for production use (these are full-graph
    aggregates that rarely change between imports).
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_graph_statistics(self) -> dict[str, Any]:
        """Get comprehensive graph statistics.

        Returns a dict with:
        - total_nodes, total_edges
        - domains (list with counts)
        - node_type_distribution
        - difficulty_distribution
        - average_depth
        - longest_chain
        - most_connected_node
        - root_nodes (nodes with no prerequisites)
        - leaf_nodes (nodes that unlock nothing)
        - graph_density
        - total_projects, total_careers, total_resources
        """
        from sqlalchemy import func, select

        from app.models.knowledge_edge import KnowledgeEdge
        from app.models.knowledge_node import KnowledgeNode
        from app.models.learning_resource import LearningResource
        from app.models.project import Project

        # ── Node Counts ────────────────────────────────────────────
        node_count_stmt = (
            select(func.count())
            .select_from(KnowledgeNode)
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
        )
        node_count_result = await self._uow.session.execute(node_count_stmt)
        total_nodes = node_count_result.scalar() or 0

        # ── Edge Counts ────────────────────────────────────────────
        edge_count_stmt = (
            select(func.count())
            .select_from(KnowledgeEdge)
            .where(
                KnowledgeEdge.is_deleted.isnot(True),
            )
        )
        edge_count_result = await self._uow.session.execute(edge_count_stmt)
        total_edges = edge_count_result.scalar() or 0

        # ── Node Type Distribution ─────────────────────────────────
        type_dist_stmt = (
            select(
                KnowledgeNode.node_type,
                func.count().label('count'),
            )
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .group_by(KnowledgeNode.node_type)
            .order_by(func.count().desc())
        )
        type_dist_result = await self._uow.session.execute(type_dist_stmt)
        node_type_distribution = [
            {
                'node_type': row[0].value if hasattr(row[0], 'value') else row[0],
                'count': row[1],
            }
            for row in type_dist_result.all()
        ]

        # ── Difficulty Distribution ────────────────────────────────
        diff_dist_stmt = (
            select(
                KnowledgeNode.difficulty,
                func.count().label('count'),
            )
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .group_by(KnowledgeNode.difficulty)
            .order_by(func.count().desc())
        )
        diff_dist_result = await self._uow.session.execute(diff_dist_stmt)
        difficulty_distribution = [
            {
                'difficulty': row[0].value if hasattr(row[0], 'value') else row[0],
                'count': row[1],
            }
            for row in diff_dist_result.all()
        ]

        # ── Domain Distribution (from metadata) ────────────────────
        domain_stmt = (
            select(
                KnowledgeNode.extra_metadata['domain'].label('domain'),
                func.count().label('count'),
            )
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
                KnowledgeNode.extra_metadata['domain'].isnot(None),
            )
            .group_by(KnowledgeNode.extra_metadata['domain'])
            .order_by(func.count().desc())
        )
        domain_result = await self._uow.session.execute(domain_stmt)
        domain_distribution = [
            {'domain': row[0], 'count': row[1]} for row in domain_result.all() if row[0]
        ]

        # ── Most Connected Node ────────────────────────────────────
        most_connected = await self._find_most_connected_node()

        # ── Root and Leaf Nodes ────────────────────────────────────
        root_nodes = await self._find_root_nodes()
        leaf_nodes = await self._find_leaf_nodes()

        # ── Longest Chain ──────────────────────────────────────────
        longest_chain = await self._find_longest_chain()

        # ── Graph Density ──────────────────────────────────────────
        graph_density = 0.0
        if total_nodes > 1:
            max_possible_edges = total_nodes * (total_nodes - 1)
            graph_density = (
                round(total_edges / max_possible_edges, 6) if max_possible_edges > 0 else 0.0
            )

        # ── Resource / Project Totals ──────────────────────────────
        project_stmt = (
            select(func.count())
            .select_from(Project)
            .where(
                Project.is_deleted.isnot(True),
                Project.is_published,
            )
        )
        project_result = await self._uow.session.execute(project_stmt)
        total_projects = project_result.scalar() or 0

        resource_stmt = (
            select(func.count())
            .select_from(LearningResource)
            .where(
                LearningResource.is_deleted.isnot(True),
            )
        )
        resource_result = await self._uow.session.execute(resource_stmt)
        total_resources = resource_result.scalar() or 0

        return {
            'total_nodes': total_nodes,
            'total_edges': total_edges,
            'total_projects': total_projects,
            'total_resources': total_resources,
            'node_type_distribution': node_type_distribution,
            'difficulty_distribution': difficulty_distribution,
            'domain_distribution': domain_distribution,
            'total_domains': len(domain_distribution),
            'most_connected_node': most_connected,
            'root_nodes': root_nodes,
            'leaf_nodes': leaf_nodes,
            'longest_chain': longest_chain,
            'graph_density': graph_density,
        }

    async def get_domain_statistics(self, domain: str) -> dict[str, Any]:
        """Get statistics scoped to a single domain."""
        from sqlalchemy import func, select

        from app.models.knowledge_edge import KnowledgeEdge
        from app.models.knowledge_node import KnowledgeNode

        domain_filter = KnowledgeNode.extra_metadata['domain'].astext == domain
        count_stmt = (
            select(func.count())
            .select_from(KnowledgeNode)
            .where(
                domain_filter,
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
        )
        count_result = await self._uow.session.execute(count_stmt)
        node_count = count_result.scalar() or 0

        diff_stmt = (
            select(
                KnowledgeNode.difficulty,
                func.count().label('count'),
            )
            .where(
                domain_filter,
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .group_by(KnowledgeNode.difficulty)
        )
        diff_result = await self._uow.session.execute(diff_stmt)
        difficulty_dist = [
            {
                'difficulty': row[0].value if hasattr(row[0], 'value') else row[0],
                'count': row[1],
            }
            for row in diff_result.all()
        ]

        domain_ids_stmt = select(KnowledgeNode.id).where(
            domain_filter,
            KnowledgeNode.is_deleted.isnot(True),
            KnowledgeNode.is_published,
        )
        domain_ids_result = await self._uow.session.execute(domain_ids_stmt)
        domain_ids = {row[0] for row in domain_ids_result.all()}

        edge_count = 0
        if domain_ids:
            edge_stmt = (
                select(func.count())
                .select_from(KnowledgeEdge)
                .where(
                    KnowledgeEdge.source_node_id.in_(list(domain_ids)),
                    KnowledgeEdge.target_node_id.in_(list(domain_ids)),
                    KnowledgeEdge.is_deleted.isnot(True),
                )
            )
            edge_result = await self._uow.session.execute(edge_stmt)
            edge_count = edge_result.scalar() or 0

        return {
            'domain': domain,
            'node_count': node_count,
            'edge_count': edge_count,
            'difficulty_distribution': difficulty_dist,
        }

    # ── Internal Helpers ───────────────────────────────────────────

    async def _find_most_connected_node(self) -> dict[str, Any] | None:
        """Find the node with the most incident edges."""
        from sqlalchemy import func, select

        from app.models.knowledge_edge import KnowledgeEdge

        outgoing_stmt = (
            select(
                KnowledgeEdge.source_node_id,
                func.count().label('count'),
            )
            .where(KnowledgeEdge.is_deleted.isnot(True))
            .group_by(KnowledgeEdge.source_node_id)
            .order_by(func.count().desc())
            .limit(1)
        )
        outgoing_result = await self._uow.session.execute(outgoing_stmt)
        outgoing_row = outgoing_result.one_or_none()

        if not outgoing_row:
            return None

        node = await self._uow.knowledge_nodes.get_by_id(outgoing_row[0])
        if not node:
            return None

        incident_stmt = (
            select(func.count())
            .select_from(KnowledgeEdge)
            .where(
                (KnowledgeEdge.source_node_id == node.id)
                | (KnowledgeEdge.target_node_id == node.id),
                KnowledgeEdge.is_deleted.isnot(True),
            )
        )
        incident_result = await self._uow.session.execute(incident_stmt)
        edge_count = incident_result.scalar() or 0

        return {
            'id': str(node.id),
            'slug': node.slug,
            'title': node.title,
            'node_type': node.node_type.value
            if hasattr(node.node_type, 'value')
            else node.node_type,
            'edge_count': edge_count,
        }

    async def _find_root_nodes(self) -> list[dict[str, Any]]:
        """Find nodes with no prerequisites (roots of the DAG)."""
        from sqlalchemy import select

        from app.models.knowledge_edge import KnowledgeEdge
        from app.models.knowledge_node import KnowledgeNode

        subq = (
            select(KnowledgeEdge.target_node_id)
            .where(
                KnowledgeEdge.relationship_type == 'prerequisite',
                KnowledgeEdge.is_deleted.isnot(True),
            )
            .distinct()
        )
        stmt = (
            select(KnowledgeNode)
            .where(
                KnowledgeNode.id.notin_(subq),
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .order_by(KnowledgeNode.title)
        )
        result = await self._uow.session.execute(stmt)
        nodes = list(result.scalars().all())
        return [
            {
                'id': str(n.id),
                'slug': n.slug,
                'title': n.title,
                'node_type': n.node_type.value if hasattr(n.node_type, 'value') else n.node_type,
            }
            for n in nodes
        ]

    async def _find_leaf_nodes(self) -> list[dict[str, Any]]:
        """Find nodes that unlock nothing (no dependents)."""
        from sqlalchemy import select

        from app.models.knowledge_edge import KnowledgeEdge
        from app.models.knowledge_node import KnowledgeNode

        subq = (
            select(KnowledgeEdge.source_node_id)
            .where(
                KnowledgeEdge.relationship_type == 'prerequisite',
                KnowledgeEdge.is_deleted.isnot(True),
            )
            .distinct()
        )
        stmt = (
            select(KnowledgeNode)
            .where(
                KnowledgeNode.id.notin_(subq),
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .order_by(KnowledgeNode.title)
        )
        result = await self._uow.session.execute(stmt)
        nodes = list(result.scalars().all())
        return [
            {
                'id': str(n.id),
                'slug': n.slug,
                'title': n.title,
                'node_type': n.node_type.value if hasattr(n.node_type, 'value') else n.node_type,
            }
            for n in nodes
        ]

    async def _find_longest_chain(self) -> dict[str, Any]:
        """Find the longest prerequisite chain in the graph."""
        from sqlalchemy import select

        from app.models.knowledge_edge import KnowledgeEdge
        from app.models.knowledge_node import KnowledgeNode

        stmt = select(KnowledgeNode).where(
            KnowledgeNode.is_deleted.isnot(True),
            KnowledgeNode.is_published,
        )
        result = await self._uow.session.execute(stmt)
        all_nodes = list(result.scalars().all())
        node_ids = {n.id for n in all_nodes}

        if not node_ids:
            return {'depth': 0, 'deepest_node': None}

        edge_stmt = select(KnowledgeEdge).where(
            KnowledgeEdge.source_node_id.in_(list(node_ids)),
            KnowledgeEdge.target_node_id.in_(list(node_ids)),
            KnowledgeEdge.relationship_type == 'prerequisite',
            KnowledgeEdge.is_deleted.isnot(True),
        )
        edge_result = await self._uow.session.execute(edge_stmt)
        edges = list(edge_result.scalars().all())

        in_degree: Counter[UUID] = Counter()
        adj: dict[UUID, list[UUID]] = {nid: [] for nid in node_ids}

        for edge in edges:
            adj.setdefault(edge.source_node_id, []).append(edge.target_node_id)
            in_degree[edge.target_node_id] += 1
            in_degree.setdefault(edge.source_node_id, 0)

        from collections import deque

        queue: deque[UUID] = deque([nid for nid in node_ids if in_degree.get(nid, 0) == 0])

        depth_map: dict[UUID, int] = {nid: 0 for nid in node_ids}
        predecessor: dict[UUID, UUID | None] = {nid: None for nid in node_ids}

        while queue:
            nid = queue.popleft()
            for neighbor in adj.get(nid, []):
                in_degree[neighbor] -= 1
                if depth_map[neighbor] < depth_map[nid] + 1:
                    depth_map[neighbor] = depth_map[nid] + 1
                    predecessor[neighbor] = nid
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        best_depth = max(depth_map.values()) if depth_map else 0
        deepest_id: UUID | None = None
        for nid, d in depth_map.items():
            if d == best_depth:
                deepest_id = nid
                break

        chain: list[str] = []
        if deepest_id:
            current: UUID | None = deepest_id
            while current is not None:
                n = await self._uow.knowledge_nodes.get_by_id(current)
                if n:
                    chain.append(n.slug)
                current = predecessor.get(current)
            chain.reverse()

        return {
            'depth': best_depth,
            'deepest_node_slug': chain[-1] if chain else None,
            'chain': chain,
        }
