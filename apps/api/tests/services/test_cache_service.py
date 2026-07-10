"""Tests for CacheService — Redis-backed caching with fallback."""

from __future__ import annotations

from uuid import uuid4

from app.services.ai.cache_service import CacheService


class TestCacheService:
    """Test the CacheService for AI layer caching."""

    async def test_get_set_local_cache(self):
        """Cache stores and retrieves values from local cache fallback."""
        cache = CacheService()
        cache._enabled = True
        await cache.set('test_key', {'foo': 'bar'}, ttl=60)
        result = await cache.get('test_key')
        assert result == {'foo': 'bar'}

    async def test_get_missing_key(self):
        """Cache returns None for missing keys."""
        cache = CacheService()
        cache._enabled = True
        result = await cache.get('nonexistent')
        assert result is None

    async def test_get_expired_key(self):
        """Cache returns None for expired keys."""
        cache = CacheService()
        cache._enabled = True
        # Set with negative TTL to force immediate expiry
        import time

        cache._local_cache['expire_key'] = (time.monotonic() - 1, 'value')
        result = await cache.get('expire_key')
        assert result is None

    async def test_delete_key(self):
        """Cache removes keys on delete."""
        cache = CacheService()
        cache._enabled = True
        await cache.set('del_key', 'value')
        await cache.delete('del_key')
        result = await cache.get('del_key')
        assert result is None

    async def test_delete_pattern(self):
        """Cache deletes keys matching a pattern."""
        cache = CacheService()
        cache._enabled = True
        await cache.set('embed:abc', 'v1')
        await cache.set('embed:def', 'v2')
        await cache.set('search:xyz', 'v3')
        await cache.delete_pattern('embed:*')
        assert await cache.get('embed:abc') is None
        assert await cache.get('embed:def') is None
        assert await cache.get('search:xyz') == 'v3'

    async def test_embedding_cache(self):
        """Embedding cache stores and retrieves embeddings."""
        cache = CacheService()
        cache._enabled = True
        embedding = [0.1, 0.2, 0.3, 0.4]
        await cache.set_embedding('Hello world', embedding)
        result = await cache.get_embedding('Hello world')
        assert result == embedding

    async def test_search_results_cache(self):
        """Search results cache works with user context."""
        cache = CacheService()
        cache._enabled = True
        results = [{'node': {'title': 'Python'}, 'score': 0.95}]
        user_id = uuid4()
        await cache.set_search_results('python', results, user_id=user_id)
        cached = await cache.get_search_results('python', user_id=user_id)
        assert cached == results

    async def test_ai_response_cache(self):
        """AI response cache stores responses."""
        cache = CacheService()
        cache._enabled = True
        session_id = uuid4()
        await cache.set_ai_response(session_id, 'Hello', 'Hi there!')
        response = await cache.get_ai_response(session_id, 'Hello')
        assert response == 'Hi there!'

    async def test_hit_ratio(self):
        """Hit ratio is tracked correctly."""
        cache = CacheService()
        cache._enabled = True
        await cache.set('key1', 'value')
        await cache.get('key1')  # hit
        await cache.get('key1')  # hit
        await cache.get('missing')  # miss
        assert cache.hit_ratio > 0
        assert cache.hit_ratio < 1.0

    async def test_disabled_cache(self):
        """Disabled cache returns None for all gets."""
        cache = CacheService()
        cache._enabled = False
        await cache.set('key', 'value')
        result = await cache.get('key')
        assert result is None

    async def test_local_cache_eviction(self):
        """Local cache evicts old entries when storage exceeds limit."""
        cache = CacheService()
        cache._enabled = True
        # Fill beyond max with expired entries
        import time

        now = time.monotonic()
        for i in range(10500):
            cache._local_cache[f'key_{i}'] = (now - 1, i)  # expired
        cache._evict_stale()
        assert len(cache._local_cache) == 0

    async def test_key_generation(self):
        """Keys are properly namespaced and hashed when long."""
        cache = CacheService()
        key = cache._make_key('embed', 'a' * 300)
        assert len(key) < 100  # Should be hashed
        assert key.startswith('embed:')
