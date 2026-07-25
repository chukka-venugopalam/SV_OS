"""Knowledge API endpoints — Stage 5.2 Knowledge Query & Navigation Engine.

Provides the /knowledge/ namespace with endpoints for:
- Node retrieval (by slug, domain, type, difficulty)
- Prerequisites and unlocks (unlocks derived from edges, never stored)
- Shortest/longest path finding
- Graph statistics
- Dependency tree
- Related content (projects, careers, resources)
- Domain listing
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_optional_user_id, get_uow
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('/node/{slug}')
async def get_node(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get a knowledge node by slug with full details."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        node = await service.get_by_slug(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data=_node_to_detail_dict(node),
        message='Node retrieved',
    )


@router.get('/domain/{domain}')
async def get_nodes_by_domain(
    domain: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
) -> dict:
    """Get nodes filtered by domain (from metadata)."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    result = await service.get_nodes_by_domain(
        domain=domain,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result,
        message=f'Nodes in domain "{domain}"',
    )


@router.get('/search')
async def search_knowledge(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    q: Annotated[str, Query(description='Search query')] = '',
    node_type: Annotated[str | None, Query(description='Filter by node type')] = None,
    difficulty: Annotated[str | None, Query(description='Filter by difficulty')] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
    current_user_id: Annotated[UUID | None, Depends(get_optional_user_id)] = None,
) -> dict:
    """Full-text search across knowledge nodes with optional filters."""
    from app.services.search import SearchService

    if not q.strip():
        return success_response(
            data={'items': [], 'total': 0, 'page': page, 'per_page': per_page, 'total_pages': 0},
            message='No query provided',
        )

    service = SearchService(uow)
    result = await service.search(
        query=q.strip(),
        node_type=node_type,
        difficulty=difficulty,
        page=page,
        per_page=per_page,
        user_id=current_user_id,
    )
    return success_response(
        data={
            'items': [_node_card_dict(n) for n in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Search results',
    )


@router.get('/prerequisites/{slug}')
async def get_prerequisites(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get prerequisite nodes for a knowledge node."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        prereqs = await service.get_prerequisites(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data={
            'items': [_node_card_dict(n) for n in prereqs],
            'count': len(prereqs),
        },
        message='Prerequisites retrieved',
    )


@router.get('/unlocks/{slug}')
async def get_unlocks(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get nodes unlocked by this knowledge node.

    **Important**: Unlocks are computed by reversing prerequisite edges
    at query time. They are never stored as a separate column or table.
    """
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        unlocks = await service.get_unlocks(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data={
            'items': [_node_card_dict(n) for n in unlocks],
            'count': len(unlocks),
        },
        message='Unlocks retrieved (computed from prerequisites)',
    )


@router.get('/path')
async def shortest_path(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    from_slug: Annotated[str, Query(description='Starting node slug')] = '',
    to_slug: Annotated[str, Query(description='Target node slug')] = '',
    metric: Annotated[str, Query(description='Path metric: hops or hours')] = 'hops',
    max_depth: Annotated[int, Query(ge=1, le=20, description='Maximum path depth')] = 10,
) -> dict:
    """Find the shortest path between two knowledge nodes.

    - ``hops``: Fewest edges (BFS)
    - ``hours``: Minimum cumulative estimated time (Dijkstra)
    """
    if not from_slug or not to_slug:
        raise HTTPException(status_code=400, detail='from_slug and to_slug are required')

    from app.services.graph_navigation import GraphNavigationService

    service = GraphNavigationService(uow)
    result = await service.shortest_path(
        from_slug=from_slug,
        to_slug=to_slug,
        metric=metric,  # type: ignore[arg-type]
        max_depth=max_depth,
    )
    return success_response(
        data=result,
        message='Shortest path computed',
    )


@router.get('/path/full')
async def full_path(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    from_slug: Annotated[str, Query(description='Starting node slug')] = '',
    to_slug: Annotated[str, Query(description='Target node slug')] = '',
    strategy: Annotated[
        str,
        Query(
            description='Path strategy: fastest, complete, breadth_first, depth_first',
        ),
    ] = 'fastest',
) -> dict:
    """Find a learning path between two nodes using the specified strategy.

    Strategies:
    - ``fastest``: Minimum cumulative estimated hours
    - ``complete``: Full transitive closure in topological order
    - ``breadth_first``: BFS-based exploration, level by level
    - ``depth_first``: Deep dive down the prerequisite chain first
    """
    if not from_slug or not to_slug:
        raise HTTPException(status_code=400, detail='from_slug and to_slug are required')

    from app.services.graph_navigation import GraphNavigationService

    service = GraphNavigationService(uow)
    result = await service.generate_learning_journey(
        from_slug=from_slug,
        to_slug=to_slug,
        strategy=strategy,
    )
    return success_response(
        data=result,
        message=f'Learning path ({strategy}) computed',
    )


@router.get('/recommendations')
async def get_recommendations(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    current_user_id: Annotated[UUID | None, Depends(get_optional_user_id)] = None,
    limit: Annotated[int, Query(ge=1, le=50, description='Number of recommendations')] = 10,
) -> dict:
    """Get knowledge recommendations for the current user or popular nodes."""
    from app.services.recommendation import RecommendationService

    service = RecommendationService(uow)
    if current_user_id:
        result = await service.get_for_user(
            user_id=current_user_id,
            page=1,
            per_page=limit,
        )
        items = [_node_card_dict(n) for n in result.items]
    else:
        nodes = await service.get_popular_nodes(limit=limit)
        items = [_node_card_dict(n) for n in nodes]

    return success_response(
        data={'items': items, 'count': len(items)},
        message='Recommendations retrieved',
    )


@router.get('/projects')
async def get_all_projects(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    """Get all published projects."""
    result = await uow.projects.paginate(
        page=page,
        per_page=per_page,
        filters={'is_published': True},
        sort_field='title',
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


@router.get('/statistics')
async def get_graph_statistics(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get comprehensive graph-wide statistics."""
    from app.services.statistics_service import StatisticsService

    service = StatisticsService(uow)
    stats = await service.get_graph_statistics()
    return success_response(
        data=stats,
        message='Graph statistics retrieved',
    )


@router.get('/domains')
async def list_domains(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get all distinct domains with node counts."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    domains = await service.get_all_domains()
    return success_response(
        data={'items': domains, 'count': len(domains)},
        message='Domains retrieved',
    )


@router.get('/tree/{slug}')
async def get_dependency_tree(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    max_depth: Annotated[int, Query(ge=1, le=10, description='Maximum tree depth')] = 5,
) -> dict:
    """Get a nested dependency/prerequisite tree rooted at a node."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        tree = await service.get_dependency_tree(slug, max_depth=max_depth)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data=tree,
        message='Dependency tree retrieved',
    )


@router.get('/related/{slug}')
async def get_related(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    relationship_type: Annotated[
        str | None,
        Query(
            description='Filter by edge relationship type',
        ),
    ] = None,
) -> dict:
    """Get all nodes related to the given node (neighbors)."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        related = await service.get_related_nodes(
            slug=slug,
            relationship_type=relationship_type,
        )
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data=related,
        message='Related nodes retrieved',
    )


@router.get('/projects/{slug}')
async def get_node_projects(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get projects related to a specific knowledge node."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        projects = await service.get_related_projects(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data={'items': projects, 'count': len(projects)},
        message='Node projects retrieved',
    )


@router.get('/careers/{slug}')
async def get_node_careers(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get careers that require a specific knowledge node."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        careers = await service.get_related_careers(slug)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data={'items': careers, 'count': len(careers)},
        message='Node careers retrieved',
    )


@router.get('/resources/{slug}')
async def get_node_resources(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    """Get learning resources for a specific knowledge node."""
    from app.services.knowledge_query import KnowledgeQueryService

    service = KnowledgeQueryService(uow)
    try:
        result = await service.get_related_resources(slug, page=page, per_page=per_page)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail='Node not found') from e

    return success_response(
        data={
            'items': [_resource_to_dict(r) for r in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Resources retrieved',
    )


# ── Helper Conversion Functions ────────────────────────────────────


def _node_card_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
        'estimated_minutes': node.estimated_minutes,
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
        'view_count': getattr(node, 'view_count', 0),
        'is_published': getattr(node, 'is_published', True),
    }


def _node_to_detail_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'content': getattr(node, 'content', None),
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
        'estimated_minutes': node.estimated_minutes,
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
        'metadata': getattr(node, 'extra_metadata', {}),
        'view_count': node.view_count,
        'is_published': node.is_published,
        'created_at': node.created_at.isoformat() if node.created_at else None,
        'updated_at': node.updated_at.isoformat() if node.updated_at else None,
    }


def _project_to_dict(p) -> dict:
    return {
        'id': str(p.id),
        'slug': p.slug,
        'title': p.title,
        'description': p.description,
        'difficulty': p.difficulty.value if hasattr(p.difficulty, 'value') else p.difficulty,
        'estimated_hours': p.estimated_hours,
        'tech_stack': getattr(p, 'tech_stack', []),
        'icon': getattr(p, 'icon', None),
        'color': getattr(p, 'color', None),
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
        'difficulty': r.difficulty.value if hasattr(r.difficulty, 'value') else r.difficulty,
    }
