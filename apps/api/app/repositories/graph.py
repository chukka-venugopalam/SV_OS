"""Graph repository — persistence queries for the knowledge graph.

This repository contains **only** data-access queries for the knowledge
graph.  Graph algorithms (shortest path, traversal, ranking) belong in
the service layer, not here.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import and_, func, or_, select, text

from app.models.knowledge_edge import KnowledgeEdge
from app.models.knowledge_node import KnowledgeNode
from app.repositories.base import BaseRepository
from app.repositories.errors import RepositoryError
from app.repositories.query_helpers import FilterCondition, PageResult, SortDirection


class GraphRepository(BaseRepository[KnowledgeNode]):
    """Repository for knowledge graph persistence queries.

    Provides read-only access to graph structure — edges, neighbors,
    prerequisites, dependencies — without implementing graph algorithms.
    """

    model = KnowledgeNode

    # ── Neighbor Queries ───────────────────────────────────────────

    async def load_neighbors(
        self,
        node_id: UUID,
        relationship_type: str | None = None,
        direction: str = 'outgoing',
    ) -> list[KnowledgeNode]:
        """Load all neighbor nodes connected by edges to the given node.

        Args:
            node_id: The central node ID.
            relationship_type: Optional edge type filter.
            direction: 'outgoing' (source → target) or 'incoming' (target → source).

        Returns:
            List of neighbor ``KnowledgeNode`` instances.
        """
        if direction == 'outgoing':
            edge_filter = KnowledgeEdge.source_node_id == node_id
            neighbor_id_col = KnowledgeEdge.target_node_id
        else:
            edge_filter = KnowledgeEdge.target_node_id == node_id
            neighbor_id_col = KnowledgeEdge.source_node_id

        stmt = (
            select(KnowledgeNode)
            .join(KnowledgeEdge, KnowledgeNode.id == neighbor_id_col)
            .where(
                edge_filter,
                KnowledgeEdge.is_deleted == False,  # noqa: E712
                KnowledgeNode.is_deleted == False,  # noqa: E712
                KnowledgeNode.is_published == True,  # noqa: E712
            )
        )
        if relationship_type:
            stmt = stmt.where(KnowledgeEdge.relationship_type == relationship_type)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def load_all_neighbors(
        self,
        node_id: UUID,
        relationship_type: str | None = None,
    ) -> dict[str, list[KnowledgeNode]]:
        """Load both incoming and outgoing neighbors.

        Returns a dict with ``outgoing`` and ``incoming`` keys.
        """
        outgoing = await self.load_neighbors(
            node_id=node_id,
            relationship_type=relationship_type,
            direction='outgoing',
        )
        incoming = await self.load_neighbors(
            node_id=node_id,
            relationship_type=relationship_type,
            direction='incoming',
        )
        return {'outgoing': outgoing, 'incoming': incoming}

    # ── Prerequisite Queries ───────────────────────────────────────

    async def load_prerequisites(
        self,
        node_id: UUID,
    ) -> list[KnowledgeNode]:
        """Load all prerequisite nodes for the given node.

        Prerequisites are nodes that have edges *pointing to* the
        given node with ``relationship_type = 'prerequisite'``.
        Since the edge direction is source → target (source is
        prerequisite, target depends on source), we look at
        *incoming* edges to find prerequisites.
        """
        return await self.load_neighbors(
            node_id=node_id,
            relationship_type='prerequisite',
            direction='incoming',
        )

    async def load_dependents(
        self,
        node_id: UUID,
    ) -> list[KnowledgeNode]:
        """Load all nodes that depend on the given node.

        Dependents are nodes where this node is a prerequisite for them.
        Since edges go from prerequisite (source) → dependent (target),
        we look at *outgoing* edges with type 'prerequisite'.
        """
        return await self.load_neighbors(
            node_id=node_id,
            relationship_type='prerequisite',
            direction='outgoing',
        )

    # ── Dependency Queries ─────────────────────────────────────────

    async def load_dependencies(
        self,
        node_id: UUID,
        max_depth: int = 1,
    ) -> list[dict[str, Any]]:
        """Load dependencies (outgoing edges) with edge metadata.

        Args:
            node_id: The source node ID.
            max_depth: Depth of recursion (1 = immediate neighbors only).

        Returns:
            List of dicts with ``node`` and ``edge`` keys.
        """
        stmt = (
            select(KnowledgeEdge, KnowledgeNode)
            .join(KnowledgeNode, KnowledgeNode.id == KnowledgeEdge.target_node_id)
            .where(
                KnowledgeEdge.source_node_id == node_id,
                KnowledgeEdge.is_deleted == False,  # noqa: E712
                KnowledgeNode.is_deleted == False,  # noqa: E712
            )
            .order_by(KnowledgeEdge.relationship_type, KnowledgeNode.title)
        )
        result = await self.session.execute(stmt)
        return [
            {'edge': edge, 'node': node}
            for edge, node in result.all()
        ]

    # ── Edge Queries ───────────────────────────────────────────────

    async def load_outgoing_edges(
        self,
        node_id: UUID,
        relationship_type: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[KnowledgeEdge]:
        """Load outgoing edges for a node with pagination."""
        from app.repositories.knowledge_edge import KnowledgeEdgeRepository

        edge_repo = KnowledgeEdgeRepository(self.session)
        return await edge_repo.find_by_source(
            source_node_id=node_id,
            relationship_type=relationship_type,
            page=page,
            per_page=per_page,
        )

    async def load_incoming_edges(
        self,
        node_id: UUID,
        relationship_type: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[KnowledgeEdge]:
        """Load incoming edges for a node with pagination."""
        from app.repositories.knowledge_edge import KnowledgeEdgeRepository

        edge_repo = KnowledgeEdgeRepository(self.session)
        return await edge_repo.find_by_target(
            target_node_id=node_id,
            relationship_type=relationship_type,
            page=page,
            per_page=per_page,
        )

    async def count_edges_for_node(self, node_id: UUID) -> dict[str, int]:
        """Count incoming and outgoing edges for a node."""
        # Outgoing count
        outgoing_stmt = (
            select(func.count())
            .select_from(KnowledgeEdge)
            .where(
                KnowledgeEdge.source_node_id == node_id,
                KnowledgeEdge.is_deleted == False,  # noqa: E712
            )
        )
        # Incoming count
        incoming_stmt = (
            select(func.count())
            .select_from(KnowledgeEdge)
            .where(
                KnowledgeEdge.target_node_id == node_id,
                KnowledgeEdge.is_deleted == False,  # noqa: E712
            )
        )
        outgoing_result = await self.session.execute(outgoing_stmt)
        incoming_result = await self.session.execute(incoming_stmt)
        return {
            'outgoing': outgoing_result.scalar() or 0,
            'incoming': incoming_result.scalar() or 0,
        }

    # ── Bulk / Multi-Node Queries ──────────────────────────────────

    async def load_edges_for_nodes(
        self,
        node_ids: list[UUID],
        relationship_type: str | None = None,
    ) -> list[KnowledgeEdge]:
        """Load all edges where either endpoint is in ``node_ids``."""
        if not node_ids:
            return []

        stmt = (
            select(KnowledgeEdge)
            .where(
                or_(
                    KnowledgeEdge.source_node_id.in_(node_ids),
                    KnowledgeEdge.target_node_id.in_(node_ids),
                ),
                KnowledgeEdge.is_deleted == False,  # noqa: E712
            )
        )
        if relationship_type:
            stmt = stmt.where(KnowledgeEdge.relationship_type == relationship_type)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def load_edge_types_for_node(self, node_id: UUID) -> list[dict[str, Any]]:
        """Get distinct edge types and their counts for a node."""
        stmt = (
            select(
                KnowledgeEdge.relationship_type,
                func.count().label('count'),
            )
            .where(
                or_(
                    KnowledgeEdge.source_node_id == node_id,
                    KnowledgeEdge.target_node_id == node_id,
                ),
                KnowledgeEdge.is_deleted == False,  # noqa: E712
            )
            .group_by(KnowledgeEdge.relationship_type)
            .order_by(func.count().desc())
        )
        result = await self.session.execute(stmt)
        return [
            {
                'relationship_type': row[0].value if hasattr(row[0], 'value') else row[0],
                'count': row[1],
            }
            for row in result.all()
        ]
