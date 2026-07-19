"""Graph Query Engine — callable RPC query functions over the knowledge graph.

All queries internally use GraphEngine and TraversalEngine for data access.
No parser needed — these are callable query functions.

Queries:
- find_shortest_path, find_dependency_chain, find_reverse_dependency_chain
- find_unlock_chain, find_related_nodes, find_common_nodes
- find_skill_dependencies, find_career_dependencies
- find_hidden_relationships, find_reverse_dependencies
- find_learning_bottlenecks, find_orphan_nodes, find_cycles
- find_subgraph
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from uuid import UUID

from app.engines.base import EngineBase, EngineDependency, EngineHealth

if TYPE_CHECKING:
    from app.engines.graph_engine import GraphEngine
    from app.engines.knowledge_engine import KnowledgeEngine
    from app.engines.traversal_engine import TraversalEngine


class QueryEngine(EngineBase):
    """Query Engine — RPC-style graph query functions.

    Provides semantic query methods that combine GraphEngine,
    TraversalEngine, and KnowledgeEngine operations.

    Public Interface:
        find_shortest_path, find_dependency_chain,
        find_reverse_dependency_chain, find_unlock_chain,
        find_related_nodes, find_common_nodes,
        find_skill_dependencies, find_career_dependencies,
        find_hidden_relationships, find_reverse_dependencies,
        find_learning_bottlenecks, find_orphan_nodes,
        find_cycles, find_subgraph
    """

    def __init__(
        self,
        graph_engine: GraphEngine | None = None,
        traversal_engine: TraversalEngine | None = None,
        knowledge_engine: KnowledgeEngine | None = None,
    ) -> None:
        super().__init__()
        self._graph = graph_engine
        self._traversal = traversal_engine
        self._knowledge = knowledge_engine

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'query'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='graph', required=True, description='Graph engine'),
            EngineDependency(
                engine_name='traversal',
                required=True,
                description='Traversal engine',
            ),
            EngineDependency(
                engine_name='knowledge',
                required=False,
                description='Knowledge engine',
            ),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        pass

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Query engine is operational',
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        if self._traversal is None:
            issues.append('No TraversalEngine reference set')
        return issues

    # ── Query: Shortest Path ──────────────────────────────────────

    async def find_shortest_path(
        self,
        source_id: UUID,
        target_id: UUID,
        max_depth: int = 10,
    ) -> dict:
        """Find the shortest path between two nodes.

        Uses TraversalEngine.shortest_path internally.

        Args:
            source_id: Source node UUID.
            target_id: Target node UUID.
            max_depth: Maximum search depth.

        Returns:
            Dict with 'path', 'found', 'steps', 'source', 'target'.

        """
        if self._traversal is None:
            return {
                'path': [],
                'found': False,
                'steps': 0,
                'source': str(source_id),
                'target': str(target_id),
            }

        path = await self._traversal.shortest_path(source_id, target_id, max_depth)
        return {
            'path': path,
            'found': len(path) > 0,
            'steps': len(path),
            'source': str(source_id),
            'target': str(target_id),
            'algorithm': 'bfs',
        }

    # ── Query: Dependency Chain ─────────────────────────────────---

    async def find_dependency_chain(self, node_id: UUID, max_depth: int = 5) -> dict:
        """Get the full prerequisite chain for a node.

        Uses TraversalEngine.dependency_chain internally.

        Args:
            node_id: Node UUID.
            max_depth: Maximum chain depth.

        Returns:
            Dict with 'levels', 'depth', 'node_id'.

        """
        if self._traversal is None:
            return {'levels': [], 'depth': 0, 'node_id': str(node_id)}

        chain = await self._traversal.dependency_chain(node_id, max_depth)
        return {
            'levels': chain,
            'depth': len(chain),
            'node_id': str(node_id),
        }

    # ── Query: Reverse Dependency Chain ────────────────────────────

    async def find_reverse_dependency_chain(self, node_id: UUID, max_depth: int = 5) -> dict:
        """Get nodes that depend on this node.

        Uses TraversalEngine.reverse_dependency_chain internally.

        Args:
            node_id: Node UUID.
            max_depth: Maximum chain depth.

        Returns:
            Dict with 'levels', 'depth', 'node_id'.

        """
        if self._traversal is None:
            return {'levels': [], 'depth': 0, 'node_id': str(node_id)}

        chain = await self._traversal.reverse_dependency_chain(node_id, max_depth)
        return {
            'levels': chain,
            'depth': len(chain),
            'node_id': str(node_id),
        }

    # ── Query: Unlock Chain ────────────────────────────────────────

    async def find_unlock_chain(self, node_id: UUID, max_depth: int = 5) -> dict:
        """Find which nodes are unlocked by mastering this node.

        This is essentially the reverse prerequisite chain — nodes whose
        prerequisites include this node and that the learner can now access.

        Args:
            node_id: Node UUID.
            max_depth: Maximum chain depth.

        Returns:
            Dict with 'levels', 'depth', 'node_id'.

        """
        if self._traversal is None:
            return {'levels': [], 'depth': 0, 'node_id': str(node_id)}

        # Use reverse dependency chain as unlock chain
        chain = await self._traversal.reverse_dependency_chain(node_id, max_depth)
        return {
            'levels': chain,
            'depth': len(chain),
            'node_id': str(node_id),
            'query': 'unlock_chain',
        }

    # ── Query: Related Nodes ──────────────────────────────────────

    async def find_related_nodes(
        self,
        node_id: UUID,
        relationship_type: str | None = None,
        max_depth: int = 2,
    ) -> dict:
        """Find nodes related to a given node.

        Uses BFS traversal to find all connected nodes within a radius.

        Args:
            node_id: Center node UUID.
            relationship_type: Optional filter on edge type.
            max_depth: Maximum traversal depth.

        Returns:
            Dict with 'nodes', 'count', 'center_node_id'.

        """
        if self._traversal is None:
            return {'nodes': [], 'count': 0, 'center_node_id': str(node_id)}

        subgraph = await self._traversal.subgraph(node_id, max_depth, relationship_type)

        # Remove the center node from results
        related = [n for n in subgraph.get('nodes', []) if n.get('id') != str(node_id)]
        return {
            'nodes': related,
            'edges': subgraph.get('edges', []),
            'count': len(related),
            'center_node_id': str(node_id),
            'depth': max_depth,
        }

    # ── Query: Common Nodes ────────────────────────────────────────

    async def find_common_nodes(
        self,
        node_id_a: UUID,
        node_id_b: UUID,
        max_depth: int = 3,
    ) -> dict:
        """Find nodes that are common neighbors of two nodes.

        Uses subgraph extraction on both nodes and finds intersection.

        Args:
            node_id_a: First node UUID.
            node_id_b: Second node UUID.
            max_depth: Traversal depth for each neighborhood.

        Returns:
            Dict with 'common_nodes', 'shared_edges', 'count'.

        """
        if self._traversal is None:
            return {'common_nodes': [], 'shared_edges': [], 'count': 0}

        # Get neighborhoods
        subgraph_a = await self._traversal.subgraph(node_id_a, max_depth)
        subgraph_b = await self._traversal.subgraph(node_id_b, max_depth)

        # Find common nodes by ID
        ids_a = {n.get('id') for n in subgraph_a.get('nodes', [])}
        ids_b = {n.get('id') for n in subgraph_b.get('nodes', [])}
        common_ids = ids_a & ids_b

        # Filter out the query nodes themselves
        common_ids.discard(str(node_id_a))
        common_ids.discard(str(node_id_b))

        common_nodes = [n for n in subgraph_a.get('nodes', []) if n.get('id') in common_ids]

        return {
            'common_nodes': common_nodes,
            'count': len(common_nodes),
            'node_a': str(node_id_a),
            'node_b': str(node_id_b),
            'common_ids': list(common_ids),
        }

    # ── Query: Skill Dependencies ──────────────────────────────────

    async def find_skill_dependencies(
        self,
        node_id: UUID,
        max_depth: int = 5,
    ) -> dict:
        """Find skill dependencies for a node.

        Finds the dependency chain and maps skills from each level.

        Args:
            node_id: Node UUID.
            max_depth: Maximum chain depth.

        Returns:
            Dict with 'levels' (each with skills), 'all_skills', 'total_skills'.

        """
        if self._traversal is None or self._knowledge is None:
            return {'levels': [], 'all_skills': [], 'total_skills': 0}

        chain = await self._traversal.dependency_chain(node_id, max_depth)

        levels_with_skills = []
        all_skills: set[str] = set()

        for level_nodes in chain:
            level_with_skills = []
            for node_data in level_nodes:
                try:
                    nid = UUID(node_data['node_id'])
                    skills = await self._knowledge.get_skills_for_node(nid)
                    skill_names = [s.get('name', '') for s in skills if isinstance(s, dict)]
                    all_skills.update(skill_names)
                    level_with_skills.append(
                        {
                            'node_id': node_data['node_id'],
                            'skills': skills,
                            'skill_count': len(skills),
                        },
                    )
                except (ValueError, AttributeError):
                    level_with_skills.append(node_data)
            levels_with_skills.append(level_with_skills)

        return {
            'levels': levels_with_skills,
            'all_skills': sorted(all_skills),
            'total_skills': len(all_skills),
            'node_id': str(node_id),
        }

    # ── Query: Career Dependencies ─────────────────────────────────

    async def find_career_dependencies(
        self,
        career_node_id: UUID,
        max_depth: int = 5,
    ) -> dict:
        """Find all dependencies (prerequisites) for a career.

        Args:
            career_node_id: Career node UUID.
            max_depth: Maximum chain depth.

        Returns:
            Dict with 'levels', 'depth', 'node_id'.

        """
        return await self.find_dependency_chain(career_node_id, max_depth)

    # ── Query: Hidden Relationships ────────────────────────────────

    async def find_hidden_relationships(self, node_id: UUID) -> dict:
        """Find hidden (implicit) relationships for a node.

        Uses KnowledgeEngine to get hidden relationships that were
        derived from shared tags, skills, or content.

        Args:
            node_id: Node UUID.

        Returns:
            Dict with 'relationships', 'count'.

        """
        if self._knowledge is None:
            return {'relationships': [], 'count': 0}

        hidden = await self._knowledge.get_hidden_relationships(node_id)
        cross_domain = await self._knowledge.get_cross_domain_relationships(node_id)

        # Combine and deduplicate
        seen: set[str] = set()
        all_relationships = []
        for rel in hidden + cross_domain:
            key = f'{rel.get("source_id")}:{rel.get("target_id")}:{rel.get("relationship_type")}'
            if key not in seen:
                seen.add(key)
                all_relationships.append(rel)

        return {
            'relationships': all_relationships,
            'count': len(all_relationships),
            'hidden_count': len(hidden),
            'cross_domain_count': len(cross_domain),
            'node_id': str(node_id),
        }

    # ── Query: Reverse Dependencies ────────────────────────────────

    async def find_reverse_dependencies(self, node_id: UUID, max_depth: int = 5) -> dict:
        """Alias for find_reverse_dependency_chain."""
        return await self.find_reverse_dependency_chain(node_id, max_depth)

    # ── Query: Learning Bottlenecks ────────────────────────────────

    async def find_learning_bottlenecks(self, limit: int = 10) -> dict:
        """Find nodes that are learning bottlenecks.

        Bottlenecks are nodes with the highest number of dependents
        (nodes that require them as prerequisites).

        Args:
            limit: Maximum number of bottlenecks to return.

        Returns:
            Dict with 'bottlenecks', 'count'.

        """
        if self._traversal is None or self._graph is None:
            return {'bottlenecks': [], 'count': 0}

        all_nodes = await self._graph.all_nodes()
        bottlenecks: list[dict] = []

        for node in all_nodes:
            try:
                nid = UUID(node['id'])
                dependents = await self._traversal.reverse_dependency_chain(nid, max_depth=2)
                dependent_count = sum(len(level) for level in dependents)
                if dependent_count > 0:
                    bottlenecks.append(
                        {
                            'node_id': str(nid),
                            'title': node.get('title', ''),
                            'dependent_count': dependent_count,
                        },
                    )
            except (ValueError, AttributeError):
                pass

        bottlenecks.sort(key=lambda x: x['dependent_count'], reverse=True)
        top_bottlenecks = bottlenecks[:limit]

        return {
            'bottlenecks': top_bottlenecks,
            'count': len(top_bottlenecks),
            'total_considered': len(all_nodes),
            'limit': limit,
        }

    # ── Query: Orphan Nodes ───────────────────────────────────────

    async def find_orphan_nodes(self) -> dict:
        """Find nodes that have no edges connected to them.

        Uses GraphEngine to check each node's adjacency.

        Returns:
            Dict with 'orphans', 'count', 'total_nodes'.

        """
        if self._graph is None:
            return {'orphans': [], 'count': 0, 'total_nodes': 0}

        all_nodes = await self._graph.all_nodes()
        total_nodes = len(all_nodes)
        orphans: list[dict] = []

        for node in all_nodes:
            try:
                nid = UUID(node['id'])
                neighbors = await self._graph.get_neighbors(nid)
                outgoing = neighbors.get('outgoing', [])
                incoming = neighbors.get('incoming', [])
                if not outgoing and not incoming:
                    orphans.append(node)
            except (ValueError, AttributeError):
                pass

        return {
            'orphans': orphans,
            'count': len(orphans),
            'total_nodes': total_nodes,
        }

    # ── Query: Find Cycles ────────────────────────────────────────

    async def find_cycles(self) -> dict:
        """Find all cycles in the graph using DFS.

        Uses TraversalEngine.has_cycle internally.

        Returns:
            Dict with 'has_cycle' (bool), 'cycle' (path if found).

        """
        if self._traversal is None:
            return {'has_cycle': False, 'cycle': None}

        cycle = await self._traversal.has_cycle()
        return {
            'has_cycle': cycle is not None,
            'cycle': cycle,
            'cycle_length': len(cycle) if cycle else 0,
        }

    # ── Query: Subgraph ──────────────────────────────────────────

    async def find_subgraph(
        self,
        center_node_id: UUID,
        depth: int = 2,
        relationship_type: str | None = None,
    ) -> dict:
        """Extract a subgraph around a center node.

        Uses TraversalEngine.subgraph internally.

        Args:
            center_node_id: Center node UUID.
            depth: Subgraph expansion depth.
            relationship_type: Optional filter on edge type.

        Returns:
            Dict with 'nodes', 'edges', 'center_node_id', 'depth'.

        """
        if self._traversal is None:
            return {'nodes': [], 'edges': [], 'center_node_id': str(center_node_id), 'depth': depth}

        subgraph_result = await self._traversal.subgraph(center_node_id, depth, relationship_type)
        subgraph_result['query'] = 'subgraph'
        return subgraph_result

    # ── Event Subscriptions ────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        await super().subscribe_events(event_bus)
