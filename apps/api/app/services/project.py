"""Project service — business logic for project operations."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.project import Project
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class ProjectService:
    """Business logic for project operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_by_slug(self, slug: str) -> Project:
        """Get a project by slug."""
        return await self._uow.projects.get_by_slug(slug)

    async def list_projects(
        self,
        page: int = 1,
        per_page: int = 20,
        difficulty: str | None = None,
    ) -> PageResult[Project]:
        """List published projects with optional difficulty filter."""
        return await self._uow.projects.find_published(
            page=page,
            per_page=per_page,
            difficulty=difficulty,
        )

    async def get_requirements(self, slug: str) -> list:
        """Get knowledge node requirements for a project.

        Batches node lookups into a single query to avoid N+1.
        """
        project = await self._uow.projects.get_by_slug(slug)
        requirements = await self._uow.projects.get_requirements(project.id)

        if not requirements:
            return []

        node_ids = list({req.node_id for req in requirements})
        nodes = await self._uow.knowledge_nodes.get_many(node_ids)
        node_map = {n.id: n for n in nodes}

        result = []
        for req in requirements:
            node = node_map.get(req.node_id)
            if node:
                result.append({
                    'node': node,
                    'requirement_type': req.requirement_type,
                    'order_index': req.order_index,
                })
        return result
