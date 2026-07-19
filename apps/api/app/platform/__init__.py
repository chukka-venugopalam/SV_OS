"""Backward-compatibility shim — re-exports from canonical infrastructure/ and events/.

This module is kept for backward compatibility. New code should import directly from:
- ``app.events.bus`` for EventBus, EventEnvelope, EventMetadata
- ``app.infrastructure.cache`` for CacheBackend, InMemoryCache, RedisCache
- ``app.infrastructure.container`` for PlatformContainer
- ``app.infrastructure.registries`` for EngineRegistry, CapabilityRegistry, PluginRegistry
- ``app.infrastructure.runtime`` for PlatformRuntime
"""

from app.events.bus import EventBus, EventEnvelope, EventMetadata  # noqa: F401
from app.infrastructure.cache import (  # noqa: F401
    CacheBackend,
    InMemoryCache,
    RedisCache,
    get_cache_backend,
)
from app.infrastructure.container import (  # noqa: F401
    PlatformContainer,
    build_platform_container,
    get_platform_container,
)
from app.infrastructure.registries import (  # noqa: F401
    CapabilityRegistry,
    EngineRegistry,
    PluginManifest,
    PluginRegistry,
)
from app.infrastructure.runtime import (  # noqa: F401
    PlatformRuntime,
    initialize_platform_runtime,
)

__all__ = [
    'CacheBackend',
    'CapabilityRegistry',
    'EngineRegistry',
    'EventBus',
    'EventEnvelope',
    'EventMetadata',
    'InMemoryCache',
    'PlatformContainer',
    'PlatformRuntime',
    'PluginManifest',
    'PluginRegistry',
    'RedisCache',
    'build_platform_container',
    'get_cache_backend',
    'get_platform_container',
    'initialize_platform_runtime',
]
