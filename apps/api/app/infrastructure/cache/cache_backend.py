"""Cache abstraction with in-memory fallback for local and Redis-backed deployments."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import MutableMapping


class CacheBackend:
    """Minimal cache interface used by platform services."""

    async def get(self, key: str) -> Any:  # pragma: no cover - interface
        raise NotImplementedError

    async def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: int | None = None,
    ) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def delete(self, key: str) -> None:  # pragma: no cover - interface
        raise NotImplementedError


class InMemoryCache(CacheBackend):
    """Simple thread-safe in-memory cache for development and tests."""

    def __init__(self) -> None:
        self._store: MutableMapping[str, tuple[Any, float | None]] = {}

    async def get(self, key: str) -> Any:
        value, expires_at = self._store.get(key, (None, None))
        if expires_at is not None and expires_at <= asyncio.get_running_loop().time():
            self._store.pop(key, None)
            return None
        return value

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        expires_at = (
            None if ttl_seconds is None else asyncio.get_running_loop().time() + ttl_seconds
        )
        self._store[key] = (value, expires_at)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)


class RedisCache(CacheBackend):
    """Redis-backed cache adapter. Falls back to the in-memory implementation if unavailable."""

    def __init__(self, redis_client: Any | None = None) -> None:
        self._client = redis_client
        self._fallback = InMemoryCache()

    async def get(self, key: str) -> Any:
        if self._client is None:
            return await self._fallback.get(key)
        try:
            return self._client.get(key)
        except Exception:
            return await self._fallback.get(key)

    async def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        if self._client is None:
            await self._fallback.set(key, value, ttl_seconds)
            return
        try:
            if ttl_seconds is None:
                self._client.set(key, value)
            else:
                self._client.setex(key, ttl_seconds, value)
        except Exception:
            await self._fallback.set(key, value, ttl_seconds)

    async def delete(self, key: str) -> None:
        if self._client is None:
            await self._fallback.delete(key)
            return
        try:
            self._client.delete(key)
        except Exception:
            await self._fallback.delete(key)


def get_cache_backend(redis_client: Any | None = None) -> CacheBackend:
    """Build a cache backend using Redis when available and in-memory otherwise."""
    return RedisCache(redis_client)
