"""Project API endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response
from app.services.project import ProjectService

if TYPE_CHECKING:
    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def list_projects(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
    difficulty: Annotated[str | None, Query(description='Filter by difficulty')] = None,
) -> dict:
    """List published projects with optional difficulty filter."""
    service = ProjectService(uow)
    result = await service.list_projects(
        page=page,
        per_page=per_page,
        difficulty=difficulty,
    )
    return success_response(
        data={
            'items': [_project_to_dict(p) for p in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Projects retrieved',
    )


@router.get('/{slug}')
async def get_project(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get a project by slug."""
    service = ProjectService(uow)
    try:
        project = await service.get_by_slug(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Project not found') from e
    return success_response(
        data=_project_to_dict(project),
        message='Project retrieved',
    )


@router.get('/{slug}/requirements')
async def get_project_requirements(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get knowledge node requirements for a project."""
    service = ProjectService(uow)
    try:
        requirements = await service.get_requirements(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Project not found') from e
    return success_response(
        data={'items': requirements},
        message='Project requirements retrieved',
    )


def _project_to_dict(p) -> dict:
    return {
        'id': str(p.id),
        'slug': p.slug,
        'title': p.title,
        'description': p.description,
        'difficulty': p.difficulty.value if hasattr(p.difficulty, 'value') else p.difficulty,
        'estimated_hours': p.estimated_hours,
        'tech_stack': p.tech_stack,
        'icon': p.icon,
        'color': p.color,
        'is_published': p.is_published,
        'created_at': p.created_at.isoformat() if p.created_at else None,
    }
