"""Graph Query Service — thin service wrapper exposing graph queries to capabilities.

Keeps services thin. Business logic belongs in engines.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from uuid import UUID

    from app.engines.graph_engine import GraphEngine
    from app.engines.knowledge_engine import KnowledgeEngine
    from app.engines.query_engine import QueryEngine
    from app.engines.traversal_engine import TraversalEngine
    from app.infrastructure.cache.graph_cache import GraphCache


class GraphQueryService:
    """Thin service exposing graph query operations to capabilities.

    Delegates to QueryEngine, GraphEngine, and TraversalEngine.
    Adds caching and result formatting.
    """

    def __init__(
        self,
        query_engine: QueryEngine | None = None,
        graph_engine: GraphEngine | None = None,
        traversal_engine: TraversalEngine | None = None,
        knowledge_engine: KnowledgeEngine | None = None,
        cache: GraphCache | None = None,
    ) -> None:
        self._query = query_engine
        self._graph = graph_engine
        self._traversal = traversal_engine
        self._knowledge = knowledge_engine
        self._cache = cache

    async def shortest_path(self, source_id: UUID, target_id: UUID, max_depth: int = 10) -> dict:
        """Find shortest path between two nodes."""
        cache_key = f'shortest_path:{source_id}:{target_id}:{max_depth}'
        if self._cache:
            cached = await self._cache.get('traversal', cache_key)
            if cached is not None:
                return cached

        result = await self._query.find_shortest_path(source_id, target_id, max_depth)

        if self._cache:
            await self._cache.set('traversal', cache_key, result)
        return result

    async def dependency_chain(self, node_id: UUID, max_depth: int = 5) -> dict:
        """Get the prerequisite chain for a node."""
        cache_key = f'dependency_chain:{node_id}:{max_depth}'
        if self._cache:
            cached = await self._cache.get('traversal', cache_key)
            if cached is not None:
                return cached

        result = await self._query.find_dependency_chain(node_id, max_depth)

        if self._cache:
            await self._cache.set('traversal', cache_key, result)
        return result

    async def reverse_dependency_chain(self, node_id: UUID, max_depth: int = 5) -> dict:
        """Get the chain of nodes depending on a node."""
        return await self._query.find_reverse_dependency_chain(node_id, max_depth)

    async def related_nodes(
        self,
        node_id: UUID,
        relationship_type: str | None = None,
        max_depth: int = 2,
    ) -> dict:
        """Find nodes related to a node."""
        return await self._query.find_related_nodes(node_id, relationship_type, max_depth)

    async def common_nodes(self, node_id_a: UUID, node_id_b: UUID, max_depth: int = 3) -> dict:
        """Find common neighbors of two nodes."""
        return await self._query.find_common_nodes(node_id_a, node_id_b, max_depth)

    async def subgraph(
        self,
        center_node_id: UUID,
        depth: int = 2,
        relationship_type: str | None = None,
    ) -> dict:
        """Extract a subgraph around a center node."""
        return await self._query.find_subgraph(center_node_id, depth, relationship_type)

    async def validate_graph(self, full_data: dict | None = None) -> dict:
        """Validate graph structure. Delegates to ValidationEngine."""
        from app.engines.validation_engine import ValidationEngine

        val = ValidationEngine(graph_engine=self._graph)
        health = await val.graph_health_score(full_data)
        return {
            'score': health.score,
            'node_count': health.node_count,
            'edge_count': health.edge_count,
            'orphan_count': health.orphan_count,
            'cycle_count': health.cycle_count,
            'issues': health.issues,
            'warnings': health.warnings,
        }

    async def search_nodes(self, query: str, page: int = 1, per_page: int = 20) -> dict:
        """Search graph nodes by title/slug/description."""
        from app.engines.search_engine import SearchEngine

        se = SearchEngine(graph_engine=self._graph, knowledge_engine=self._knowledge)
        return await se.search(query, page=page, per_page=per_page)

    async def graph_statistics(self) -> dict:
        """Get graph statistics with caching."""
        cache_key = 'graph_statistics'
        if self._cache:
            cached = await self._cache.get('statistics', cache_key)
            if cached is not None:
                return cached

        if self._graph is None:
            return {'node_count': 0, 'edge_count': 0}

        stats = await self._graph.graph_statistics()

        if self._cache:
            await self._cache.set('statistics', cache_key, stats)
        return stats

    async def graph_metadata(self) -> dict:
        """Get graph metadata."""
        if self._graph is None:
            return {}
        return await self._graph.graph_metadata()


class GraphStatisticsService:
    """Thin service for graph statistics."""

    def __init__(self, graph_engine: GraphEngine | None = None) -> None:
        self._graph = graph_engine

    async def get_statistics(self) -> dict:
        if self._graph is None:
            return {'node_count': 0, 'edge_count': 0}
        return await self._graph.graph_statistics()


class GraphValidationService:
    """Thin service for graph validation."""

    def __init__(self, validation_engine: Any = None) -> None:
        self._validation = validation_engine

    async def validate(self, data: dict) -> dict:
        if self._validation is None:
            return {'valid': True}
        return await self._validation.validate_graph_change(data)

    async def health_score(self) -> dict:
        if self._validation is None:
            return {'score': 1.0}
        health = await self._validation.graph_health_score()
        return {
            'score': health.score,
            'node_count': health.node_count,
            'edge_count': health.edge_count,
            'orphan_count': health.orphan_count,
            'cycle_count': health.cycle_count,
            'issues': health.issues,
            'warnings': health.warnings,
        }


class GraphSearchService:
    """Thin service for graph search."""

    def __init__(self, search_engine: Any = None) -> None:
        self._search = search_engine

    async def search(self, query: str, page: int = 1, per_page: int = 20) -> dict:
        if self._search is None:
            return {'items': [], 'total': 0}
        return await self._search.search(query, page=page, per_page=per_page)


class GraphVersionService:
    """Thin service for graph version management."""

    def __init__(self, graph_engine: GraphEngine | None = None) -> None:
        self._graph = graph_engine

    async def get_version(self) -> str:
        if self._graph is None:
            return '0.0.0'
        return await self._graph.graph_version()

    async def get_metadata(self) -> dict:
        if self._graph is None:
            return {}
        return await self._graph.graph_metadata()
