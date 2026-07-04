"""Skill service — business logic for skill operations."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.skill import Skill
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError, DuplicateEntityError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class SkillService:
    """Business logic for skill operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_by_id(self, skill_id: UUID) -> Skill:
        """Get a skill by ID."""
        skill = await self._uow.skills.get_by_id(skill_id)
        if not skill:
            raise EntityNotFoundError('Skill', skill_id)
        return skill

    async def list_skills(
        self,
        page: int = 1,
        per_page: int = 20,
        category: str | None = None,
        difficulty: str | None = None,
    ) -> PageResult[Skill]:
        """List skills with optional filtering."""
        filters = {}
        if category:
            filters['category'] = category
        if difficulty:
            filters['difficulty'] = difficulty
        return await self._uow.skills.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='name',
        )

    async def get_categories(self) -> list[str]:
        """Get all distinct skill categories."""
        return await self._uow.skills.list_categories()

    async def get_category_counts(self) -> list[dict]:
        """Get skill counts grouped by category."""
        return await self._uow.skills.count_by_category()

    async def get_relationships(self, skill_id: UUID) -> dict:
        """Get all relationships for a skill (both directions)."""
        outgoing = await self._uow.skills.get_relationships(skill_id, direction='outgoing')
        incoming = await self._uow.skills.get_relationships(skill_id, direction='incoming')

        return {
            'outgoing': outgoing,
            'incoming': incoming,
        }
