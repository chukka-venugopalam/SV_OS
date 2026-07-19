"""Career Capability — compare careers and analyze skill gaps.

Orchestrates: CareerEngine, GraphEngine, StateEngine
No business logic — delegates to engines.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from uuid import UUID


class CareerCapability:
    """Career Capability — public API for career exploration.

    Thin orchestration layer. All business logic lives in engines.
    """

    def __init__(
        self,
        career_engine: Any | None = None,
        graph_engine: Any | None = None,
        state_engine: Any | None = None,
    ) -> None:
        self._career = career_engine
        self._graph = graph_engine
        self._state = state_engine

    async def get_matches(self, _user_id: UUID, _limit: int = 10) -> list[dict]:
        if self._career is None:
            return []
        # Career matches based on skill gap analysis for all careers
        return []

    async def get_skill_gap(self, user_id: UUID, career_id: UUID) -> dict:
        if self._career is None:
            return {'error': 'Career engine not available'}
        return await self._career.get_skill_gap(user_id, career_id)

    async def compare_careers(self, career_ids: list[UUID]) -> list[dict]:
        if self._career is None:
            return []
        return await self._career.compare_careers(career_ids)

    async def get_career(self, career_id: UUID) -> dict | None:
        if self._career is None:
            return None
        return await self._career.get_career(career_id)

    async def search_careers(self, query: str, limit: int = 20) -> list[dict]:
        if self._career is None:
            return []
        return await self._career.search_careers(query, limit=limit)

    async def filter_careers(
        self,
        industry: str | None = None,
        seniority: str | None = None,
        demand: str | None = None,
        limit: int = 20,
    ) -> list[dict]:
        if self._career is None:
            return []
        return await self._career.filter_careers(industry, seniority, demand, limit=limit)

    async def get_career_progression(self, career_id: UUID) -> dict:
        if self._career is None:
            return {'error': 'Career engine not available'}
        return await self._career.get_career_progression(career_id)

    async def get_career_similarity(self, career_id: UUID, limit: int = 5) -> list[dict]:
        if self._career is None:
            return []
        return await self._career.get_career_similarity(career_id, limit=limit)

    async def get_required_knowledge_graph(self, career_id: UUID) -> dict:
        if self._career is None:
            return {'error': 'Career engine not available'}
        return await self._career.get_required_knowledge_graph(career_id)

    async def get_missing_concepts(self, user_id: UUID, career_id: UUID) -> list[dict]:
        if self._career is None:
            return []
        return await self._career.get_missing_concepts(user_id, career_id)

    async def get_missing_projects(self, user_id: UUID, career_id: UUID) -> list[dict]:
        if self._career is None:
            return []
        return await self._career.get_missing_projects(user_id, career_id)

    async def get_missing_assessments(self, user_id: UUID, career_id: UUID) -> list[dict]:
        if self._career is None:
            return []
        return await self._career.get_missing_assessments(user_id, career_id)

    async def get_career_statistics(self) -> dict:
        if self._career is None:
            return {'error': 'Career engine not available'}
        return await self._career.get_career_statistics()
