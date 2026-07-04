"""Knowledge Node API endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from structlog.stdlib import get_logger

from app.api.deps import get_optional_user_id, get_uow
from app.repositories import UnitOfWork
from app.repositories.errors import DuplicateEntityError, EntityNotFoundError
from app.repositories.query_helpers import SortDirection
from app.schemas.knowledge.node import KnowledgeNodeCreate, KnowledgeNodeUpdate
from app.schemas.response import success_response
from app.services.knowledge_node import KnowledgeNodeService

logger = get_logger(__name__)

router = APIRouter()


@router.get('/search', tags=['knowledge-nodes'])
async def search_nodes(
    q: str = Query('', description='Search query'),
    node_type: str | None = Query(None, description='Filter by node type'),
    difficulty: str | None = Query(None, description='Filter by difficulty'),
    page: int = Query(1, ge=1, description='Page number'),
    per_page: int = Query(20, ge=1, le=100, description='Items per page'),
    current_user_id: UUID | None = Depends(get_optional_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Full-text search across knowledge nodes."""
    from app.services.search import SearchService

    search_service = SearchService(uow)
    result = await search_service.search(
        query=q,
        node_type=node_type,
        difficulty=difficulty,
        page=page,
        per_page=per_page,
        user_id=current_user_id,
    )
    return success_response(
        data={
            'items': [_node_to_dict(n) for n in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Search results',
    )


@router.get('')
async def list_nodes(
    page: int = Query(1, ge=1, description='Page number'),
    per_page: int = Query(20, ge=1, le=100, description='Items per page'),
    node_type: str | None = Query(None, description='Filter by node type'),
    difficulty: str | None = Query(None, description='Filter by difficulty'),
    sort_by: str = Query('title', description='Sort field'),
    sort_dir: str = Query('asc', description='Sort direction (asc/desc)'),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """List published knowledge nodes with optional filtering."""
    service = KnowledgeNodeService(uow)
    result = await service.list_nodes(
        page=page,
        per_page=per_page,
        node_type=node_type,
        difficulty=difficulty,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return success_response(
        data={
            'items': [_node_to_dict(n) for n in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Nodes retrieved',
    )


@router.get('/popular')
async def get_popular(
    limit: int = Query(10, ge=1, le=50, description='Number of results'),
    node_type: str | None = Query(None, description='Filter by node type'),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get the most-viewed knowledge nodes."""
    service = KnowledgeNodeService(uow)
    nodes = await service.get_popular(limit=limit, node_type=node_type)
    return success_response(
        data={'items': [_node_to_dict(n) for n in nodes]},
        message='Popular nodes retrieved',
    )


@router.get('/{slug}')
async def get_node(
    slug: str,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get a knowledge node by slug."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        # Increment view count
        await service.increment_view(slug)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Node not found')

    return success_response(
        data=_node_to_dict(node),
        message='Node retrieved',
    )


@router.get('/{slug}/prerequisites')
async def get_prerequisites(
    slug: str,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get prerequisites for a knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        prereqs = await service.get_prerequisites(node.id)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Node not found')

    return success_response(
        data={'items': [_node_to_dict(n) for n in prereqs]},
        message='Prerequisites retrieved',
    )


@router.get('/{slug}/related')
async def get_related(
    slug: str,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get related nodes (neighbors) for a knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        neighbors = await service.get_neighbors(node.id)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Node not found')

    return success_response(
        data={
            'outgoing': [_node_to_dict(n) for n in neighbors.get('outgoing', [])],
            'incoming': [_node_to_dict(n) for n in neighbors.get('incoming', [])],
        },
        message='Related nodes retrieved',
    )


@router.get('/{slug}/resources')
async def get_node_resources(
    slug: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get learning resources for a knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        result = await service.get_resources(node.id, page=page, per_page=per_page)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Node not found')

    return success_response(
        data={
            'items': [_resource_to_dict(r) for r in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
        },
        message='Resources retrieved',
    )


@router.get('/{slug}/careers')
async def get_node_careers(
    slug: str,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get careers that require this knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        careers = await service.get_related_careers(node.id)
    except EntityNotFoundError:
        raise HTTPException(status_code=404, detail='Node not found')

    return success_response(
        data={'items': [_career_to_dict(c) for c in careers]},
        message='Related careers retrieved',
    )


# ── Helper conversion functions ────────────────────────────────────


def _node_to_dict(node) -> dict:
    """Convert a KnowledgeNode ORM model to a dict for JSON response."""
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value if hasattr(node.difficulty, 'value') else node.difficulty,
        'estimated_minutes': node.estimated_minutes,
        'icon': node.icon,
        'color': node.color,
        'view_count': node.view_count,
        'is_published': node.is_published,
        'created_at': node.created_at.isoformat() if node.created_at else None,
        'updated_at': node.updated_at.isoformat() if node.updated_at else None,
    }


def _resource_to_dict(r) -> dict:
    return {
        'id': str(r.id),
        'title': r.title,
        'url': r.url,
        'resource_type': r.resource_type.value if hasattr(r.resource_type, 'value') else r.resource_type,
        'platform': r.platform,
        'is_free': r.is_free,
    }


def _career_to_dict(c) -> dict:
    return {
        'id': str(c.id),
        'slug': c.slug,
        'title': c.title,
        'description': c.description,
        'demand_level': c.demand_level.value if hasattr(c.demand_level, 'value') else c.demand_level,
    }
