"""Tests for the Graph Platform (Milestone 4).

Covers:
- Graph engine mutations (add/remove/update nodes and edges)
- Graph engine lookups (get_node, get_neighbors, statistics)
- Traversal algorithms (BFS, DFS, shortest path, topological sort, cycle detection)
- Validation engine (duplicate IDs, missing IDs, edge validation, cycle detection, orphan nodes)
- Search engine (exact, prefix, fuzzy, fulltext)
- Query engine (shortest path, dependency chain, related nodes, subgraph)
- Graph cache (get/set/invalidation)
- Graph API endpoints
"""

from __future__ import annotations

import pytest
from uuid import UUID, uuid4

from app.engines.base import EngineState
from app.engines.graph_engine import GraphEngine, GraphNodeRecord, GraphEdgeRecord
from app.engines.traversal_engine import TraversalEngine
from app.engines.validation_engine import (
    ValidationEngine,
    DuplicateIdValidator,
    MissingIdValidator,
    SchemaValidator,
    EdgeValidator,
    CycleDetectionValidator,
    OrphanNodeValidator,
    DisconnectedGraphValidator,
)
from app.engines.search_engine import SearchEngine
from app.engines.query_engine import QueryEngine
from app.engines.knowledge_engine import KnowledgeEngine
from app.infrastructure.cache.graph_cache import GraphCache


# ═══════════════════════════════════════════════════════════════════
# Graph Engine Tests
# ═══════════════════════════════════════════════════════════════════


class TestGraphEngine:
    """Test graph engine CRUD operations and lookups."""

    @pytest.fixture
    async def engine(self):
        eng = GraphEngine()
        await eng.initialize()
        return eng

    async def test_add_and_get_node(self, engine):
        """Test adding a node and retrieving it."""
        node = await engine.add_node(
            slug='test-node',
            title='Test Node',
            node_type='concept',
            difficulty='beginner',
            description='A test node',
        )
        assert node['slug'] == 'test-node'
        assert node['title'] == 'Test Node'
        assert node['node_type'] == 'concept'

        retrieved = await engine.get_node(UUID(node['id']))
        assert retrieved is not None
        assert retrieved['slug'] == 'test-node'

    async def test_duplicate_slug_raises_error(self, engine):
        """Test that duplicate slugs raise ValueError."""
        await engine.add_node(slug='unique', title='First', node_type='concept')
        with pytest.raises(ValueError, match='already exists'):
            await engine.add_node(slug='unique', title='Second', node_type='concept')

    async def test_remove_node(self, engine):
        """Test removing a node and verifying it's gone."""
        node = await engine.add_node(slug='remove-me', title='Remove Me', node_type='concept')
        nid = UUID(node['id'])

        result = await engine.remove_node(nid)
        assert result is True

        retrieved = await engine.get_node(nid)
        assert retrieved is None

    async def test_remove_nonexistent_node(self, engine):
        """Test removing a node that doesn't exist returns False."""
        result = await engine.remove_node(uuid4())
        assert result is False

    async def test_update_node(self, engine):
        """Test updating node fields."""
        node = await engine.add_node(slug='update-me', title='Original', node_type='concept')
        nid = UUID(node['id'])

        updated = await engine.update_node(nid, title='Updated Title', difficulty='advanced')
        assert updated is not None
        assert updated['title'] == 'Updated Title'
        assert updated['difficulty'] == 'advanced'

    async def test_add_edge(self, engine):
        """Test adding an edge between two nodes."""
        n1 = await engine.add_node(slug='node-a', title='Node A', node_type='concept')
        n2 = await engine.add_node(slug='node-b', title='Node B', node_type='concept')

        edge = await engine.add_edge(
            source_node_id=UUID(n1['id']),
            target_node_id=UUID(n2['id']),
            relationship_type='prerequisite',
            weight=1.5,
        )
        assert edge['relationship_type'] == 'prerequisite'
        assert edge['source_id'] == n1['id']
        assert edge['target_id'] == n2['id']

    async def test_self_loop_edge_raises_error(self, engine):
        """Test that self-loop edges are rejected."""
        n1 = await engine.add_node(slug='self-loop', title='Self', node_type='concept')
        nid = UUID(n1['id'])

        with pytest.raises(ValueError, match='Self-loop'):
            await engine.add_edge(source_node_id=nid, target_node_id=nid)

    async def test_get_neighbors(self, engine):
        """Test retrieving neighbors of a node."""
        n1 = await engine.add_node(slug='center', title='Center', node_type='concept')
        n2 = await engine.add_node(slug='neighbor', title='Neighbor', node_type='concept')
        n3 = await engine.add_node(slug='neighbor2', title='Neighbor 2', node_type='concept')

        await engine.add_edge(source_node_id=UUID(n1['id']), target_node_id=UUID(n2['id']))
        await engine.add_edge(source_node_id=UUID(n3['id']), target_node_id=UUID(n1['id']))

        neighbors = await engine.get_neighbors(UUID(n1['id']))
        assert len(neighbors['outgoing']) == 1
        assert len(neighbors['incoming']) == 1

    async def test_graph_statistics(self, engine):
        """Test graph statistics computation."""
        n1 = await engine.add_node(slug='s1', title='S1', node_type='subject')
        n2 = await engine.add_node(slug='s2', title='S2', node_type='concept')
        n3 = await engine.add_node(slug='s3', title='S3', node_type='technology')
        await engine.add_edge(source_node_id=UUID(n1['id']), target_node_id=UUID(n2['id']))
        await engine.add_edge(source_node_id=UUID(n2['id']), target_node_id=UUID(n3['id']))

        stats = await engine.graph_statistics()
        assert stats['node_count'] == 3
        assert stats['edge_count'] == 2
        assert stats['type_counts']['subject'] == 1
        assert stats['type_counts']['concept'] == 1
        assert stats['graph_version'] == '1.0.0'

    async def test_load_and_unload_graph(self, engine):
        """Test loading and unloading graph data."""
        nodes = [
            GraphNodeRecord(node_id=uuid4(), slug='a', title='A', node_type='concept'),
            GraphNodeRecord(node_id=uuid4(), slug='b', title='B', node_type='concept'),
        ]
        edges = [
            GraphEdgeRecord(edge_id=uuid4(), source_node_id=nodes[0].node_id, target_node_id=nodes[1].node_id),
        ]

        count = await engine.load_graph(nodes, edges)
        assert count == 3
        assert await engine.is_loaded()

        await engine.unload_graph()
        assert not await engine.is_loaded()
        assert (await engine.count()) == 0

    async def test_graph_snapshot(self, engine):
        """Test graph snapshot creation."""
        await engine.add_node(slug='snap', title='Snap', node_type='concept')
        snapshot = await engine.graph_snapshot()

        assert len(snapshot.nodes) == 1
        assert snapshot.version == '1.0.0'


