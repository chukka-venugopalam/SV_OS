"""Learning Path API — capability-based learning path endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel

from app.api.deps import get_optional_user_id

router = APIRouter(prefix='/learning-paths', tags=['learning-paths-platform'])


class GeneratePathRequest(BaseModel):
    goal_node_id: UUID
    strategy: str = 'dependency_roadmap'
    user_id: UUID | None = None


def _get_engine(request: Request):
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        return container.engine_registry.try_get('learning_path')
    return None


@router.post('/generate')
async def generate_path(
    request: Request,
    body: GeneratePathRequest,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Learning path engine not available'}, 'errors': None}
    result = await engine.generate_path(
        body.goal_node_id,
        user_id or body.user_id,
        strategy=body.strategy,
    )
    return {'success': True, 'data': result, 'errors': None}


@router.get('/{path_id}')
async def get_path(
    path_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Learning path engine not available'}, 'errors': None}
    result = await engine.get_progress(path_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/{path_id}/resume')
async def resume_path(
    path_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Learning path engine not available'}, 'errors': None}
    result = await engine.resume_path(path_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/{path_id}/pause')
async def pause_path(
    path_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Learning path engine not available'}, 'errors': None}
    result = await engine.pause_path(path_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/{path_id}/rebuild')
async def rebuild_path(
    path_id: UUID,
    request: Request,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Learning path engine not available'}, 'errors': None}
    result = await engine.rebuild_path(path_id, user_id)
    return {'success': True, 'data': result, 'errors': None}


@router.get('/{path_id}/validate')
async def validate_path(
    path_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Learning path engine not available'}, 'errors': None}
    result = await engine.validate_path(path_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/{path_id}/export')
async def export_path(
    path_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Learning path engine not available'}, 'errors': None}
    result = await engine.export_path(path_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/roadmap/career')
async def career_roadmap(
    request: Request,
    body: dict,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'career_node_id' not in body:
        return {'success': True, 'data': {'error': 'Engine or career_node_id missing'}, 'errors': None}
    result = await engine.generate_career_roadmap(UUID(body['career_node_id']), user_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/roadmap/daily')
async def daily_roadmap(
    request: Request,
    body: dict,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'goal_node_id' not in body:
        return {'success': True, 'data': {'error': 'Engine or goal_node_id missing'}, 'errors': None}
    result = await engine.generate_daily_roadmap(UUID(body['goal_node_id']), user_id)
    return {'success': True, 'data': result, 'errors': None}


@router.post('/roadmap/weekly')
async def weekly_roadmap(
    request: Request,
    body: dict,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'goal_node_id' not in body:
        return {'success': True, 'data': {'error': 'Engine or goal_node_id missing'}, 'errors': None}
    result = await engine.generate_weekly_roadmap(UUID(body['goal_node_id']), user_id)
    return {'success': True, 'data': result, 'errors': None}
