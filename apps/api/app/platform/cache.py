"""Backward-compatibility shim — re-exports from canonical app.infrastructure.cache.

New code should import directly from ``app.infrastructure.cache``.
"""

from app.infrastructure.cache import (
    CacheBackend,
    InMemoryCache,
    RedisCache,
    get_cache_backend,
)

__all__ = [
    'CacheBackend',
    'InMemoryCache',
    'RedisCache',
    'get_cache_backend',
]
