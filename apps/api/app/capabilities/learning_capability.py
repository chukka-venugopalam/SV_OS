"""Learning Path Capability — generate learning roadmaps.

Orchestrates: LearningPathEngine, RecommendationEngine, DependencyEngine
No business logic — delegates to engines.
"""

from __future__ import annotations

from uuid import UUID
from typing import Any


class LearningPathCapability:
    """Learning Path Capability — public API for roadmap generation.

    Thin orchestration layer. All business logic lives in engines.
    """

    def __init__(
        self,
        learning_path_engine: Any | None = None,
        graph_engine: Any | None = None,
        state_engine: Any | None = None,
    ) -> None:
        self._learning_path = learning_path_engine
        self._graph = graph_engine
        self._state = state_engine

    async def generate_roadmap(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        strategy: str = 'dependency_roadmap',
    ) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.generate_path(goal_node_id, user_id, strategy=strategy)

    async def get_progress(self, user_id: UUID, path_id: UUID) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.get_progress(path_id, user_id)

    async def resume_path(self, path_id: UUID) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.resume_path(path_id)

    async def pause_path(self, path_id: UUID) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.pause_path(path_id)

    async def rebuild_path(self, path_id: UUID, user_id: UUID | None = None) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.rebuild_path(path_id, user_id)

    async def validate_path(self, path_id: UUID) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.validate_path(path_id)

    async def export_path(self, path_id: UUID, format: str = 'json') -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.export_path(path_id, format=format)

    async def generate_career_roadmap(self, career_node_id: UUID, user_id: UUID | None = None) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.generate_career_roadmap(career_node_id, user_id)

    async def generate_skill_roadmap(self, skill_name: str, user_id: UUID | None = None) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.generate_skill_roadmap(skill_name, user_id)

    async def generate_daily_roadmap(self, goal_node_id: UUID, user_id: UUID | None = None) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.generate_daily_roadmap(goal_node_id, user_id)

    async def generate_weekly_roadmap(self, goal_node_id: UUID, user_id: UUID | None = None) -> dict:
        if self._learning_path is None:
            return {'error': 'Learning path engine not available'}
        return await self._learning_path.generate_weekly_roadmap(goal_node_id, user_id)
