"""Recommendation API — capability-based recommendation endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, Query, Request

from app.api.deps import get_optional_user_id

if TYPE_CHECKING:
    from uuid import UUID

router = APIRouter(prefix='/recommendations', tags=['recommendations-platform'])


def _get_recommendation_engine(request: Request):
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        return container.engine_registry.try_get('recommendation')
    return None


@router.get('/next')
async def recommend_next(
    request: Request,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    limit: Annotated[int, Query(ge=1, le=50)] = 5,
) -> dict:
    engine = _get_recommendation_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    items = await engine.recommend_next(user_id, limit=limit)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.get('/batch')
async def recommend_batch(
    request: Request,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    engine = _get_recommendation_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    items = await engine.recommend_batch(user_id, limit=limit)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.get('/daily')
async def recommend_daily(
    request: Request,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> dict:
    engine = _get_recommendation_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    items = await engine.recommend_daily(user_id, limit=limit)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.get('/weekly')
async def recommend_weekly(
    request: Request,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    engine = _get_recommendation_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    items = await engine.recommend_weekly(user_id, limit=limit)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.get('/by-goal/{goal_node_id}')
async def recommend_by_goal(
    request: Request,
    goal_node_id: UUID,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
) -> dict:
    engine = _get_recommendation_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    items = await engine.recommend_by_goal(user_id, goal_node_id, limit=limit)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}


@router.get('/history')
async def get_recommendation_history(
    request: Request,
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> dict:
    engine = _get_recommendation_engine(request)
    if engine is None or user_id is None:
        return {'success': True, 'data': {'items': [], 'count': 0}, 'errors': None}
    items = await engine.get_history(user_id, limit=limit)
    return {'success': True, 'data': {'items': items, 'count': len(items)}, 'errors': None}
