"""Career Platform API — capability-based career endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import get_optional_user_id

router = APIRouter(prefix='/careers-platform', tags=['careers-platform'])


def _get_engine(request: Request):
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        return container.engine_registry.try_get('career')
    return None


@router.get('/{career_id}')
async def get_career(
    career_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Career engine not available'}, 'errors': None}
    result = await engine.get_career(career_id)
    return {'success': True, 'data': result, 'errors': None}


@router.get('')
async def search_careers(
    request: Request,
    q: Annotated[str | None, Query(description='Search query')] = None,
    industry: Annotated[str | None, Query(description='Industry filter')] = None,
    seniority: Annotated[str | None, Query(description='Seniority filter')] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    if q:
        items = await engine.search_careers(q, limit=limit)
    elif industry or seniority:
        items = await engine.filter_careers(industry=industry, seniority=seniority, limit=limit)
    else:
        items = []
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.post('/compare')
async def compare_careers(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'career_ids' not in body:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    career_ids = [UUID(cid) for cid in body['career_ids']]
    items = await engine.compare_careers(career_ids)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.post('/skill-gap')
async def skill_gap(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'user_id' not in body or 'career_id' not in body:
        return {'success': True, 'data': {'error': 'Missing user_id or career_id'}, 'errors': None}
    result = await engine.get_skill_gap(UUID(body['user_id']), UUID(body['career_id']))
    return {'success': True, 'data': result, 'errors': None}


@router.get('/{career_id}/similarity')
async def career_similarity(
    career_id: UUID,
    request: Request,
    limit: Annotated[int, Query(ge=1, le=20)] = 5,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    items = await engine.get_career_similarity(career_id, limit=limit)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.get('/{career_id}/progression')
async def career_progression(
    career_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Career engine not available'}, 'errors': None}
    result = await engine.get_career_progression(career_id)
    return {'success': True, 'data': result, 'errors': None}


@router.get('/{career_id}/knowledge-graph')
async def career_knowledge_graph(
    career_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Career engine not available'}, 'errors': None}
    result = await engine.get_required_knowledge_graph(career_id)
    return {'success': True, 'data': result, 'errors': None}


@router.get('/statistics')
async def career_statistics(
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return {'success': True, 'data': {'error': 'Career engine not available'}, 'errors': None}
    result = await engine.get_career_statistics()
    return {'success': True, 'data': result, 'errors': None}
