"""KnowledgeEdge repository — persistence operations for the ``KnowledgeEdge`` model."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import or_, select

from app.models.knowledge_edge import KnowledgeEdge
from app.repositories.base import BaseRepository
from app.repositories.query_helpers import FilterCondition, PageResult


class KnowledgeEdgeRepository(BaseRepository[KnowledgeEdge]):
    """Repository for ``KnowledgeEdge`` persistence operations.

    Provides graph-traversal-adjacent queries: finding edges by source,
    target, type, or any combination thereof.
    """

    model = KnowledgeEdge

    # ── Source/Target Lookups ──────────────────────────────────────

    async def find_by_source(
        self,
        source_node_id: UUID,
        relationship_type: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[KnowledgeEdge]:
        """Find all edges originating from a given node."""
        filters: dict[str, Any] = {'source_node_id': source_node_id}
        if relationship_type:
            filters['relationship_type'] = relationship_type
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='created_at',
            sort_direction='desc',
        )

    async def find_by_target(
        self,
        target_node_id: UUID,
        relationship_type: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[KnowledgeEdge]:
        """Find all edges targeting a given node."""
        filters: dict[str, Any] = {'target_node_id': target_node_id}
        if relationship_type:
            filters['relationship_type'] = relationship_type
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='created_at',
            sort_direction='desc',
        )

    async def find_between(
        self,
        source_node_id: UUID,
        target_node_id: UUID,
        relationship_type: str | None = None,
    ) -> list[KnowledgeEdge]:
        """Find edges connecting two specific nodes."""
        conditions = [
            FilterCondition(field='source_node_id', value=source_node_id, operator='eq'),
            FilterCondition(field='target_node_id', value=target_node_id, operator='eq'),
        ]
        if relationship_type:
            conditions.append(
                FilterCondition(field='relationship_type', value=relationship_type, operator='eq'),
            )
        return await self.find_by(conditions=conditions)

    async def exists_edge(
        self,
        source_node_id: UUID,
        target_node_id: UUID,
        relationship_type: str,
    ) -> bool:
        """Check whether a specific edge already exists (including soft-deleted)."""
        return await self.exists(
            source_node_id=source_node_id,
            target_node_id=target_node_id,
            relationship_type=relationship_type,
        )

    # ── Bulk Operations ────────────────────────────────────────────

    async def find_all_for_nodes(
        self,
        node_ids: list[UUID],
        relationship_type: str | None = None,
    ) -> list[KnowledgeEdge]:
        """Find all edges where either source or target is in ``node_ids``."""
        if not node_ids:
            return []

        conditions = [
            FilterCondition(
                field='source_node_id',
                value=node_ids,
                operator='in',
            ),
        ]
        if relationship_type:
            conditions.append(
                FilterCondition(field='relationship_type', value=relationship_type, operator='eq'),
            )

        # Also include edges where target is in node_ids
        stmt = select(KnowledgeEdge).where(
            or_(
                KnowledgeEdge.source_node_id.in_(node_ids),
                KnowledgeEdge.target_node_id.in_(node_ids),
            ),
        )
        stmt = self._apply_active_filter(stmt)
        if relationship_type:
            stmt = stmt.where(KnowledgeEdge.relationship_type == relationship_type)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_between(
        self,
        source_node_id: UUID,
        target_node_id: UUID,
        relationship_type: str | None = None,
    ) -> int:
        """Soft-delete all edges between two nodes, optionally filtered by type.

        Returns the number of edges affected.
        """
        conditions = [
            FilterCondition(field='source_node_id', value=source_node_id, operator='eq'),
            FilterCondition(field='target_node_id', value=target_node_id, operator='eq'),
        ]
        if relationship_type:
            conditions.append(
                FilterCondition(field='relationship_type', value=relationship_type, operator='eq'),
            )

        edges = await self.find_by(conditions=conditions)
        for edge in edges:
            edge.is_deleted = True
        await self.session.flush()
        return len(edges)
