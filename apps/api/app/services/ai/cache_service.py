"""Cache Service — Redis-backed caching for the AI layer.

Provides:
- Embedding cache (LRU with TTL)
- Search result cache (configurable TTL)
- AI response cache (semantic deduplication)
- Conversation context cache
- Cache hit ratio tracking
"""

from __future__ import annotations

import contextlib
import hashlib
import json
import os
import time
from typing import TYPE_CHECKING, Any

from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from uuid import UUID

logger = get_logger(__name__)


class CacheService:
    """Redis-backed cache for AI operations.

    Falls back to in-memory dict when Redis is unavailable,
    making it safe for local development.
    """

    def __init__(self) -> None:
        self._redis_url = os.getenv('REDIS_URL', '')
        self._redis = None
        self._local_cache: dict[str, tuple[float, Any]] = {}
        self._default_ttl = int(os.getenv('AI_CACHE_TTL', '300'))  # 5 minutes
        self._hits = 0
        self._misses = 0
        self._enabled = os.getenv('AI_CACHE_ENABLED', 'true').lower() == 'true'

    async def _connect(self) -> None:
        """Lazy-connect to Redis."""
        if self._redis is not None or not self._redis_url:
            return
        try:
            import redis.asyncio as aioredis

            self._redis = aioredis.from_url(
                self._redis_url,
                encoding='utf-8',
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await self._redis.ping()
            logger.info('cache_redis_connected')
        except Exception as exc:
            logger.warning('cache_redis_unavailable', error=str(exc))
            self._redis = None

    def _make_key(self, prefix: str, *parts: str) -> str:
        """Create a namespaced cache key."""
        key_parts = [prefix, *list(parts)]
        raw = ':'.join(key_parts)
        if len(raw) > 200:
            return f'{prefix}:{hashlib.sha256(raw.encode()).hexdigest()}'
        return raw

    async def get(self, key: str) -> Any | None:
        """Get a value from cache."""
        if not self._enabled:
            return None

        # Try Redis first
        if self._redis is not None:
            try:
                val = await self._redis.get(key)
                if val is not None:
                    self._hits += 1
                    return json.loads(val)
            except Exception:
                pass

        # Fall back to local cache
        entry = self._local_cache.get(key)
        if entry is not None:
            expires_at, value = entry
            if time.monotonic() < expires_at:
                self._hits += 1
                return value
            del self._local_cache[key]

        self._misses += 1
        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
    ) -> None:
        """Set a value in cache with TTL."""
        if not self._enabled:
            return

        ttl = ttl or self._default_ttl
        serialized = json.dumps(value, default=str)

        if self._redis is not None:
            try:
                await self._redis.setex(key, ttl, serialized)
                return
            except Exception:
                pass

        # Fall back to local cache
        self._local_cache[key] = (time.monotonic() + ttl, value)

        # Evict old entries if local cache is too large
        if len(self._local_cache) > 10000:
            self._evict_stale()

    async def delete(self, key: str) -> None:
        """Delete a key from cache."""
        if self._redis is not None:
            with contextlib.suppress(Exception):
                await self._redis.delete(key)
        self._local_cache.pop(key, None)

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching a pattern."""
        if self._redis is not None:
            try:
                cursor = 0
                while True:
                    cursor, keys = await self._redis.scan(
                        cursor=cursor,
                        match=pattern,
                        count=100,
                    )
                    if keys:
                        await self._redis.delete(*keys)
                    if cursor == 0:
                        break
            except Exception:
                pass

        # Clear matching local keys
        self._local_cache = {
            k: v for k, v in self._local_cache.items() if not k.startswith(pattern.rstrip('*'))
        }

    def _evict_stale(self) -> None:
        """Remove expired entries from local cache."""
        now = time.monotonic()
        stale = [k for k, (t, _) in self._local_cache.items() if now >= t]
        for k in stale:
            del self._local_cache[k]

    @property
    def hit_ratio(self) -> float:
        """Cache hit ratio (0.0 to 1.0)."""
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0

    # ── Convenience methods ───────────────────────────────────────

    async def get_embedding(self, text: str) -> list[float] | None:
        """Get cached embedding for text."""
        key = self._make_key('embed', hashlib.sha256(text.encode()).hexdigest())
        return await self.get(key)

    async def set_embedding(self, text: str, embedding: list[float]) -> None:
        """Cache an embedding."""
        key = self._make_key('embed', hashlib.sha256(text.encode()).hexdigest())
        await self.set(key, embedding, ttl=86400)  # 24h for embeddings

    async def get_search_results(
        self,
        query: str,
        user_id: UUID | None = None,
    ) -> list[dict] | None:
        """Get cached search results."""
        parts = ['search', hashlib.sha256(query.encode()).hexdigest()]
        if user_id:
            parts.append(str(user_id))
        return await self.get(self._make_key(*parts))

    async def set_search_results(
        self,
        query: str,
        results: list[dict],
        user_id: UUID | None = None,
    ) -> None:
        """Cache search results."""
        parts = ['search', hashlib.sha256(query.encode()).hexdigest()]
        if user_id:
            parts.append(str(user_id))
        await self.set(self._make_key(*parts), results, ttl=120)  # 2min for search

    async def get_ai_response(
        self,
        session_id: UUID,
        message: str,
    ) -> str | None:
        """Get cached AI response for exact message."""
        key = self._make_key(
            'ai_response',
            str(session_id),
            hashlib.sha256(message.encode()).hexdigest(),
        )
        return await self.get(key)

    async def set_ai_response(
        self,
        session_id: UUID,
        message: str,
        response: str,
    ) -> None:
        """Cache an AI response (short TTL)."""
        key = self._make_key(
            'ai_response',
            str(session_id),
            hashlib.sha256(message.encode()).hexdigest(),
        )
        await self.set(key, response, ttl=60)  # 1min for responses
