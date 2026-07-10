"""Activity Feed API endpoint — chronological user activity."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_uow
from app.repositories import UnitOfWork
from app.schemas.response import build_success_response
from app.services.activity_feed import ActivityFeedService

logger = get_logger(__name__)

router = APIRouter()


@router.get('/feed')
async def get_activity_feed(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
) -> dict:
    """Get chronological activity feed for the authenticated user.

    Returns activities including progress updates, bookmarks, and
    favorites, enriched with node titles and slugs.
    """
    service = ActivityFeedService(uow)
    feed = await service.get_feed(
        user_id=current_user_id,
        page=page,
        per_page=per_page,
    )
    return build_success_response(
        data=feed,
        message='Activity feed retrieved',
    )
