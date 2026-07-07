"""Search service — business logic for search operations."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class SearchService:
    """Business logic for search operations.

    Coordinates full-text search across knowledge nodes with filtering,
    autocomplete suggestions, and search history tracking.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def search(
        self,
        query: str,
        node_type: str | None = None,
        difficulty: str | None = None,
        page: int = 1,
        per_page: int = 20,
        user_id: UUID | None = None,
    ) -> PageResult:
        """Full-text search across knowledge nodes with optional filters.

        If ``user_id`` is provided, records the search in the user's
        search history.
        """
        result = await self._uow.knowledge_nodes.search_nodes(
            query=query,
            node_type=node_type,
            difficulty=difficulty,
            page=page,
            per_page=per_page,
        )

        # Record search history if user is authenticated
        if user_id and query.strip():
            await self._uow.search_history.create(
                user_id=user_id,
                query=query.strip(),
                filters={'node_type': node_type, 'difficulty': difficulty},
                results_count=result.total,
            )

        return result

    async def get_suggestions(
        self,
        query: str,
        limit: int = 10,
    ) -> list[str]:
        """Get autocomplete suggestions based on partial query."""
        # Search for matching node titles
        result = await self._uow.knowledge_nodes.search(
            query=query,
            fields=['title', 'slug'],
            page=1,
            per_page=limit,
        )
        return [item.title for item in result.items]

    async def get_search_history(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult:
        """Get search history for a user."""
        return await self._uow.search_history.find_by_user(
            user_id=user_id,
            page=page,
            per_page=per_page,
        )

    async def clear_search_history(self, user_id: UUID) -> int:
        """Clear all search history for a user.

        Returns the number of records cleared.
        """
        return await self._uow.search_history.clear_for_user(user_id)

    async def get_trending(self, limit: int = 10) -> list[dict]:
        """Get trending search queries across all users."""
        return await self._uow.search_history.find_trending(limit=limit)
