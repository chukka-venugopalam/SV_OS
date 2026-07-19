"""Assessment Platform API — capability-based assessment endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.api.deps import get_optional_user_id

if TYPE_CHECKING:
    from uuid import UUID

router = APIRouter(prefix='/assessments-platform', tags=['assessments-platform'])


class CreateAssessmentRequest(BaseModel):
    node_id: UUID
    title: str
    description: str = ''
    questions: list[dict] = []
    passing_score: float = 0.7


class SubmitAssessmentRequest(BaseModel):
    assessment_id: UUID
    answers: list[dict]


def _get_engine(request: Request):
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        return container.engine_registry.try_get('assessment')
    return None


@router.post('/create')
async def create_assessment(
    request: Request,
    body: CreateAssessmentRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {
            'success': True,
            'data': {'error': 'Assessment engine not available'},
            'errors': None,
        }
    result = await engine.create_assessment(
        body.node_id,
        body.title,
        body.description,
        body.questions,
        body.passing_score,
    )
    return {'success': True, 'data': result, 'errors': None}


@router.get('/{assessment_id}')
async def get_assessment(
    assessment_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {
            'success': True,
            'data': {'error': 'Assessment engine not available'},
            'errors': None,
        }
    result = await engine.get_assessment(assessment_id)
    return {'success': True, 'data': result, 'errors': None}


@router.get('/node/{node_id}')
async def get_assessments_for_node(
    node_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'items': []}, 'errors': None}
    items = await engine.get_assessments_for_node(node_id)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.post('/submit')
async def submit_assessment(
    request: Request,
    body: SubmitAssessmentRequest,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> dict:
    engine = _get_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'error': 'Engine or user not available'}, 'errors': None}
    result = await engine.submit_assessment(user_id, body.assessment_id, body.answers)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/grade/{submission_id}')
async def grade_assessment(
    submission_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {
            'success': True,
            'data': {'error': 'Assessment engine not available'},
            'errors': None,
        }
    result = await engine.grade_assessment(submission_id)
    return {'success': True, 'data': result, 'errors': None}


@router.get('/attempts/{assessment_id}')
async def get_attempts(
    assessment_id: UUID,
    request: Request,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> dict:
    engine = _get_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'items': []}, 'errors': None}
    items = await engine.get_attempts_for_user(user_id, assessment_id)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.get('/statistics/{assessment_id}')
async def assessment_statistics(
    assessment_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {
            'success': True,
            'data': {'error': 'Assessment engine not available'},
            'errors': None,
        }
    result = await engine.get_assessment_statistics(assessment_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/update-knowledge/{submission_id}')
async def update_knowledge(
    submission_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {
            'success': True,
            'data': {'error': 'Assessment engine not available'},
            'errors': None,
        }
    result = await engine.update_knowledge(submission_id)
    return {'success': True, 'data': result, 'errors': None}
