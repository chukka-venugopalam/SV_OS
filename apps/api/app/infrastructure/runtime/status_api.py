"""Platform API endpoints for status and diagnostics."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_settings
from app.infrastructure.container import get_platform_container
from app.infrastructure.runtime import PlatformRuntime, initialize_platform_runtime

if TYPE_CHECKING:
    from app.core.config import Settings

router = APIRouter(prefix='/platform', tags=['platform'])


@router.get('/status')
async def platform_status(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    """Expose core platform status, registry contents, and feature flags."""
    container = get_platform_container()
    runtime: PlatformRuntime = initialize_platform_runtime()
    await runtime.initialize()

    return {
        'success': True,
        'message': 'Platform foundation is ready',
        'data': {
            'status': 'ready',
            'environment': settings.environment_profile,
            'features': settings.feature_flags,
            'engines': container.engine_registry.names(),
            'capabilities': container.capability_registry.names(),
            'plugins': [plugin.name for plugin in container.plugin_registry.plugins()],
            'initialized': runtime.initialized,
        },
        'errors': None,
        'timestamp': datetime.now(UTC).isoformat(),
        'request_id': getattr(request.state, 'request_id', None),
    }