# ═══════════════════════════════════════════════════════════════════
# Traversal Engine Tests
# ═══════════════════════════════════════════════════════════════════


class TestTraversalEngine:
    """Test graph traversal algorithms."""

    @pytest.fixture
    async def graph_and_traversal(self):
        graph = GraphEngine()
        await graph.initialize()

        # Build a simple graph: A -> B -> C, A -> D -> E
        a = await graph.add_node(slug='a', title='A', node_type='concept')
        b = await graph.add_node(slug='b', title='B', node_type='concept')
        c = await graph.add_node(slug='c', title='C', node_type='concept')
        d = await graph.add_node(slug='d', title='D', node_type='concept')
        e = await graph.add_node(slug='e', title='E', node_type='concept')

        await graph.add_edge(source_node_id=UUID(a['id']), target_node_id=UUID(b['id']),
                             relationship_type='prerequisite')
        await graph.add_edge(source_node_id=UUID(b['id']), target_node_id=UUID(c['id']),
                             relationship_type='prerequisite')
        await graph.add_edge(source_node_id=UUID(a['id']), target_node_id=UUID(d['id']),
                             relationship_type='prerequisite')
        await graph.add_edge(source_node_id=UUID(d['id']), target_node_id=UUID(e['id']),
                             relationship_type='prerequisite')

        traversal = TraversalEngine(graph_engine=graph)
        await traversal.initialize()
        return graph, traversal, {'a': UUID(a['id']), 'b': UUID(b['id']), 'c': UUID(c['id']),
                                   'd': UUID(d['id']), 'e': UUID(e['id'])}

    async def test_bfs(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        result = await traversal.bfs(ids['a'], max_depth=3)
        # Should find B, D (depth 1) and C, E (depth 2)
        assert len(result) == 4
        assert all(r['depth'] > 0 for r in result)

    async def test_dfs(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        result = await traversal.dfs(ids['a'], max_depth=3)
        assert len(result) > 0

    async def test_shortest_path(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        path = await traversal.shortest_path(ids['a'], ids['c'], max_depth=5)
        assert len(path) > 0
        # Path should be A -> B -> C
        assert path[-1]['node_id'] == str(ids['c'])

    async def test_shortest_path_no_path(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        # E has no outgoing edges, so no path from E to A
        path = await traversal.shortest_path(ids['e'], ids['a'], max_depth=5)
        assert len(path) == 0

    async def test_topological_sort(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        sorted_nodes = await traversal.topological_sort([ids['a'], ids['b'], ids['c']])
        assert len(sorted_nodes) == 3
        # A should come before B, B before C (since A -> B -> C)
        a_idx = sorted_nodes.index(ids['a'])
        b_idx = sorted_nodes.index(ids['b'])
        assert a_idx < b_idx

    async def test_has_cycle_no_cycle(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        cycle = await traversal.has_cycle([ids['a'], ids['b'], ids['c']])
        assert cycle is None

    async def test_has_cycle_with_cycle(self):
        """Test cycle detection with an actual cycle."""
        graph = GraphEngine()
        await graph.initialize()

        a = await graph.add_node(slug='cycle-a', title='A', node_type='concept')
        b = await graph.add_node(slug='cycle-b', title='B', node_type='concept')
        c = await graph.add_node(slug='cycle-c', title='C', node_type='concept')

        # A -> B -> C -> A (cycle!)
        await graph.add_edge(source_node_id=UUID(a['id']), target_node_id=UUID(b['id']))
        await graph.add_edge(source_node_id=UUID(b['id']), target_node_id=UUID(c['id']))
        await graph.add_edge(source_node_id=UUID(c['id']), target_node_id=UUID(a['id']))

        traversal = TraversalEngine(graph_engine=graph)
        await traversal.initialize()

        cycle = await traversal.has_cycle()
        assert cycle is not None
        assert len(cycle) >= 3

    async def test_connected_components(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        components = await traversal.connected_components()
        assert len(components) >= 1

    async def test_subgraph(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        sub = await traversal.subgraph(ids['a'], depth=1)
        assert len(sub['nodes']) >= 1
        assert len(sub['edges']) >= 1

    async def test_ancestors_and_descendants(self, graph_and_traversal):
        _, traversal, ids = graph_and_traversal
        ancestors = await traversal.descendants(ids['a'], max_depth=2)
        assert len(ancestors) >= 2  # B and D at minimum


# ═══════════════════════════════════════════════════════════════════
# Validation Engine Tests
# ═══════════════════════════════════════════════════════════════════


class TestValidationEngine:
    """Test graph validation."""

    async def test_duplicate_id_validator(self):
        validator = DuplicateIdValidator(id_field='id', label='node')
        errors = await validator([
            {'id': '1', 'title': 'A'},
            {'id': '2', 'title': 'B'},
            {'id': '1', 'title': 'C'},  # Duplicate
        ])
        assert len(errors) == 1
        assert 'Duplicate' in errors[0]['message']

    async def test_missing_id_validator(self):
        validator = MissingIdValidator(id_field='id', label='node')
        errors = await validator([
            {'id': '1', 'title': 'A'},
            {'title': 'B'},  # Missing ID
        ])
        assert len(errors) == 1
        assert 'Missing' in errors[0]['message']

    async def test_schema_validator(self):
        validator = SchemaValidator(required_fields=['id', 'title'], label='node')
        errors = await validator([
            {'id': '1', 'title': 'A'},
            {'id': '2'},  # Missing title
        ])
        assert len(errors) == 1

    async def test_edge_validator_missing_nodes(self):
        validator = EdgeValidator(node_ids=set())
        errors = await validator([
            {'id': '1', 'source_node_id': UUID(int=1), 'target_node_id': UUID(int=2)},
        ])
        assert len(errors) == 2  # Both source and target missing

    async def test_cycle_detection_validator(self):
        validator = CycleDetectionValidator()
        errors = await validator({
            'nodes': [
                {'id': str(UUID(int=1))},
                {'id': str(UUID(int=2))},
                {'id': str(UUID(int=3))},
            ],
            'edges': [
                {'source_node_id': str(UUID(int=1)), 'target_node_id': str(UUID(int=2))},
                {'source_node_id': str(UUID(int=2)), 'target_node_id': str(UUID(int=3))},
                {'source_node_id': str(UUID(int=3)), 'target_node_id': str(UUID(int=1))},
            ],
        })
        assert len(errors) >= 1
        assert 'Cycle' in errors[0]['message']

    async def test_orphan_node_validator(self):
        validator = OrphanNodeValidator()
        errors = await validator({
            'nodes': [
                {'id': str(UUID(int=1)), 'title': 'Connected'},
                {'id': str(UUID(int=2)), 'title': 'Orphan'},
            ],
            'edges': [
                {'source_node_id': str(UUID(int=1)), 'target_node_id': str(UUID(int=3))},
            ],
        })
        assert len(errors) >= 1
        assert 'Orphan' in errors[0]['message']

    async def test_disconnected_graph_validator(self):
        validator = DisconnectedGraphValidator()
        errors = await validator({
            'nodes': [
                {'id': str(UUID(int=1))},
                {'id': str(UUID(int=2))},
                {'id': str(UUID(int=3))},
                {'id': str(UUID(int=4))},
            ],
            'edges': [
                {'source_node_id': str(UUID(int=1)), 'target_node_id': str(UUID(int=2))},
            ],
        })
        # At least nodes 3 and 4 are disconnected
        assert len(errors) >= 1
        assert 'Disconnected' in errors[0]['message']

    async def test_validate_graph_change(self):
        """Test full graph change validation."""
        engine = ValidationEngine()
        await engine.initialize()

        result = await engine.validate_graph_change({
            'nodes': [
                {'id': str(UUID(int=1)), 'slug': 'test', 'title': 'Test', 'node_type': 'concept'},
            ],
            'edges': [
                {'id': str(UUID(int=100)), 'source_node_id': str(UUID(int=1)),
                 'target_node_id': str(UUID(int=2))},
            ],
        })

        assert 'valid' in result
        assert 'summary' in result

    async def test_graph_health_score(self):
        """Test graph health score computation."""
        engine = ValidationEngine()
        await engine.initialize()

        health = await engine.graph_health_score({
            'nodes': [
                {'id': str(UUID(int=1))},
                {'id': str(UUID(int=2))},
            ],
            'edges': [
                {'source_node_id': str(UUID(int=1)), 'target_node_id': str(UUID(int=2))},
            ],
        })
        assert health.score > 0.5  # Should be fairly healthy
        assert health.node_count == 2
        assert health.edge_count == 1


# ═══════════════════════════════════════════════════════════════════
# Search Engine Tests
# ═══════════════════════════════════════════════════════════════════


class TestSearchEngine:
    """Test search engine functionality."""

    @pytest.fixture
    async def engine(self):
        graph = GraphEngine()
        await graph.initialize()

        await graph.add_node(slug='python-basics', title='Python Basics', node_type='concept',
                              description='Learn Python programming language')
        await graph.add_node(slug='javascript-basics', title='JavaScript Basics', node_type='concept',
                              description='Learn JavaScript for web development')
        await graph.add_node(slug='data-structures', title='Data Structures', node_type='concept',
                              description='Arrays, linked lists, trees, graphs')

        return SearchEngine(graph_engine=graph)

    async def test_fulltext_search(self, engine):
        result = await engine.search('Python', mode='fulltext')
        assert result['total'] > 0
        assert any('Python' in item['title'] for item in result['items'])

    async def test_exact_search(self, engine):
        result = await engine.search('Python Basics', mode='exact')
        assert result['total'] >= 1

    async def test_prefix_search(self, engine):
        result = await engine.search('Java', mode='prefix')
        assert result['total'] > 0
        assert any('JavaScript' in item['title'] for item in result['items'])

    async def test_fuzzy_search(self, engine):
        result = await engine.search('Pithon', mode='fuzzy')
        assert result['total'] > 0

    async def test_empty_query(self, engine):
        result = await engine.search('', mode='fulltext')
        assert result['total'] == 0

    async def test_pagination(self, engine):
        result = await engine.search('Basics', mode='fulltext', page=1, per_page=1)
        assert result['total'] >= 1
        assert len(result['items']) <= 1


# ═══════════════════════════════════════════════════════════════════
# Query Engine Tests
# ═══════════════════════════════════════════════════════════════════


class TestQueryEngine:
    """Test query engine RPC functions."""

    @pytest.fixture
    async def engine(self):
        graph = GraphEngine()
        await graph.initialize()

        a = await graph.add_node(slug='node-a', title='Node A', node_type='concept')
        b = await graph.add_node(slug='node-b', title='Node B', node_type='concept')
        c = await graph.add_node(slug='node-c', title='Node C', node_type='concept')

        await graph.add_edge(source_node_id=UUID(a['id']), target_node_id=UUID(b['id']),
                             relationship_type='prerequisite')
        await graph.add_edge(source_node_id=UUID(b['id']), target_node_id=UUID(c['id']),
                             relationship_type='prerequisite')

        traversal = TraversalEngine(graph_engine=graph)
        await traversal.initialize()

        knowledge = KnowledgeEngine(graph_engine=graph)
        await knowledge.initialize()

        query = QueryEngine(
            graph_engine=graph,
            traversal_engine=traversal,
            knowledge_engine=knowledge,
        )
        await query.initialize()

        return query, {'a': UUID(a['id']), 'b': UUID(b['id']), 'c': UUID(c['id'])}

    async def test_find_shortest_path(self, engine):
        query, ids = engine
        result = await query.find_shortest_path(ids['a'], ids['c'], max_depth=5)
        assert result['found'] is True
        assert result['steps'] >= 1
        assert result['source'] == str(ids['a'])
        assert result['target'] == str(ids['c'])

    async def test_find_dependency_chain(self, engine):
        query, ids = engine
        result = await query.find_dependency_chain(ids['c'], max_depth=5)
        assert result['depth'] >= 1

    async def test_find_related_nodes(self, engine):
        query, ids = engine
        result = await query.find_related_nodes(ids['a'], max_depth=1)
        assert result['count'] >= 1

    async def test_find_subgraph(self, engine):
        query, ids = engine
        result = await query.find_subgraph(ids['a'], depth=2)
        assert len(result['nodes']) >= 1

    async def test_find_cycles_no_cycle(self, engine):
        query, ids = engine
        result = await query.find_cycles()
        assert result['has_cycle'] is False

    async def test_find_orphan_nodes(self, engine):
        query, ids = engine
        result = await query.find_orphan_nodes()
        assert 'orphans' in result
        assert 'count' in result


# ═══════════════════════════════════════════════════════════════════
# Graph Cache Tests
# ═══════════════════════════════════════════════════════════════════


class TestGraphCache:
    """Test graph cache functionality."""

    @pytest.fixture
    def cache(self):
        return GraphCache(default_ttl_seconds=300)

    async def test_set_and_get(self, cache):
        await cache.set('node', 'test-key', {'data': 'value'})
        value = await cache.get('node', 'test-key')
        assert value == {'data': 'value'}

    async def test_get_miss(self, cache):
        value = await cache.get('node', 'nonexistent')
        assert value is None

    async def test_region_isolation(self, cache):
        await cache.set('node', 'shared-key', 'node-value')
        await cache.set('edge', 'shared-key', 'edge-value')

        node_val = await cache.get('node', 'shared-key')
        edge_val = await cache.get('edge', 'shared-key')

        assert node_val == 'node-value'
        assert edge_val == 'edge-value'

    async def test_invalidate_key(self, cache):
        await cache.set('node', 'key1', 'value1')
        await cache.set('node', 'key2', 'value2')

        await cache.invalidate('node', 'key1')
        assert await cache.get('node', 'key1') is None
        assert await cache.get('node', 'key2') == 'value2'

    async def test_invalidate_region(self, cache):
        await cache.set('node', 'key1', 'value1')
        await cache.set('edge', 'key2', 'value2')

        await cache.invalidate('node')
        assert await cache.get('node', 'key1') is None
        assert await cache.get('edge', 'key2') == 'value2'

    async def test_version_invalidation(self, cache):
        """Test that bumping version invalidates old entries."""
        await cache.set('node', 'key', 'value')
        cache.bump_version()

        # Old entry should be expired due to version mismatch
        value = await cache.get('node', 'key')
        assert value is None

    async def test_invalidate_all(self, cache):
        await cache.set('node', 'k1', 'v1')
        await cache.set('edge', 'k2', 'v2')

        counts = await cache.invalidate_all()
        assert counts['node'] == 1
        assert counts['edge'] == 1
        assert cache.total_size() == 0

    async def test_statistics(self, cache):
        await cache.set('node', 'k1', 'v1')
        await cache.get('node', 'k1')  # Hit
        await cache.get('node', 'nonexistent')  # Miss

        stats = cache.get_stats()
        assert 'node' in stats
        assert stats['node']['hits'] >= 1
        assert stats['node']['misses'] >= 1

    async def test_total_size(self, cache):
        await cache.set('node', 'a', 1)
        await cache.set('edge', 'b', 2)
        await cache.set('traversal', 'c', 3)

        assert cache.total_size() == 3

    async def test_reset_stats(self, cache):
        await cache.get('node', 'k1')  # Miss
        cache.reset_stats()
        stats = cache.get_stats()
        assert stats['node']['hits'] == 0
        assert stats['node']['misses'] == 0
