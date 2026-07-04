"""LearningResource repository — persistence operations for the ``LearningResource`` model."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select

from app.models.learning_resource import LearningResource
from app.repositories.base import BaseRepository
from app.repositories.query_helpers import PageResult, SortDirection


class LearningResourceRepository(BaseRepository[LearningResource]):
    """Repository for ``LearningResource`` persistence operations."""

    model = LearningResource

    # ── Node-Centric Queries ───────────────────────────────────────

    async def find_by_node(
        self,
        node_id: UUID,
        resource_type: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[LearningResource]:
        """Find learning resources for a knowledge node."""
        filters: dict[str, Any] = {'node_id': node_id}
        if resource_type:
            filters['resource_type'] = resource_type
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='title',
        )

    async def find_by_type(
        self,
        resource_type: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[LearningResource]:
        """Find resources by type (video, article, course, etc.)."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'resource_type': resource_type},
            sort_field='title',
        )

    async def find_free(
        self,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[LearningResource]:
        """Find free (no-cost) learning resources."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'is_free': True},
            sort_field='title',
        )

    async def find_by_difficulty(
        self,
        difficulty: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[LearningResource]:
        """Find resources by difficulty level."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'difficulty': difficulty},
            sort_field='title',
        )

    # ── Bulk Operations ────────────────────────────────────────────

    async def find_all_for_nodes(
        self,
        node_ids: list[UUID],
    ) -> list[LearningResource]:
        """Find all resources belonging to any of the given node IDs."""
        if not node_ids:
            return []
        from sqlalchemy import select

        stmt = (
            select(LearningResource)
            .where(
                LearningResource.node_id.in_(node_ids),
                LearningResource.is_deleted == False,  # noqa: E712
            )
            .order_by(LearningResource.title)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_node(self, node_id: UUID) -> int:
        """Count resources for a specific knowledge node."""
        return await self.count(filters={'node_id': node_id})
