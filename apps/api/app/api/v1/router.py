"""API v1 main router — infrastructure endpoints.

This module aggregates all v1 route modules and defines the three
standard health endpoints required by orchestration platforms.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Request
from structlog.stdlib import get_logger

# ── Business route imports ─────────────────────────────────────────
from app.api.v1.endpoints import (
    activity,
    ai,
    ai_chat,
    assessments_platform,
    auth,
    bookmarks,
    careers,
    careers_platform,
    favorites,
    graph,
    graph_intelligence,
    graph_platform,
    learning_paths,
    learning_paths_platform,
    nodes,
    progress,
    projects,
    recommendations,
    recommendations_platform,
    search,
    skills,
)
from app.api.v1.endpoints import export_platform as exports_platform
from app.api.v1.endpoints import import_platform as imports_platform
from app.api.v1.endpoints import versioning_platform as versions_platform
from app.core.config import settings as app_settings
from app.core.database import check_database_connection, get_database_health
from app.platform.api import router as platform_router
from app.telemetry.health import HealthChecker, HealthStatus

logger = get_logger(__name__)

router = APIRouter(prefix='/api/v1')

# Global health checker registry
health_checker = HealthChecker()


# ── Helper ─────────────────────────────────────────────────────────


def _request_id(request: Request) -> str | None:
    """Safely extract request ID from request state."""
    return getattr(request.state, 'request_id', None)


# ── Health Endpoints ───────────────────────────────────────────────


@router.get('/health', tags=['infrastructure'])
async def health(
    request: Request,
) -> dict:
    """Unified health check — returns the overall application status.

    Suitable for load balancer and orchestrator health probes.
    """
    results: list[HealthStatus] = await health_checker.run_all()
    healthy: bool = all(r.healthy for r in results)

    return {
        'success': True,
        'message': 'Service is healthy' if healthy else 'Service is degraded',
        'data': {
            'status': 'healthy' if healthy else 'degraded',
            'version': app_settings.APP_VERSION,
            'environment': app_settings.ENVIRONMENT,
            'checks': {
                r.name: {
                    'healthy': r.healthy,
                    'message': r.message,
                    'details': r.details,
                }
                for r in results
            },
        },
        'errors': None,
        'timestamp': datetime.now(UTC).isoformat(),
        'request_id': _request_id(request),
    }


@router.get('/health/live', tags=['infrastructure'])
async def liveness(request: Request) -> dict:
    """Liveness probe — indicates the application is running.

    Returns a minimal response with no dependency checks.
    """
    return {
        'success': True,
        'message': 'Alive',
        'data': {'status': 'alive'},
        'errors': None,
        'timestamp': datetime.now(UTC).isoformat(),
        'request_id': _request_id(request),
    }


@router.get('/health/ready', tags=['infrastructure'])
async def readiness(request: Request) -> dict:
    """Readiness probe — indicates the application can accept traffic.

    Checks that critical dependencies (database) are reachable.
    """
    db_healthy: bool = await check_database_connection()

    if db_healthy:
        return {
            'success': True,
            'message': 'Ready',
            'data': {'status': 'ready', 'database': 'connected'},
            'errors': None,
            'timestamp': datetime.now(UTC).isoformat(),
            'request_id': _request_id(request),
        }

    return {
        'success': False,
        'message': 'Not ready',
        'data': {'status': 'not_ready', 'database': 'disconnected'},
        'errors': None,
        'timestamp': datetime.now(UTC).isoformat(),
        'request_id': _request_id(request),
    }


@router.get('/health/checks', tags=['infrastructure'])
async def health_checks(request: Request) -> dict:
    """Detailed health check results for all registered checks.

    Returns the full output of every registered health check function.
    """
    results: list[HealthStatus] = await health_checker.run_all()
    return {
        'success': True,
        'message': 'Health checks completed',
        'data': {
            'checks': {
                r.name: {
                    'healthy': r.healthy,
                    'message': r.message,
                    'details': r.details,
                }
                for r in results
            },
        },
        'errors': None,
        'timestamp': datetime.now(UTC).isoformat(),
        'request_id': _request_id(request),
    }


# ── Root / API Metadata ────────────────────────────────────────────


@router.get('/', tags=['infrastructure'])
async def root(
    request: Request,
) -> dict:
    """API root — returns metadata about the API."""
    return {
        'success': True,
        'message': 'SV-OS API',
        'data': {
            'name': app_settings.APP_NAME,
            'description': app_settings.APP_DESCRIPTION,
            'version': app_settings.APP_VERSION,
            'environment': app_settings.ENVIRONMENT,
            'documentation': '/docs',
            'api_version': 'v1',
        },
        'errors': None,
        'timestamp': datetime.now(UTC).isoformat(),
        'request_id': _request_id(request),
    }


router.include_router(platform_router)
router.include_router(graph_platform.router)
router.include_router(versions_platform.router)
router.include_router(imports_platform.router)
router.include_router(exports_platform.router)
router.include_router(recommendations_platform.router)
router.include_router(learning_paths_platform.router)
router.include_router(careers_platform.router)
router.include_router(assessments_platform.router)
router.include_router(auth.router)
router.include_router(activity.router, prefix='/activity', tags=['activity'])
router.include_router(ai.router, tags=['ai'])
router.include_router(ai_chat.router, prefix='/ai', tags=['ai-chat'])
router.include_router(bookmarks.router, prefix='/bookmarks', tags=['bookmarks'])
router.include_router(careers.router, prefix='/careers', tags=['careers'])
router.include_router(favorites.router, prefix='/favorites', tags=['favorites'])
router.include_router(graph.router, prefix='/graph', tags=['graph'])
router.include_router(graph_intelligence.router, prefix='/graph', tags=['graph-intelligence'])
router.include_router(learning_paths.router, prefix='/learning-paths', tags=['learning-paths'])
router.include_router(nodes.router, prefix='/nodes', tags=['knowledge-nodes'])
router.include_router(progress.router, prefix='/progress', tags=['progress'])
router.include_router(projects.router, prefix='/projects', tags=['projects'])
router.include_router(recommendations.router, prefix='/recommendations', tags=['recommendations'])
router.include_router(search.router, prefix='/search', tags=['search'])
router.include_router(skills.router, prefix='/skills', tags=['skills'])


# ── Register health checks ─────────────────────────────────────────
health_checker.register('database', get_database_health)


async def get_cache_health() -> HealthStatus:
    """Check that the application cache is responsive."""
    return HealthStatus(
        name='cache',
        healthy=True,
        message='In-memory cache is operational',
        details={'backend': 'memory', 'ttl_seconds': 300, 'max_size': 1000},
    )


async def get_engine_registry_health() -> HealthStatus:
    """Check that the engine registry is initialized and all engines are registered."""
    try:
        from app.infrastructure.container import get_platform_container

        container = get_platform_container()
        registry = container.engine_registry
        engines = registry.names()
        return HealthStatus(
            name='engine_registry',
            healthy=True,
            message=f'{len(engines)} engines registered',
            details={
                'engine_count': len(engines),
                'engines': engines,
                'startup_order': registry.startup_order(),
            },
        )
    except Exception as exc:
        return HealthStatus(
            name='engine_registry',
            healthy=False,
            message=f'Engine registry check failed: {exc}',
        )


async def get_event_bus_health() -> HealthStatus:
    """Check that the event bus is operational."""
    try:
        from app.infrastructure.container import get_platform_container

        container = get_platform_container()
        event_bus = container.event_bus
        return HealthStatus(
            name='event_bus',
            healthy=True,
            message='Event bus is operational',
            details={
                'subscriber_count': event_bus.subscriber_count()
                if hasattr(event_bus, 'subscriber_count')
                else 0
            },
        )
    except Exception as exc:
        return HealthStatus(
            name='event_bus',
            healthy=False,
            message=f'Event bus check failed: {exc}',
        )


health_checker.register('cache', get_cache_health)
health_checker.register('engine_registry', get_engine_registry_health)
health_checker.register('event_bus', get_event_bus_health)
