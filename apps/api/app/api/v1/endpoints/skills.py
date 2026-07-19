"""Skill API endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response
from app.services.skill import SkillService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def list_skills(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
    category: Annotated[str | None, Query(description='Filter by category')] = None,
    difficulty: Annotated[str | None, Query(description='Filter by difficulty')] = None,
) -> dict:
    """List skills with optional filtering."""
    service = SkillService(uow)
    result = await service.list_skills(
        page=page,
        per_page=per_page,
        category=category,
        difficulty=difficulty,
    )
    return success_response(
        data={
            'items': [_skill_to_dict(s) for s in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Skills retrieved',
    )


@router.get('/categories')
async def get_categories(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get all distinct skill categories with counts."""
    service = SkillService(uow)
    categories = await service.get_categories()
    counts = await service.get_category_counts()
    return success_response(
        data={'categories': categories, 'counts': counts},
        message='Categories retrieved',
    )


@router.get('/{skill_id}')
async def get_skill(
    skill_id: UUID,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get a skill by ID."""
    service = SkillService(uow)
    try:
        skill = await service.get_by_id(skill_id)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Skill not found') from e
    return success_response(
        data=_skill_to_dict(skill),
        message='Skill retrieved',
    )


@router.get('/{skill_id}/relationships')
async def get_skill_relationships(
    skill_id: UUID,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get all relationships for a skill."""
    service = SkillService(uow)
    try:
        # Verify skill exists
        await service.get_by_id(skill_id)
        relationships = await service.get_relationships(skill_id)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Skill not found') from e
    return success_response(
        data=relationships,
        message='Skill relationships retrieved',
    )


def _skill_to_dict(s) -> dict:
    return {
        'id': str(s.id),
        'name': s.name,
        'description': s.description,
        'category': s.category,
        'difficulty': s.difficulty.value if hasattr(s.difficulty, 'value') else s.difficulty,
        'created_at': s.created_at.isoformat() if s.created_at else None,
    }
