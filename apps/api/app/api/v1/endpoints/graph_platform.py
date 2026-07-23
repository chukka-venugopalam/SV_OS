"""Graph Platform API — capability-based graph query endpoints.

All endpoints delegate to engines through thin dependency injection.
No CRUD endpoints — capability-based queries only.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Request
from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from app.engines.graph_engine import GraphEngine
    from app.engines.query_engine import QueryEngine
    from app.engines.traversal_engine import TraversalEngine
    from app.engines.validation_engine import ValidationEngine
    from app.infrastructure.cache.graph_cache import GraphCache

logger = get_logger(__name__)

router = APIRouter(prefix='/api/v1/graph-platform', tags=['graph-platform'])


# ── Dependency Helpers ─────────────────────────────────────────────


def _get_graph_engine(request: Request) -> GraphEngine | None:
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        engine = container.engine_registry.try_get('graph')
        if engine:
            return engine
    return None


def _get_traversal_engine(request: Request) -> TraversalEngine | None:
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        engine = container.engine_registry.try_get('traversal')
        if engine:
            return engine
    return None


def _get_query_engine(request: Request) -> QueryEngine | None:
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        engine = container.engine_registry.try_get('query')
        if engine:
            return engine
    return None


def _get_validation_engine(request: Request) -> ValidationEngine | None:
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        engine = container.engine_registry.try_get('validation')
        if engine:
            return engine
    return None


def _get_cache(request: Request) -> GraphCache | None:
    container = getattr(request.app.state, 'platform_container', None)
    if container:
        return getattr(container, 'graph_cache', None)
    return None


def _safe_result(data: dict, message: str = 'Success') -> dict:
    return {
        'success': True,
        'message': message,
        'data': data,
        'errors': None,
    }


# ── Graph Statistics ──────────────────────────────────────────────


@router.get('/statistics')
async def graph_statistics(request: Request) -> dict:
    """Get comprehensive graph statistics including counts and density."""
    engine = _get_graph_engine(request)
    if engine is None:
        return _safe_result({'error': 'Graph engine not available'}, 'Graph engine not available')

    stats = await engine.graph_statistics()
    return _safe_result(stats, 'Graph statistics retrieved')


# ── Node Queries ─────────────────────────────────────────────────-


@router.get('/node/{node_id}')
async def get_node(
    node_id: UUID,
    request: Request,
) -> dict:
    """Get a single node by ID with full details."""
    engine = _get_graph_engine(request)
    if engine is None:
        return _safe_result({'error': 'Graph engine not available'}, 'Graph engine not available')

    node = await engine.get_node(node_id)
    if node is None:
        return _safe_result({'error': 'Node not found'}, 'Node not found')
    return _safe_result(node, 'Node retrieved')


# ── Edge Queries ─────────────────────────────────────────────────-


@router.get('/edge/{edge_id}')
async def get_edge(
    edge_id: UUID,
    request: Request,
) -> dict:
    """Get a single edge by ID."""
    engine = _get_graph_engine(request)
    if engine is None:
        return _safe_result({'error': 'Graph engine not available'}, 'Graph engine not available')

    edge = await engine.get_edge(edge_id)
    if edge is None:
        return _safe_result({'error': 'Edge not found'}, 'Edge not found')
    return _safe_result(edge, 'Edge retrieved')


# ── Shortest Path ────────────────────────────────────────────────


@router.post('/query/shortest-path')
async def query_shortest_path(
    request: Request,
    body: dict,
) -> dict:
    """Find the shortest path between two nodes."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    source_id = UUID(body['source_id'])
    target_id = UUID(body['target_id'])
    max_depth = body.get('max_depth', 10)

    result = await query_engine.find_shortest_path(source_id, target_id, max_depth)
    return _safe_result(result, 'Shortest path computed')


# ── Dependency Chain ─────────────────────────────────────────────


@router.post('/query/dependency-chain')
async def query_dependency_chain(
    request: Request,
    body: dict,
) -> dict:
    """Get the prerequisite chain for a node."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    node_id = UUID(body['node_id'])
    max_depth = body.get('max_depth', 5)

    result = await query_engine.find_dependency_chain(node_id, max_depth)
    return _safe_result(result, 'Dependency chain computed')


# ── Reverse Chain ────────────────────────────────────────────────


@router.post('/query/reverse-chain')
async def query_reverse_chain(
    request: Request,
    body: dict,
) -> dict:
    """Get the chain of nodes depending on a node."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    node_id = UUID(body['node_id'])
    max_depth = body.get('max_depth', 5)

    result = await query_engine.find_reverse_dependency_chain(node_id, max_depth)
    return _safe_result(result, 'Reverse dependency chain computed')


