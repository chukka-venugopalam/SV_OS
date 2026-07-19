"""Bookmark API endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_uow
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response
from app.services.bookmark import BookmarkService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def list_bookmarks(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
) -> dict:
    """List bookmarks for the authenticated user."""
    service = BookmarkService(uow)
    result = await service.list_bookmarks(
        user_id=current_user_id,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data={
            'items': [_bookmark_to_dict(b) for b in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Bookmarks retrieved',
    )


@router.post('/{node_id}')
async def toggle_bookmark(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Toggle a bookmark on a knowledge node."""
    service = BookmarkService(uow)
    try:
        bookmark, created = await service.toggle_bookmark(
            user_id=current_user_id,
            node_id=node_id,
        )
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data={
            'bookmarked': created,
            'bookmark': _bookmark_to_dict(bookmark) if bookmark else None,
        },
        message='Bookmark added' if created else 'Bookmark removed',
    )


@router.get('/{node_id}')
async def is_bookmarked(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Check if a node is bookmarked by the authenticated user."""
    service = BookmarkService(uow)
    bookmarked = await service.is_bookmarked(current_user_id, node_id)
    return success_response(
        data={'bookmarked': bookmarked},
        message='Bookmark status retrieved',
    )


def _bookmark_to_dict(b) -> dict:
    return {
        'id': str(b.id),
        'user_id': str(b.user_id),
        'node_id': str(b.node_id),
        'notes': b.notes,
        'created_at': b.created_at.isoformat() if b.created_at else None,
    }
