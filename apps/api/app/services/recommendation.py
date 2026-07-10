"""Recommendation service — stub implementation.

Full recommendation engine will be implemented in a future phase.
This stub provides minimal endpoints so the API contract is stable
and frontend development can proceed.

Stub methods return empty results or simple paginated responses
that demonstrate the expected response shape.
"""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class RecommendationService:
    """Stub recommendation service.

    Returns empty/default recommendations.  The full recommendation
    engine (collaborative filtering, content-based, graph-based) will
    be implemented in Phase 6+.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_for_user(
        self,
        user_id: UUID,
        _recommendation_type: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult:
        """Get recommendations for a user (stub — returns empty results)."""
        return await self._uow.recommendations.find_active_by_user(
            user_id=user_id,
            page=page,
            per_page=per_page,
        )

    async def get_popular_nodes(self, limit: int = 10) -> list:
        """Get popular knowledge nodes as simple recommendations."""
        return await self._uow.knowledge_nodes.find_popular(limit=limit)

    async def dismiss(self, recommendation_id: UUID) -> None:
        """Dismiss a recommendation (stub — wraps repository)."""
        await self._uow.recommendations.dismiss(recommendation_id)

    async def get_type_counts(self, user_id: UUID) -> list[dict]:
        """Get recommendation counts grouped by type (stub)."""
        return await self._uow.recommendations.count_by_type(user_id)
