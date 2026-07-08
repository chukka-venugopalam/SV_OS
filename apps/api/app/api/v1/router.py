"""API v1 main router — infrastructure endpoints.

This module aggregates all v1 route modules and defines the three
standard health endpoints required by orchestration platforms.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from structlog.stdlib import get_logger

from app.api.deps import get_settings
from app.core.config import Settings
from app.core.database import check_database_connection
from app.schemas.response import error_response, success_response
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
    settings: Settings = Depends(get_settings),
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
            'version': settings.APP_VERSION,
            'environment': settings.ENVIRONMENT,
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
        'timestamp': datetime.now(timezone.utc).isoformat(),
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
        'timestamp': datetime.now(timezone.utc).isoformat(),
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
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': _request_id(request),
        }

    return {
        'success': False,
        'message': 'Not ready',
        'data': {'status': 'not_ready', 'database': 'disconnected'},
        'errors': None,
        'timestamp': datetime.now(timezone.utc).isoformat(),
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
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'request_id': _request_id(request),
    }


# ── Root / API Metadata ────────────────────────────────────────────


@router.get('/', tags=['infrastructure'])
async def root(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> dict:
    """API root — returns metadata about the API."""
    return {
        'success': True,
        'message': 'SV-OS API',
        'data': {
            'name': settings.APP_NAME,
            'description': settings.APP_DESCRIPTION,
            'version': settings.APP_VERSION,
            'environment': settings.ENVIRONMENT,
            'documentation': '/docs',
            'api_version': 'v1',
        },
        'errors': None,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'request_id': _request_id(request),
    }


# ── Business route imports (Phase 3) ─────────────────────────────
from app.api.v1.endpoints import (
    activity,
    ai,
    ai_chat,
    auth,
    bookmarks,
    careers,
    favorites,
    graph,
    graph_intelligence,
    learning_paths,
    nodes,
    progress,
    projects,
    recommendations,
    search,
    skills,
)

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
router.include_router(progress.router, prefix='/progress', tags=['progress'])
router.include_router(projects.router, prefix='/projects', tags=['projects'])
router.include_router(recommendations.router, prefix='/recommendations', tags=['recommendations'])
router.include_router(search.router, prefix='/search', tags=['search'])
router.include_router(skills.router, prefix='/skills', tags=['skills'])


# ── Register health checks ─────────────────────────────────────────

from app.core.database import get_database_health

health_checker.register('database', get_database_health)
