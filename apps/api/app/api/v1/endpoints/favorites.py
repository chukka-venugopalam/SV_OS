"""Favorites API endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_uow
from app.repositories.errors import DuplicateEntityError, EntityNotFoundError
from app.schemas.response import build_success_response
from app.services.favorite import FavoriteService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def list_favorites(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
) -> dict:
    """List favorites for the authenticated user."""
    service = FavoriteService(uow)
    result = await service.list_favorites(
        user_id=current_user_id,
        page=page,
        per_page=per_page,
    )
    return build_success_response(
        data={
            'items': [_favorite_to_dict(f) for f in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Favorites retrieved',
    )


@router.post('/{node_id}', status_code=status.HTTP_201_CREATED)
async def add_favorite(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Add a favorite for a knowledge node."""
    service = FavoriteService(uow)
    try:
        favorite = await service.add_favorite(
            user_id=current_user_id,
            node_id=node_id,
        )
    except EntityNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Node not found') from e
    except DuplicateEntityError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Already favorited') from e

    return build_success_response(
        data=_favorite_to_dict(favorite),
        message='Favorite added',
    )


@router.delete('/{node_id}')
async def remove_favorite(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Remove a favorite from a knowledge node."""
    service = FavoriteService(uow)
    removed = await service.remove_favorite(
        user_id=current_user_id,
        node_id=node_id,
    )
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Favorite not found')

    return build_success_response(
        data={'removed': True},
        message='Favorite removed',
    )


@router.get('/{node_id}/check')
async def check_favorite(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Check if a node is favorited by the authenticated user."""
    service = FavoriteService(uow)
    favorited = await service.is_favorited(current_user_id, node_id)
    return build_success_response(
        data={'favorited': favorited},
        message='Favorite status retrieved',
    )


def _favorite_to_dict(f) -> dict:
    return {
        'id': str(f.id),
        'user_id': str(f.user_id),
        'node_id': str(f.node_id),
        'created_at': f.created_at.isoformat() if f.created_at else None,
    }
