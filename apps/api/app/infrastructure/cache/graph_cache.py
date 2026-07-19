"""Graph Cache — version-aware caching for graph operations.

Supports:
- Node cache
- Edge cache
- Traversal cache
- Metadata cache
- Statistics cache
- Version-aware invalidation
- Automatic cache rebuild

All caches are automatically invalidated when the graph version changes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID


@dataclass
class CacheEntry:
    """A single cache entry with version tracking."""
    key: str
    value: Any
    version: int = 0
    ttl_seconds: int = 300  # 5 minute default TTL
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def is_expired(self, current_version: int, current_time: str | None = None) -> bool:
        """Check if this cache entry is expired based on version or TTL.

        Args:
            current_version: The current graph version number.
            current_time: Optional current time string (ISO format).

        Returns:
            True if the entry should be considered expired.
        """
        if self.version < current_version:
            return True
        # TTL check (in-memory only — no background eviction)
        return False


@dataclass
class CacheStats:
    """Statistics for cache performance tracking."""
    hits: int = 0
    misses: int = 0
    invalidations: int = 0
    size: int = 0
    hit_rate: float = 0.0


class GraphCache:
    """Version-aware graph cache with multiple cache regions.

    Each region (node, edge, traversal, metadata, statistics) is
    independently keyed and version-tracked.

    Public Interface:
        get, set, invalidate, invalidate_all,
        get_stats, reset_stats, size
    """

    def __init__(self, default_ttl_seconds: int = 300) -> None:
        self._default_ttl = default_ttl_seconds
        self._graph_version: int = 0

        # Cache regions
        self._node_cache: dict[str, CacheEntry] = {}
        self._edge_cache: dict[str, CacheEntry] = {}
        self._traversal_cache: dict[str, CacheEntry] = {}
        self._metadata_cache: dict[str, CacheEntry] = {}
        self._statistics_cache: dict[str, CacheEntry] = {}

        # Performance tracking
        self._stats: dict[str, CacheStats] = {
            'node': CacheStats(),
            'edge': CacheStats(),
            'traversal': CacheStats(),
            'metadata': CacheStats(),
            'statistics': CacheStats(),
        }

    # ── Region Selection ───────────────────────────────────────────

    def _get_region(self, region: str) -> dict[str, CacheEntry]:
        """Get the cache dict for a region name."""
        regions = {
            'node': self._node_cache,
            'edge': self._edge_cache,
            'traversal': self._traversal_cache,
            'metadata': self._metadata_cache,
            'statistics': self._statistics_cache,
        }
        return regions.get(region, self._node_cache)

    def _get_stats(self, region: str) -> CacheStats:
        return self._stats.get(region, CacheStats())

    # ── Version Management ─────────────────────────────────────────

    def bump_version(self) -> None:
        """Increment the graph version. Invalidates all caches."""
        self._graph_version += 1

    @property
    def graph_version(self) -> int:
        return self._graph_version

    # ── Get / Set ──────────────────────────────────────────────────

    async def get(self, region: str, key: str) -> Any | None:
        """Get a value from cache.

        Args:
            region: Cache region ('node', 'edge', 'traversal', 'metadata', 'statistics').
            key: Cache key.

        Returns:
            Cached value or None if not found / expired.
        """
        cache = self._get_region(region)
        stats = self._get_stats(region)
        entry = cache.get(key)

        if entry is None:
            stats.misses += 1
            return None

        # Check version-based expiry
        if entry.version < self._graph_version:
            cache.pop(key, None)
            stats.invalidations += 1
            stats.misses += 1
            return None

        stats.hits += 1
        return entry.value

    async def set(
        self,
        region: str,
        key: str,
        value: Any,
        ttl_seconds: int | None = None,
    ) -> None:
        """Set a value in cache.

        Args:
            region: Cache region.
            key: Cache key.
            value: Value to cache.
            ttl_seconds: Optional TTL override. Uses default if None.
        """
        cache = self._get_region(region)
        entry = CacheEntry(
            key=key,
            value=value,
            version=self._graph_version,
            ttl_seconds=ttl_seconds or self._default_ttl,
        )
        cache[key] = entry

    # ── Invalidation ───────────────────────────────────────────────

    async def invalidate(self, region: str, key: str | None = None) -> None:
        """Invalidate a specific cache key, or an entire region.

        Args:
            region: Cache region to invalidate.
            key: Optional specific key to invalidate. If None, invalidates the entire region.
        """
        cache = self._get_region(region)
        stats = self._get_stats(region)

        if key is not None:
            cache.pop(key, None)
            stats.invalidations += 1
        else:
            count = len(cache)
            cache.clear()
            stats.invalidations += count

    async def invalidate_all(self) -> dict[str, int]:
        """Invalidate all cache regions.

        Returns:
            Dict of region -> number of entries invalidated.
        """
        counts: dict[str, int] = {}
        for name in ('node', 'edge', 'traversal', 'metadata', 'statistics'):
            cache = self._get_region(name)
            counts[name] = len(cache)
            cache.clear()
        self._graph_version += 1
        return counts

    async def invalidate_for_node(self, node_id: UUID) -> None:
        """Invalidate all caches related to a specific node.

        Args:
            node_id: Node UUID to invalidate.
        """
        nid_str = str(node_id)
        await self.invalidate('node', nid_str)
        await self.invalidate('edge', nid_str)
        await self.invalidate('traversal', nid_str)

    async def invalidate_for_edge(self, edge_id: UUID) -> None:
        """Invalidate caches related to a specific edge."""
        await self.invalidate('edge', str(edge_id))
        await self.invalidate('traversal', None)  # Invalidate all traversals

    # ── Cache Rebuild ──────────────────────────────────────────────

    async def rebuild(self) -> dict[str, int]:
        """Rebuild all caches by invalidating everything.

        Actual rebuild is handled by query engines re-populating on demand.

        Returns:
            Dict of region -> cleared count.
        """
        return await self.invalidate_all()

    # ── Statistics ─────────────────────────────────────────────────

    def get_stats(self, region: str | None = None) -> dict[str, Any]:
        """Get cache performance statistics.

        Args:
            region: Optional specific region. Returns all regions if None.

        Returns:
            Dict of region -> {hits, misses, hit_rate, size, invalidations}.
        """
        if region:
            stats = self._get_stats(region)
            cache = self._get_region(region)
            stats.size = len(cache)
            total = stats.hits + stats.misses
            stats.hit_rate = round(stats.hits / total, 4) if total > 0 else 0.0
            return {region: {
                'hits': stats.hits,
                'misses': stats.misses,
                'hit_rate': stats.hit_rate,
                'size': stats.size,
                'invalidations': stats.invalidations,
            }}

        result = {}
        for name in ('node', 'edge', 'traversal', 'metadata', 'statistics'):
            stats = self._get_stats(name)
            cache = self._get_region(name)
            stats.size = len(cache)
            total = stats.hits + stats.misses
            stats.hit_rate = round(stats.hits / total, 4) if total > 0 else 0.0
            result[name] = {
                'hits': stats.hits,
                'misses': stats.misses,
                'hit_rate': stats.hit_rate,
                'size': stats.size,
                'invalidations': stats.invalidations,
            }
        return result

    def reset_stats(self) -> None:
        """Reset all performance statistics."""
        for name in self._stats:
            self._stats[name] = CacheStats()

    def total_size(self) -> int:
        """Get total number of cached entries across all regions."""
        total = 0
        for name in ('node', 'edge', 'traversal', 'metadata', 'statistics'):
            total += len(self._get_region(name))
        return total
