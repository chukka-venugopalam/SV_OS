"""Career repository — persistence operations for ``Career`` and ``CareerRequirement`` models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from app.models.career import Career, CareerRequirement
from app.models.knowledge_node import KnowledgeNode
from app.repositories.base import BaseRepository
from app.repositories.errors import EntityNotFoundError

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class CareerRepository(BaseRepository[Career]):
    """Repository for ``Career`` persistence operations."""

    model = Career

    # ── Lookup Methods ─────────────────────────────────────────────

    async def find_by_slug(self, slug: str) -> Career | None:
        """Find a career by its URL-safe slug."""
        return await self.get_by_field('slug', slug)

    async def get_by_slug(self, slug: str) -> Career:
        """Find by slug or raise ``EntityNotFoundError``."""
        career = await self.find_by_slug(slug)
        if not career:
            msg = 'Career'
            raise EntityNotFoundError(msg, slug)
        return career

    async def find_by_demand(
        self,
        demand_level: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Career]:
        """Find careers by market demand level."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'demand_level': demand_level},
            sort_field='title',
        )

    async def find_published(
        self,
        page: int = 1,
        per_page: int = 20,
        demand_level: str | None = None,
    ) -> PageResult[Career]:
        """Find published careers with optional demand-level filter."""
        filters: dict[str, Any] = {'is_published': True}
        if demand_level:
            filters['demand_level'] = demand_level
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='title',
        )

    # ── Requirements Management ────────────────────────────────────

    async def get_requirements(self, career_id: UUID) -> list[CareerRequirement]:
        """Get all knowledge-node requirements for a career, ordered by index."""
        from sqlalchemy import select

        stmt = (
            select(CareerRequirement)
            .where(CareerRequirement.career_id == career_id)
            .where(not CareerRequirement.is_deleted)
            .order_by(CareerRequirement.order_index)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_requirement(
        self,
        career_id: UUID,
        node_id: UUID,
        requirement_type: str = 'required',
        order_index: int = 0,
    ) -> CareerRequirement:
        """Add a knowledge-node requirement to a career."""
        requirement = CareerRequirement(
            career_id=career_id,
            node_id=node_id,
            requirement_type=requirement_type,
            order_index=order_index,
        )
        self.session.add(requirement)
        await self.session.flush()
        await self.session.refresh(requirement)
        return requirement

    async def remove_requirement(
        self,
        career_id: UUID,
        node_id: UUID,
        requirement_type: str | None = None,
    ) -> bool:
        """Remove (soft-delete) a requirement from a career.

        Returns ``True`` if a requirement was removed.
        """
        stmt = select(CareerRequirement).where(
            CareerRequirement.career_id == career_id,
            CareerRequirement.node_id == node_id,
        )
        if requirement_type:
            stmt = stmt.where(CareerRequirement.requirement_type == requirement_type)

        result = await self.session.execute(stmt)
        requirement = result.scalar_one_or_none()
        if not requirement:
            return False

        requirement.is_deleted = True
        await self.session.flush()
        return True

    # ── Related Queries ───────────────────────────────────────────

    async def get_nodes_for_career(self, career_id: UUID) -> list[dict[str, Any]]:
        """Get all knowledge nodes required for a career, with
        requirement metadata.
        """
        from sqlalchemy import select

        stmt = (
            select(KnowledgeNode, CareerRequirement)
            .join(
                CareerRequirement,
                CareerRequirement.node_id == KnowledgeNode.id,
            )
            .where(
                CareerRequirement.career_id == career_id,
                not CareerRequirement.is_deleted,
                not KnowledgeNode.is_deleted,
            )
            .order_by(CareerRequirement.order_index)
        )
        result = await self.session.execute(stmt)
        return [
            {
                'node': node,
                'requirement_type': req.requirement_type,
                'order_index': req.order_index,
            }
            for node, req in result.all()
        ]

    async def find_careers_by_node(self, node_id: UUID) -> list[Career]:
        """Find all careers that require a given knowledge node."""
        from sqlalchemy import select

        stmt = (
            select(Career)
            .join(CareerRequirement, CareerRequirement.career_id == Career.id)
            .where(
                CareerRequirement.node_id == node_id,
                not Career.is_deleted,
                Career.is_published,
            )
            .distinct()
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ── Statistics ─────────────────────────────────────────────────

    async def count_by_demand(self) -> list[dict[str, Any]]:
        """Count careers grouped by demand level."""
        from sqlalchemy import func

        from app.models.enums import DemandLevel

        stmt = (
            select(
                Career.demand_level,
                func.count().label('count'),
            )
            .where(not Career.is_deleted)
            .group_by(Career.demand_level)
        )
        result = await self.session.execute(stmt)
        return [
            {
                'demand_level': row[0].value if isinstance(row[0], DemandLevel) else row[0],
                'count': row[1],
            }
            for row in result.all()
        ]
