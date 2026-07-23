"""Graph Analytics Service — graph-level metrics and analysis.

Provides algorithms for computing:
- Central nodes (high degree centrality)
- Isolated nodes (no edges)
- Prerequisite bottlenecks (nodes with many dependents)
- Concept depth (distance from root/basic concepts)
- Graph density (edges / possible edges)
- Average branching factor

All algorithms delegate persistence to the repository layer and are
designed for graphs with up to 100k+ nodes.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import func, select
from structlog.stdlib import get_logger

from app.models.knowledge_edge import KnowledgeEdge
from app.models.knowledge_node import KnowledgeNode

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork
    from app.repositories.graph import GraphRepository

logger = get_logger(__name__)


class GraphAnalyticsService:
    """Graph-level analytics and metrics for the knowledge graph.

    Provides insight into the structure, health, and complexity of
    the knowledge graph through quantitative metrics.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._graph_repo: GraphRepository = uow.graph

    # ── Degree Centrality ──────────────────────────────────────────
    # Time: O(V)  |  Space: O(V)

    async def degree_centrality(self, limit: int = 20) -> list[dict]:
        """Find the most connected nodes by total edge count (degree).

        Nodes with the highest number of incoming + outgoing edges
        are the most central in the graph.

        Returns up to ``limit`` nodes sorted by centrality descending.
        """
        # Count total edges per node
        outgoing_stmt = (
            select(
                KnowledgeEdge.source_node_id.label('node_id'),
                func.count().label('edge_count'),
            )
            .where(KnowledgeEdge.is_deleted.isnot(True))
            .group_by(KnowledgeEdge.source_node_id)
            .cte('outgoing_counts')
        )

        incoming_stmt = (
            select(
                KnowledgeEdge.target_node_id.label('node_id'),
                func.count().label('edge_count'),
            )
            .where(KnowledgeEdge.is_deleted.isnot(True))
            .group_by(KnowledgeEdge.target_node_id)
            .cte('incoming_counts')
        )

        # Join and sum
        stmt = (
            select(
                KnowledgeNode.id,
                KnowledgeNode.title,
                KnowledgeNode.slug,
                KnowledgeNode.node_type,
                KnowledgeNode.difficulty,
                (
                    func.coalesce(outgoing_stmt.c.edge_count, 0)
                    + func.coalesce(incoming_stmt.c.edge_count, 0)
                ).label('total_connections'),
            )
            .outerjoin(outgoing_stmt, KnowledgeNode.id == outgoing_stmt.c.node_id)
            .outerjoin(incoming_stmt, KnowledgeNode.id == incoming_stmt.c.node_id)
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .order_by(
                func.coalesce(outgoing_stmt.c.edge_count, 0)
                + func.coalesce(incoming_stmt.c.edge_count, 0).desc(),
            )
            .limit(limit)
        )

        result = await self._uow.session.execute(stmt)
        return [
            {
                'id': str(row.id),
                'title': row.title,
                'slug': row.slug,
                'node_type': row.node_type.value
                if hasattr(row.node_type, 'value')
                else row.node_type,
                'difficulty': row.difficulty.value
                if hasattr(row.difficulty, 'value')
                else row.difficulty,
                'total_connections': row.total_connections,
            }
            for row in result.all()
        ]

    # ── Isolated Nodes ─────────────────────────────────────────────
    # Time: O(V)  |  Space: O(V)

    async def isolated_nodes(self) -> list[dict]:
        """Find nodes that have no edges (neither incoming nor outgoing).

        These nodes are disconnected from the knowledge graph and may
        represent incomplete or orphaned content.
        """
        # Find all node IDs that appear in edges
        edge_node_ids = (
            select(KnowledgeEdge.source_node_id)
            .where(KnowledgeEdge.is_deleted.isnot(True))
            .union(select(KnowledgeEdge.target_node_id).where(KnowledgeEdge.is_deleted.isnot(True)))
            .cte('edge_nodes')
        )

        stmt = (
            select(KnowledgeNode)
            .where(
                KnowledgeNode.id.notin_(select(edge_node_ids.c.source_node_id)),
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
                'title': n.title,
                'slug': n.slug,
                'node_type': n.node_type.value if hasattr(n.node_type, 'value') else n.node_type,
                'difficulty': n.difficulty.value
                if hasattr(n.difficulty, 'value')
                else n.difficulty,
            }
            for n in nodes
        ]

    # ── Prerequisite Bottlenecks ───────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def prerequisite_bottlenecks(self, limit: int = 20) -> list[dict]:
        """Find nodes that are prerequisites for the most other nodes.

        These are 'bottleneck' concepts — if a learner struggles here,
        it blocks progress in many downstream topics.
        """
        bottleneck_stmt = (
            select(
                KnowledgeEdge.source_node_id.label('node_id'),
                func.count().label('dependent_count'),
            )
            .where(
                KnowledgeEdge.relationship_type == 'prerequisite',
                KnowledgeEdge.is_deleted.isnot(True),
            )
            .group_by(KnowledgeEdge.source_node_id)
            .order_by(func.count().desc())
            .limit(limit)
            .cte('bottlenecks')
        )

        stmt = (
            select(
                KnowledgeNode.id,
                KnowledgeNode.title,
                KnowledgeNode.slug,
                KnowledgeNode.node_type,
                KnowledgeNode.difficulty,
                bottleneck_stmt.c.dependent_count,
            )
            .join(bottleneck_stmt, KnowledgeNode.id == bottleneck_stmt.c.node_id)
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .order_by(bottleneck_stmt.c.dependent_count.desc())
        )

        result = await self._uow.session.execute(stmt)
        return [
            {
                'id': str(row.id),
                'title': row.title,
                'slug': row.slug,
                'node_type': row.node_type.value
                if hasattr(row.node_type, 'value')
                else row.node_type,
                'difficulty': row.difficulty.value
                if hasattr(row.difficulty, 'value')
                else row.difficulty,
                'dependent_count': row.dependent_count,
            }
            for row in result.all()
        ]

    # ── Concept Depth ──────────────────────────────────────────────
    # Time: O(V * D)  |  Space: O(V)

    async def concept_depth_distribution(self) -> dict:
        """Compute the depth distribution of concepts in the graph.

        Depth is measured as the number of prerequisite hops from the
        most fundamental (root) nodes.  Root nodes have no prerequisites.

        Returns a dict with ``min_depth``, ``max_depth``, ``avg_depth``,
        and a ``distribution`` histogram.
        """
        # Find root nodes (no incoming prerequisite edges)
        all_nodes = await self._uow.knowledge_nodes.find_published()
        root_nodes = []
        depth_map: dict[UUID, int] = {}

        for node in all_nodes:
            prereqs = await self._graph_repo.load_prerequisites(node.id)
            if not prereqs:
                root_nodes.append(node)
                depth_map[node.id] = 0

        # BFS from roots to assign depths
        from collections import deque

        queue: deque[UUID] = deque([n.id for n in root_nodes])

        while queue:
            current_id = queue.popleft()
            current_depth = depth_map.get(current_id, 0)

            dependents = await self._graph_repo.load_dependents(current_id)
            for dep in dependents:
                if dep.id not in depth_map:
                    depth_map[dep.id] = current_depth + 1
                    queue.append(dep.id)

        if not depth_map:
            return {
                'min_depth': 0,
                'max_depth': 0,
                'avg_depth': 0.0,
                'distribution': {},
                'root_node_count': 0,
            }

        depths = list(depth_map.values())
        distribution: dict[str, int] = {}
        for d in depths:
            key = f'depth_{d}'
            distribution[key] = distribution.get(key, 0) + 1

        return {
            'min_depth': min(depths),
            'max_depth': max(depths),
            'avg_depth': round(sum(depths) / len(depths), 2),
            'distribution': distribution,
            'root_node_count': len(root_nodes),
        }

    # ── Graph Density ──────────────────────────────────────────────
    # Time: O(1)  |  Space: O(1)

    async def graph_density(self) -> dict:
        """Compute the density of the knowledge graph.

        Density = (2 * |E|) / (|V| * (|V| - 1))

        A density close to 1 means nearly all nodes are connected.
        A density close to 0 means the graph is sparse.
        """
        total_nodes = await self._uow.knowledge_nodes.count(filters={'is_published': True})
        total_edges = await self._uow.knowledge_edges.count()

        density = 0.0
        if total_nodes > 1:
            density = (2.0 * total_edges) / (total_nodes * (total_nodes - 1))

        return {
            'total_nodes': total_nodes,
            'total_edges': total_edges,
            'density': round(density, 6),
            'max_possible_edges': total_nodes * (total_nodes - 1) // 2,
        }

    # ── Average Branching Factor ───────────────────────────────────
    # Time: O(V)  |  Space: O(1)

    async def average_branching_factor(self) -> dict:
        """Compute the average branching factor of the graph.

        Branching factor = average number of outgoing edges per node.

        A higher branching factor means concepts have more dependents
        and the graph spreads out quickly.
        """
        from sqlalchemy import func as sql_func

        stmt = (
            select(
                sql_func.avg(
                    select(sql_func.count())
                    .select_from(KnowledgeEdge)
                    .where(
                        KnowledgeEdge.source_node_id == KnowledgeNode.id,
                        KnowledgeEdge.is_deleted.isnot(True),
                    )
                    .scalar_subquery(),
                ).label('avg_outgoing'),
            )
            .select_from(KnowledgeNode)
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
        )

        result = await self._uow.session.execute(stmt)
        avg_branching = result.scalar() or 0.0

        # Also get nodes by outgoing edge count for histogram
        # Use literal_column to reference the subquery label properly
        from sqlalchemy import literal_column

        outgoing_subq = (
            select(sql_func.count())
            .select_from(KnowledgeEdge)
            .where(
                KnowledgeEdge.source_node_id == KnowledgeNode.id,
                KnowledgeEdge.is_deleted.isnot(True),
            )
            .scalar_subquery()
        )

        histogram_stmt = (
            select(
                sql_func.coalesce(outgoing_subq, 0).label('outgoing_count'),
                sql_func.count().label('node_count'),
            )
            .select_from(KnowledgeNode)
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .group_by(literal_column('outgoing_count'))
            .order_by(literal_column('outgoing_count'))
        )

        hist_result = await self._uow.session.execute(histogram_stmt)
        histogram = {f'{row.outgoing_count}_outgoing': row.node_count for row in hist_result.all()}

        return {
            'avg_branching_factor': round(float(avg_branching), 3),
            'histogram': histogram,
        }

    # ── Preserved Legacy Stats ─────────────────────────────────────

    async def graph_statistics(self) -> dict:
        """Get comprehensive graph statistics combining multiple metrics."""
        density_data = await self.graph_density()
        branching = await self.average_branching_factor()
        depth = await self.concept_depth_distribution()

        return {
            'total_nodes': density_data['total_nodes'],
            'total_edges': density_data['total_edges'],
            'graph_density': density_data['density'],
            'avg_branching_factor': branching['avg_branching_factor'],
            'branching_histogram': branching['histogram'],
            'depth': {
                'min': depth['min_depth'],
                'max': depth['max_depth'],
                'avg': depth['avg_depth'],
                'distribution': depth['distribution'],
                'root_nodes': depth['root_node_count'],
            },
        }
