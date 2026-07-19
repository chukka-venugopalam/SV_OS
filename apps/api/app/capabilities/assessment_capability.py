"""Assessment Capability — submit and evaluate assessments.

Orchestrates: AssessmentEngine, StateEngine, ValidationEngine
No business logic — delegates to engines.
"""

from __future__ import annotations

from uuid import UUID
from typing import Any


class AssessmentCapability:
    """Assessment Capability — public API for assessment workflows.

    Thin orchestration layer. All business logic lives in engines.
    """

    def __init__(
        self,
        assessment_engine: Any | None = None,
        state_engine: Any | None = None,
        graph_engine: Any | None = None,
    ) -> None:
        self._assessment = assessment_engine
        self._state = state_engine
        self._graph = graph_engine

    async def get_assessment(self, assessment_id: UUID) -> dict | None:
        if self._assessment is None:
            return None
        return await self._assessment.get_assessment(assessment_id)

    async def get_assessments_for_node(self, node_id: UUID) -> list[dict]:
        if self._assessment is None:
            return []
        return await self._assessment.get_assessments_for_node(node_id)

    async def submit_assessment(
        self, user_id: UUID, assessment_id: UUID, answers: list[dict]
    ) -> dict:
        if self._assessment is None:
            return {'error': 'Assessment engine not available'}
        return await self._assessment.submit_assessment(user_id, assessment_id, answers)

    async def create_assessment(
        self, node_id: UUID, title: str, description: str = '',
        questions: list[dict] | None = None, passing_score: float = 0.7,
    ) -> dict:
        if self._assessment is None:
            return {'error': 'Assessment engine not available'}
        return await self._assessment.create_assessment(
            node_id, title, description, questions, passing_score,
        )

    async def grade_assessment(self, submission_id: UUID) -> dict:
        if self._assessment is None:
            return {'error': 'Assessment engine not available'}
        return await self._assessment.grade_assessment(submission_id)

    async def get_attempts(self, user_id: UUID, assessment_id: UUID) -> list[dict]:
        if self._assessment is None:
            return []
        return await self._assessment.get_attempts_for_user(user_id, assessment_id)

    async def get_score_history(self, user_id: UUID, node_id: UUID) -> list[dict]:
        if self._assessment is None:
            return []
        return await self._assessment.get_score_history(user_id, node_id)

    async def get_statistics(self, assessment_id: UUID) -> dict:
        if self._assessment is None:
            return {'error': 'Assessment engine not available'}
        return await self._assessment.get_assessment_statistics(assessment_id)

    async def update_knowledge(self, submission_id: UUID) -> dict:
        if self._assessment is None:
            return {'error': 'Assessment engine not available'}
        return await self._assessment.update_knowledge(submission_id)

    async def update_confidence(self, submission_id: UUID) -> dict:
        if self._assessment is None:
            return {'error': 'Assessment engine not available'}
        return await self._assessment.update_confidence(submission_id)
