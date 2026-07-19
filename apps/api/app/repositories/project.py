"""Project repository — persistence operations for ``Project`` and ``ProjectRequirement`` models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from app.models.project import Project, ProjectRequirement
from app.repositories.base import BaseRepository
from app.repositories.errors import EntityNotFoundError

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class ProjectRepository(BaseRepository[Project]):
    """Repository for ``Project`` persistence operations."""

    model = Project

    # ── Lookup Methods ─────────────────────────────────────────────

    async def find_by_slug(self, slug: str) -> Project | None:
        """Find a project by its URL-safe slug."""
        return await self.get_by_field('slug', slug)

    async def get_by_slug(self, slug: str) -> Project:
        """Find by slug or raise ``EntityNotFoundError``."""
        project = await self.find_by_slug(slug)
        if not project:
            msg = 'Project'
            raise EntityNotFoundError(msg, slug)
        return project

    async def find_by_difficulty(
        self,
        difficulty: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Project]:
        """Find projects by difficulty level."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'difficulty': difficulty},
            sort_field='title',
        )

    async def find_published(
        self,
        page: int = 1,
        per_page: int = 20,
        difficulty: str | None = None,
    ) -> PageResult[Project]:
        """Find published projects with optional difficulty filter."""
        filters: dict[str, Any] = {'is_published': True}
        if difficulty:
            filters['difficulty'] = difficulty
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='title',
        )

    # ── Requirements Management ────────────────────────────────────

    async def get_requirements(self, project_id: UUID) -> list[ProjectRequirement]:
        """Get all knowledge-node requirements for a project."""
        stmt = (
            select(ProjectRequirement)
            .where(ProjectRequirement.project_id == project_id)
            .where(not ProjectRequirement.is_deleted)
            .order_by(ProjectRequirement.order_index)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_requirement(
        self,
        project_id: UUID,
        node_id: UUID,
        requirement_type: str = 'required',
        order_index: int = 0,
    ) -> ProjectRequirement:
        """Add a knowledge-node requirement to a project."""
        requirement = ProjectRequirement(
            project_id=project_id,
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
        project_id: UUID,
        node_id: UUID,
        requirement_type: str | None = None,
    ) -> bool:
        """Remove (soft-delete) a requirement from a project."""
        stmt = select(ProjectRequirement).where(
            ProjectRequirement.project_id == project_id,
            ProjectRequirement.node_id == node_id,
        )
        if requirement_type:
            stmt = stmt.where(ProjectRequirement.requirement_type == requirement_type)

        result = await self.session.execute(stmt)
        requirement = result.scalar_one_or_none()
        if not requirement:
            return False

        requirement.is_deleted = True
        await self.session.flush()
        return True
