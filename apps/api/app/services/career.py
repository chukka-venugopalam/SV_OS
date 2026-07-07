"""Career service — business logic for career paths."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.career import Career
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class CareerService:
    """Business logic for career path operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_by_slug(self, slug: str) -> Career:
        """Get a career by slug."""
        return await self._uow.careers.get_by_slug(slug)

    async def list_careers(
        self,
        page: int = 1,
        per_page: int = 20,
        demand_level: str | None = None,
    ) -> PageResult[Career]:
        """List published careers with optional demand-level filter."""
        return await self._uow.careers.find_published(
            page=page,
            per_page=per_page,
            demand_level=demand_level,
        )

    async def get_roadmap(self, slug: str) -> dict:
        """Get a career's full roadmap with requirements grouped by type."""
        career = await self._uow.careers.get_by_slug(slug)
        requirements = await self._uow.careers.get_requirements(career.id)

        grouped = {'required': [], 'recommended': [], 'bonus': []}
        for req in requirements:
            type_key = req.requirement_type.value if hasattr(req.requirement_type, 'value') else str(req.requirement_type)
            if type_key in grouped:
                grouped[type_key].append({
                    'id': req.id,
                    'node_id': req.node_id,
                    'order_index': req.order_index,
                })

        return {
            'career': career,
            'requirements': grouped,
            'total_requirements': len(requirements),
        }

    async def get_nodes_for_career(self, slug: str) -> list:
        """Get all knowledge nodes required for a career.

        Uses a single join query via ``CareerRepository.get_nodes_for_career``
        to avoid N+1 queries.
        """
        career = await self._uow.careers.get_by_slug(slug)
        return await self._uow.careers.get_nodes_for_career(career.id)