# ── Related Nodes ────────────────────────────────────────────────


@router.post('/query/related')
async def query_related_nodes(
    request: Request,
    body: dict,
) -> dict:
    """Find nodes related to a given node."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    node_id = UUID(body['node_id'])
    relationship_type = body.get('relationship_type')
    max_depth = body.get('max_depth', 2)

    result = await query_engine.find_related_nodes(node_id, relationship_type, max_depth)
    return _safe_result(result, 'Related nodes found')


# ── Common Nodes ─────────────────────────────────────────────────


@router.post('/query/common')
async def query_common_nodes(
    request: Request,
    body: dict,
) -> dict:
    """Find common neighbor nodes of two nodes."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    node_id_a = UUID(body['node_id_a'])
    node_id_b = UUID(body['node_id_b'])
    max_depth = body.get('max_depth', 3)

    result = await query_engine.find_common_nodes(node_id_a, node_id_b, max_depth)
    return _safe_result(result, 'Common nodes found')


# ── Subgraph ─────────────────────────────────────────────────────


@router.post('/query/subgraph')
async def query_subgraph(
    request: Request,
    body: dict,
) -> dict:
    """Extract a subgraph around a center node."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    center_node_id = UUID(body['center_node_id'])
    depth = body.get('depth', 2)
    relationship_type = body.get('relationship_type')

    result = await query_engine.find_subgraph(center_node_id, depth, relationship_type)
    return _safe_result(result, 'Subgraph extracted')


# ── Validate Graph ───────────────────────────────────────────────


@router.post('/query/validate')
async def query_validate_graph(
    request: Request,
    body: dict,
) -> dict:
    """Validate graph structure and return health score."""
    validation = _get_validation_engine(request)
    if validation is None:
        return _safe_result(
            {'error': 'Validation engine not available'},
            'Validation engine not available',
        )

    result = await validation.validate_import(body)
    return _safe_result(result, 'Graph validation completed')


# ── Search ───────────────────────────────────────────────────────


@router.post('/query/search')
async def query_search(
    request: Request,
    body: dict,
) -> dict:
    """Search nodes by query string."""
    engine = _get_graph_engine(request)
    if engine is None:
        return _safe_result({'error': 'Graph engine not available'}, 'Graph engine not available')

    query = body.get('query', '')
    page = body.get('page', 1)
    per_page = body.get('per_page', 20)

    from app.services.graph_query_service import GraphQueryService

    service = GraphQueryService(graph_engine=engine)
    result = await service.search_nodes(query, page, per_page)
    return _safe_result(result, 'Search completed')


# ── Cache Stats ──────────────────────────────────────────────────


@router.get('/cache/stats')
async def cache_statistics(request: Request) -> dict:
    """Get graph cache performance statistics."""
    cache = _get_cache(request)
    if cache is None:
        return _safe_result({}, 'Graph cache not available')

    stats = cache.get_stats()
    return _safe_result(
        {
            'stats': stats,
            'total_size': cache.total_size(),
            'graph_version': cache.graph_version,
        },
        'Cache statistics retrieved',
    )


# ── Bottlenecks ─────────────────────────────────────────────────-


@router.get('/analytics/bottlenecks')
async def get_bottlenecks(
    request: Request,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> dict:
    """Find learning bottlenecks — nodes with the most dependents."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    result = await query_engine.find_learning_bottlenecks(limit)
    return _safe_result(result, 'Bottlenecks computed')


# ── Orphans ──────────────────────────────────────────────────────


@router.get('/analytics/orphans')
async def get_orphan_nodes(
    request: Request,
) -> dict:
    """Find orphan nodes with no edges."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    result = await query_engine.find_orphan_nodes()
    return _safe_result(result, 'Orphan nodes found')


# ── Cycles ───────────────────────────────────────────────────────


@router.get('/analytics/cycles')
async def get_cycles(
    request: Request,
) -> dict:
    """Detect cycles in the graph."""
    query_engine = _get_query_engine(request)
    if query_engine is None:
        return _safe_result({'error': 'Query engine not available'}, 'Query engine not available')

    result = await query_engine.find_cycles()
    return _safe_result(result, 'Cycle detection completed')
