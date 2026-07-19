"""Learning Path API endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response
from app.services.learning_path import LearningPathService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def list_learning_paths(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
    difficulty: Annotated[str | None, Query(description='Filter by difficulty')] = None,
) -> dict:
    """List published learning paths."""
    service = LearningPathService(uow)
    result = await service.list_paths(
        page=page,
        per_page=per_page,
        _difficulty=difficulty,
    )
    return success_response(
        data={
            'items': [_path_to_dict(p) for p in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Learning paths retrieved',
    )


@router.get('/{path_id}')
async def get_learning_path(
    path_id: UUID,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get a learning path by ID."""
    service = LearningPathService(uow)
    try:
        path = await service.get_by_id(path_id)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Learning path not found') from e
    return success_response(
        data=_path_to_dict(path),
        message='Learning path retrieved',
    )


def _path_to_dict(p) -> dict:
    return {
        'id': str(p.id),
        'title': p.title,
        'description': p.description,
        'difficulty': p.difficulty.value if hasattr(p.difficulty, 'value') else p.difficulty,
        'estimated_hours': p.estimated_hours,
        'icon': p.icon,
        'color': p.color,
        'is_published': p.is_published,
        'node_order': p.node_order,
        'created_at': p.created_at.isoformat() if p.created_at else None,
    }
