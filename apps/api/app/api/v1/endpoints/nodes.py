"""Knowledge Node API endpoints."""

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_optional_user_id, get_uow
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response
from app.services.knowledge_node import KnowledgeNodeService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('/search', tags=['knowledge-nodes'])
async def search_nodes(
    current_user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    q: Annotated[str, Query(description='Search query')] = '',
    node_type: Annotated[str | None, Query(description='Filter by node type')] = None,
    difficulty: Annotated[str | None, Query(description='Filter by difficulty')] = None,
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
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
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
    node_type: Annotated[str | None, Query(description='Filter by node type')] = None,
    difficulty: Annotated[str | None, Query(description='Filter by difficulty')] = None,
    act: Annotated[int | None, Query(description='Filter by act number (1-8)')] = None,
    district: Annotated[str | None, Query(description='Filter by district')] = None,
    tier: Annotated[
        str | None, Query(description='Filter by tier: gate_core or career_track')
    ] = None,
    sort_by: Annotated[str, Query(description='Sort field')] = 'title',
    sort_dir: Annotated[str, Query(description='Sort direction (asc/desc)')] = 'asc',
) -> dict:
    """List published knowledge nodes with optional filtering."""
    service = KnowledgeNodeService(uow)
    result = await service.list_nodes(
        page=page,
        per_page=per_page,
        node_type=node_type,
        difficulty=difficulty,
        act=act,
        district=district,
        tier=tier,
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


@router.get('/curriculum-path')
async def get_curriculum_path(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    tier: Annotated[
        str, Query(description='Curriculum tier: gate_core or career_track')
    ] = 'gate_core',
) -> dict:
    """Get the full ordered curriculum sequence for a tier.

    Replaces the old frontend static 72-node array. Ordered by
    (act, district, chapter_number). Not paginated — a guided path is
    one complete sequence, not a browsable list.
    """
    service = KnowledgeNodeService(uow)
    nodes = await service.get_curriculum_path(tier=tier)
    return success_response(
        data={'items': [_node_to_dict(n) for n in nodes], 'total': len(nodes)},
        message='Curriculum path retrieved',
    )


@router.get('/districts')
async def get_districts(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    act: Annotated[int | None, Query(description='Filter districts by act (1-8)')] = None,
) -> dict:
    """List distinct published districts, optionally scoped to an act.

    Powers the Explorer's District filter. Verified against live DB: 52
    distinct districts across acts 1-8.
    """
    service = KnowledgeNodeService(uow)
    districts = await service.list_districts(act=act)
    return success_response(data={'items': districts}, message='Districts retrieved')


@router.get('/popular')
async def get_popular(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    limit: Annotated[int, Query(ge=1, le=50, description='Number of results')] = 10,
    node_type: Annotated[str | None, Query(description='Filter by node type')] = None,
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
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get a knowledge node by slug."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        # Increment view count
        await service.increment_view(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e
    return success_response(
        data=_node_to_dict(node),
        message='Node retrieved',
    )


@router.get('/{slug}/prerequisites')
async def get_prerequisites(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get prerequisites for a knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        prereqs = await service.get_prerequisites(node.id)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e
    return success_response(
        data={'items': [_node_to_dict(n) for n in prereqs]},
        message='Prerequisites retrieved',
    )


@router.get('/{slug}/related')
async def get_related(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get related nodes (neighbors) for a knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        neighbors = await service.get_neighbors(node.id)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e
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
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    """Get learning resources for a knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        result = await service.get_resources(node.id, page=page, per_page=per_page)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e
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
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get careers that require this knowledge node."""
    service = KnowledgeNodeService(uow)
    try:
        node = await service.get_by_slug(slug)
        careers = await service.get_related_careers(node.id)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e
    return success_response(
        data={'items': [_career_to_dict(c) for c in careers]},
        message='Related careers retrieved',
    )


# ── Helper conversion functions ────────────────────────────────────


def _node_to_dict(node) -> dict:
    """Convert a KnowledgeNode ORM model to a dict for JSON response."""
    meta = node.extra_metadata or {}
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'summary': node.description,
        'description': node.description,
        'domain': meta.get('domain', 'Computer Science'),
        # Real column (fixes DRIFT: previously faked from metadata with a
        # bogus 'published' default that had nothing to do with the actual
        # content_status enum column on the row).
        'content_status': node.content_status,
        # Curriculum placement — previously never serialized despite the
        # columns existing on the ORM model since before this fix.
        'act': node.act,
        'district': node.district,
        'chapter_number': node.chapter_number,
        'tier': node.tier,
        # Previously buried in extra_metadata only; lifted out so the
        # frontend doesn't have to know metadata's internal shape.
        'worked_example': meta.get('worked_example'),
        'sources': meta.get('sources', []),
        'simulators': meta.get('simulators', []),
        'common_mistakes': meta.get('common_mistakes'),
        'exam_traps': meta.get('exam_traps'),
        'quick_techniques': meta.get('quick_techniques'),
        'previous_year_questions': meta.get('previous_year_questions'),
        'cross_domain_connections': meta.get('cross_domain_connections', []),
        'learning_outcomes': meta.get('learning_outcomes', []),
        'extra_metadata': meta,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
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
        'resource_type': r.resource_type.value
        if hasattr(r.resource_type, 'value')
        else r.resource_type,
        'platform': r.platform,
        'is_free': r.is_free,
    }


def _career_to_dict(c) -> dict:
    return {
        'id': str(c.id),
        'slug': c.slug,
        'title': c.title,
        'description': c.description,
        'demand_level': c.demand_level.value
        if hasattr(c.demand_level, 'value')
        else c.demand_level,
    }
