"""Learning Path service — business logic for learning paths."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.learning_path import LearningPath
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class LearningPathService:
    """Business logic for learning path operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_by_id(self, path_id: UUID) -> LearningPath:
        """Get a learning path by ID."""
        path = await self._uow.learning_paths.get_by_id(path_id)
        if not path:
            raise EntityNotFoundError('LearningPath', path_id)
        return path

    async def list_paths(
        self,
        page: int = 1,
        per_page: int = 20,
        difficulty: str | None = None,
    ) -> PageResult[LearningPath]:
        """List published learning paths with optional difficulty filter."""
        return await self._uow.learning_paths.find_published(
            page=page,
            per_page=per_page,
        )
