"""Recommendation Capability — retrieve next-step recommendations.

Orchestrates: RecommendationEngine, DependencyEngine, StateEngine
No business logic — delegates to engines.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID


class RecommendationCapability:
    """Recommendation Capability — public API for learning recommendations.

    Thin orchestration layer. All business logic lives in engines.
    """

    def __init__(
        self,
        recommendation_engine: Any | None = None,
        state_engine: Any | None = None,
        graph_engine: Any | None = None,
    ) -> None:
        self._recommendation = recommendation_engine
        self._state = state_engine
        self._graph = graph_engine

    async def get_next(self, user_id: UUID, limit: int = 5) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_next(user_id, limit=limit)

    async def get_batch(self, user_id: UUID, limit: int = 20) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_batch(user_id, limit=limit)

    async def get_daily(self, user_id: UUID, limit: int = 10) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_daily(user_id, limit=limit)

    async def get_weekly(self, user_id: UUID, limit: int = 20) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_weekly(user_id, limit=limit)

    async def get_by_goal(self, user_id: UUID, goal_node_id: UUID, limit: int = 10) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_by_goal(user_id, goal_node_id, limit=limit)

    async def get_by_career(self, career_node_id: UUID, limit: int = 10) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_by_career(career_node_id, limit=limit)

    async def get_after_assessment(self, user_id: UUID, results: dict) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_after_assessment(user_id, results)

    async def get_recommended_careers(self, _user_id: UUID, limit: int = 5) -> list[dict]:
        """Get career recommendations based on completed nodes."""
        if self._recommendation is None:
            return []
        return await self._recommendation.recommend_by_career(UUID(int=0), limit=limit)

    async def get_history(self, user_id: UUID, limit: int = 50) -> list[dict]:
        if self._recommendation is None:
            return []
        return await self._recommendation.get_history(user_id, limit=limit)
