"""Project API endpoints."""

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
    items = []
    for p in result.items:
        p_dict = _project_to_dict(p)
        reqs = await service.get_requirements(p.slug)
        domains = []
        for r in reqs:
            node = r.get('node')
            if node and hasattr(node, 'extra_metadata') and node.extra_metadata:
                d = node.extra_metadata.get('domain')
                if d and d not in domains:
                    domains.append(d)
        p_dict['domains_crossed'] = domains
        items.append(p_dict)

    return success_response(
        data={
            'items': items,
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
        reqs = await service.get_requirements(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Project not found') from e

    p_dict = _project_to_dict(project)
    domains = []
    for r in reqs:
        node = r.get('node')
        if node and hasattr(node, 'extra_metadata') and node.extra_metadata:
            d = node.extra_metadata.get('domain')
            if d and d not in domains:
                domains.append(d)
    p_dict['domains_crossed'] = domains

    return success_response(
        data=p_dict,
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

    required_nodes = []
    recommended_nodes = []
    items = []

    for item in requirements:
        node = item.get('node')
        req_type = item.get('requirement_type')
        req_type_str = req_type.value if hasattr(req_type, 'value') else str(req_type)
        if node:
            node_dict = _node_to_dict(node)
            items.append({**node_dict, 'requirement_type': req_type_str})
            if req_type_str == 'required':
                required_nodes.append(node_dict)
            else:
                recommended_nodes.append(node_dict)

    return success_response(
        data={
            'required': required_nodes,
            'recommended': recommended_nodes,
            'items': items,
        },
        message='Project requirements retrieved',
    )


def _project_to_dict(p) -> dict:
    meta = p.extra_metadata or {}
    return {
        'id': str(p.id),
        'slug': p.slug,
        'title': p.title,
        'description': p.description,
        'difficulty': p.difficulty.value if hasattr(p.difficulty, 'value') else p.difficulty,
        'estimated_hours': p.estimated_hours,
        'tech_stack': p.tech_stack or meta.get('tech_stack', []),
        'milestones': meta.get('milestones', []),
        'architecture_overview': meta.get('architecture_overview'),
        'linked_node_explanations': meta.get('linked_node_explanations', {}),
        'demo_url': meta.get('demo_url'),
        'reference_repos': meta.get('reference_repos', []),
        'github_url': (
            meta.get('reference_repos', [{}])[0].get('url')
            if meta.get('reference_repos')
            else None
        ),
        'extra_metadata': meta,
        'icon': p.icon,
        'color': p.color,
        'is_published': p.is_published,
        'created_at': p.created_at.isoformat() if p.created_at else None,
    }


def _node_to_dict(node) -> dict:
    meta = getattr(node, 'extra_metadata', {}) or {}
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
        'estimated_minutes': getattr(node, 'estimated_minutes', None),
        'icon': node.icon,
        'color': node.color,
        'domain': meta.get('domain', 'General CS'),
        'cross_domain_connections': meta.get('cross_domain_connections', []),
    }
