"""Dependency Engine — evaluate prerequisites, blockers, and readiness.

Supports:
- Prerequisite lookup (direct and transitive)
- Reverse lookup (what depends on this node)
- Dependency cache (in-memory)
- Unlock cache (what nodes are unlocked by completing this)
- Cache invalidation
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.engines.base import EngineBase, EngineDependency, EngineHealth


@dataclass
class DependencyCache:
    """Cached lookup results for a node's dependencies."""

    prerequisites: list[UUID] = field(default_factory=list)
    transitive_prerequisites: list[UUID] = field(default_factory=list)
    dependents: list[UUID] = field(default_factory=list)
    transitive_dependents: list[UUID] = field(default_factory=list)
    cached_at: float = 0.0


class DependencyEngine(EngineBase):
    """Dependency Engine — prerequisite, blocker, and readiness evaluation.

    Manages in-memory caches for prerequisite and dependency lookups.
    Relies on the GraphEngine for the raw edge data.

    Public Interface:
        get_prerequisites, get_dependents, get_readiness,
        get_blockers, invalidate_cache
    """

    def __init__(self, graph_engine: Any | None = None) -> None:
        super().__init__()
        self._graph: Any = graph_engine
        self._cache: dict[UUID, DependencyCache] = {}
        self._cache_enabled: bool = True

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'dependency'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(
                engine_name='graph',
                required=True,
                description='Graph engine for edge traversal',
            ),
            EngineDependency(
                engine_name='state',
                required=False,
                description='State engine for readiness evaluation',
            ),
        ]

    # ── Lifecycle ──────────────────────────────────────────────────

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._cache.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Dependency engine is operational',
            details={
                'cached_nodes': len(self._cache),
                'cache_enabled': self._cache_enabled,
            },
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ── Prerequisite Lookup ────────────────────────────────────────

    async def get_prerequisites(self, node_id: UUID) -> list[UUID]:
        """Get direct prerequisite node IDs for a node.

        Uses the in-memory cache if available, otherwise queries the
        GraphEngine for prerequisite edges.
        """
        cached = self._get_cached(node_id)
        if cached is not None:
            return cached.prerequisites

        prereqs = await self._resolve_prerequisites(node_id)
        self._update_cache(node_id, prerequisites=prereqs)
        return prereqs

    async def get_transitive_prerequisites(self, node_id: UUID, max_depth: int = 5) -> list[UUID]:
        """Get all transitive prerequisites (prerequisites of prerequisites).

        Uses BFS traversal up to max_depth to collect the full chain.
        """
        cached = self._get_cached(node_id)
        if cached is not None and cached.transitive_prerequisites:
            return cached.transitive_prerequisites

        all_prereqs: list[UUID] = []
        visited: set[UUID] = {node_id}
        current_level: list[UUID] = [node_id]

        for _ in range(max_depth):
            next_level: list[UUID] = []
            for nid in current_level:
                prereqs = await self._resolve_prerequisites(nid)
                for pid in prereqs:
                    if pid not in visited:
                        visited.add(pid)
                        next_level.append(pid)
                        all_prereqs.append(pid)
            current_level = next_level
            if not current_level:
                break

        self._update_cache(node_id, transitive_prerequisites=all_prereqs)
        return all_prereqs

    # ── Reverse Lookup ─────────────────────────────────────────────

    async def get_dependents(self, node_id: UUID) -> list[UUID]:
        """Get direct dependents (nodes that have this node as prerequisite)."""
        cached = self._get_cached(node_id)
        if cached is not None:
            return cached.dependents

        deps = await self._resolve_dependents(node_id)
        self._update_cache(node_id, dependents=deps)
        return deps

    async def get_transitive_dependents(self, node_id: UUID, max_depth: int = 5) -> list[UUID]:
        """Get all transitive dependents (dependents of dependents)."""
        cached = self._get_cached(node_id)
        if cached is not None and cached.transitive_dependents:
            return cached.transitive_dependents

        all_deps: list[UUID] = []
        visited: set[UUID] = {node_id}
        current_level: list[UUID] = [node_id]

        for _ in range(max_depth):
            next_level: list[UUID] = []
            for nid in current_level:
                deps = await self._resolve_dependents(nid)
                for did in deps:
                    if did not in visited:
                        visited.add(did)
                        next_level.append(did)
                        all_deps.append(did)
            current_level = next_level
            if not current_level:
                break

        self._update_cache(node_id, transitive_dependents=all_deps)
        return all_deps

    # ── Readiness ──────────────────────────────────────────────────

    async def get_readiness(self, user_id: UUID, node_id: UUID) -> dict:
        """Evaluate readiness to learn a specific node.

        Returns a dict with:
        - 'ready': bool — whether the user can start this node
        - 'blockers': list of blocking node IDs
        - 'completed_prerequisites': count
        - 'total_prerequisites': count
        - 'prerequisite_completion': float (0.0 to 1.0)
        """
        prereqs = await self.get_prerequisites(node_id)
        if not prereqs:
            return {
                'ready': True,
                'blockers': [],
                'completed_prerequisites': 0,
                'total_prerequisites': 0,
                'prerequisite_completion': 1.0,
                'node_id': str(node_id),
            }

        # Check state engine for completion status
        completed_ids: set[UUID] = set()
        if hasattr(self, '_graph') and user_id and node_id:
            state_engine = None
            if state_engine:
                for pid in prereqs:
                    state = await state_engine.get_state(user_id, pid)
                    if state and state.get('status') in ('completed', 'mastered'):
                        completed_ids.add(pid)

        blockers = [pid for pid in prereqs if pid not in completed_ids]

        return {
            'ready': len(blockers) == 0,
            'blockers': [str(b) for b in blockers],
            'completed_prerequisites': len(completed_ids),
            'total_prerequisites': len(prereqs),
            'prerequisite_completion': len(completed_ids) / len(prereqs) if prereqs else 1.0,
            'node_id': str(node_id),
        }

    async def get_blockers(self, _user_id: UUID, node_id: UUID) -> list[dict]:
        """Get prerequisite blockers for a node with details."""
        prereqs = await self.get_prerequisites(node_id)
        if not prereqs:
            return []

        blockers: list[dict] = []
        for pid in prereqs:
            blocker_info: dict[str, Any] = {
                'node_id': str(pid),
                'is_blocker': True,
            }
            # Get node title from graph engine
            if self._graph:
                try:
                    node = await self._graph.get_node(pid)
                    if node:
                        blocker_info['title'] = node.get('title', '')
                except Exception:
                    blocker_info['title'] = ''
            blockers.append(blocker_info)

        return blockers

    # ── Cache Management ───────────────────────────────────────────

    async def invalidate_cache(self, node_id: UUID | None = None) -> None:
        """Invalidate the dependency cache.

        Args:
            node_id: If provided, only invalidates cache for that node.
                     If None, clears the entire cache.

        """
        if node_id is None:
            self._cache.clear()
        else:
            self._cache.pop(node_id, None)
            # Also invalidate transitive dependents and prerequisites
            to_remove: list[UUID] = []
            for cached_id in self._cache:
                cached = self._cache[cached_id]
                if node_id in cached.prerequisites or node_id in cached.dependents:
                    to_remove.append(cached_id)
            for rid in to_remove:
                self._cache.pop(rid, None)

    async def set_cache_enabled(self, enabled: bool) -> None:
        """Enable or disable the dependency cache."""
        self._cache_enabled = enabled
        if not enabled:
            self._cache.clear()

    async def get_cache_stats(self) -> dict:
        """Get cache statistics."""
        return {
            'cached_nodes': len(self._cache),
            'enabled': self._cache_enabled,
        }

    # ── Event Subscriptions ────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        """Register event subscriptions."""
        await super().subscribe_events(event_bus)

    # ── Internal ───────────────────────────────────────────────────

    async def _resolve_prerequisites(self, node_id: UUID) -> list[UUID]:
        """Resolve prerequisites from the GraphEngine."""
        if not self._graph:
            return []
        try:
            incoming = await self._graph.get_incoming(node_id)
            return [
                UUID(edge['source_id'])
                for edge in incoming
                if edge.get('relationship_type') == 'prerequisite'
            ]
        except (NotImplementedError, Exception):
            return []

    async def _resolve_dependents(self, node_id: UUID) -> list[UUID]:
        """Resolve dependents from the GraphEngine."""
        if not self._graph:
            return []
        try:
            outgoing = await self._graph.get_outgoing(node_id)
            return [
                UUID(edge['target_id'])
                for edge in outgoing
                if edge.get('relationship_type') == 'prerequisite'
            ]
        except (NotImplementedError, Exception):
            return []

    def _get_cached(self, node_id: UUID) -> DependencyCache | None:
        """Get cached data for a node, if caching is enabled and data exists."""
        if not self._cache_enabled:
            return None
        return self._cache.get(node_id)

    def _update_cache(
        self,
        node_id: UUID,
        prerequisites: list[UUID] | None = None,
        transitive_prerequisites: list[UUID] | None = None,
        dependents: list[UUID] | None = None,
        transitive_dependents: list[UUID] | None = None,
    ) -> None:
        """Update the cache for a node."""
        import time

        if not self._cache_enabled:
            return

        cached = self._cache.get(node_id)
        if cached is None:
            cached = DependencyCache()
            self._cache[node_id] = cached

        if prerequisites is not None:
            cached.prerequisites = prerequisites
        if transitive_prerequisites is not None:
            cached.transitive_prerequisites = transitive_prerequisites
        if dependents is not None:
            cached.dependents = dependents
        if transitive_dependents is not None:
            cached.transitive_dependents = transitive_dependents
        cached.cached_at = time.time()
