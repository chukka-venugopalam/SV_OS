"""Progress API endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, Query
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_uow
from app.schemas.response import success_response
from app.services.progress import ProgressService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def list_progress(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    status: Annotated[str | None, Query(description='Filter by status')] = None,
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
) -> dict:
    """List progress records for the authenticated user with node details."""
    service = ProgressService(uow)
    result = await service.list_user_progress(
        user_id=current_user_id,
        status=status,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result,
        message='Progress records retrieved',
    )


@router.get('/stats')
async def get_progress_stats(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get aggregated progress statistics for the authenticated user."""
    service = ProgressService(uow)
    stats = await service.get_statistics(current_user_id)
    return success_response(
        data=stats,
        message='Progress statistics retrieved',
    )


@router.put('/{node_id}')
async def update_progress(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    status: Annotated[str | None, Query(description='New progress status')] = None,
    time_spent_minutes: Annotated[
        int | None,
        Query(ge=0, description='Additional time spent'),
    ] = None,
    notes: Annotated[str | None, Query(description='Personal notes')] = None,
) -> dict:
    """Create or update progress for a knowledge node."""
    service = ProgressService(uow)
    result = await service.update_progress(
        user_id=current_user_id,
        node_id=node_id,
        status=status,
        time_spent_minutes=time_spent_minutes,
        notes=notes,
    )
    return success_response(
        data=result,
        message='Progress updated',
    )


@router.post('/{node_id}/start')
async def start_node(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Mark a node as 'learning' for the authenticated user."""
    service = ProgressService(uow)
    result = await service.update_progress(
        user_id=current_user_id,
        node_id=node_id,
        status='learning',
    )
    return success_response(
        data=result,
        message='Node started',
    )


@router.post('/{node_id}/complete')
async def complete_node(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Mark a node as 'completed' for the authenticated user."""
    service = ProgressService(uow)
    result = await service.update_progress(
        user_id=current_user_id,
        node_id=node_id,
        status='completed',
    )
    return success_response(
        data=result,
        message='Node completed',
    )
