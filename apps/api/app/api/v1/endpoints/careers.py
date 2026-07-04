"""Career API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response
from app.services.career import CareerService

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def list_careers(
    page: int = Query(1, ge=1, description='Page number'),
    per_page: int = Query(20, ge=1, le=100, description='Items per page'),
    demand_level: str | None = Query(None, description='Filter by demand level'),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """List published careers with optional demand-level filter."""
    service = CareerService(uow)
    result = await service.list_careers(
        page=page,
        per_page=per_page,
        demand_level=demand_level,
    )
    return success_response(
        data={
            'items': [_career_to_dict(c) for c in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Careers retrieved',
    )


@router.get('/{slug}')
async def get_career(
    slug: str,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get a career by slug."""
    service = CareerService(uow)
    try:
        career = await service.get_by_slug(slug)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Career not found')

    return success_response(
        data=_career_to_dict(career),
        message='Career retrieved',
    )


@router.get('/{slug}/roadmap')
async def get_roadmap(
    slug: str,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get a career's full roadmap with requirements."""
    service = CareerService(uow)
    try:
        roadmap = await service.get_roadmap(slug)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Career not found')

    return success_response(
        data={
            'career': _career_to_dict(roadmap['career']),
            'requirements': roadmap['requirements'],
            'total_requirements': roadmap['total_requirements'],
        },
        message='Roadmap retrieved',
    )


@router.get('/{slug}/nodes')
async def get_career_nodes(
    slug: str,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get all knowledge nodes required for a career."""
    service = CareerService(uow)
    try:
        nodes = await service.get_nodes_for_career(slug)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Career not found')

    return success_response(
        data={
            'items': [
                {
                    'node': _node_to_dict(item['node']),
                    'requirement_type': item['requirement_type'].value if hasattr(item['requirement_type'], 'value') else item['requirement_type'],
                    'order_index': item['order_index'],
                }
                for item in nodes
            ],
        },
        message='Career nodes retrieved',
    )


def _career_to_dict(c) -> dict:
    return {
        'id': str(c.id),
        'slug': c.slug,
        'title': c.title,
        'description': c.description,
        'average_salary': c.average_salary,
        'demand_level': c.demand_level.value if hasattr(c.demand_level, 'value') else c.demand_level,
        'required_experience': c.required_experience,
        'icon': c.icon,
        'color': c.color,
        'is_published': c.is_published,
        'created_at': c.created_at.isoformat() if c.created_at else None,
    }


def _node_to_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value if hasattr(node.difficulty, 'value') else node.difficulty,
    }
