"""Tests for GraphTraversalService — BFS, DFS, shortest path, chains.

These tests mock the UnitOfWork and GraphRepository to verify
algorithm correctness without requiring a database.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.graph.traversal import GraphTraversalService

# ── Fixtures ───────────────────────────────────────────────────────


@pytest.fixture
def mock_uow():
    """Create a mock UnitOfWork with a mock graph repository."""
    uow = MagicMock()
    uow.graph = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    return uow


@pytest.fixture
def traversal_service(mock_uow):
    """Create a GraphTraversalService with a mock UoW."""
    return GraphTraversalService(mock_uow)


def _make_node(
    node_id=None,
    slug='test-node',
    title='Test Node',
    description='A test node',
    node_type='concept',
    difficulty='beginner',
):
    """Helper to create a mock node."""
    node = MagicMock()
    node.id = node_id or uuid4()
    node.slug = slug
    node.title = title
    node.description = description
    node_type_mock = MagicMock()
    node_type_mock.value = node_type
    node.node_type = node_type_mock
    diff_mock = MagicMock()
    diff_mock.value = difficulty
    node.difficulty = diff_mock
    node.icon = None
    node.color = None
    node.estimated_minutes = 30
    return node


def _make_edge(
    edge_id=None,
    source_id=None,
    target_id=None,
    relationship_type='prerequisite',
    direction='forward',
):
    """Helper to create a mock edge."""
    edge = MagicMock()
    edge.id = edge_id or uuid4()
    edge.source_node_id = source_id or uuid4()
    edge.target_node_id = target_id or uuid4()
    rel_type_mock = MagicMock()
    rel_type_mock.value = relationship_type
    edge.relationship_type = rel_type_mock
    dir_mock = MagicMock()
    dir_mock.value = direction
    edge.direction = dir_mock
    return edge


def _mock_page_result(items):
    """Helper to create a PageResult-like mock."""
    result = MagicMock()
    result.items = items
    result.total = len(items)
    result.page = 1
    result.per_page = 20
    result.pages = 1
    return result


# ── BFS Tests ──────────────────────────────────────────────────────


class TestBFS:
    """Test BFS traversal."""

    @pytest.mark.asyncio
    async def test_bfs_single_level(self, traversal_service, mock_uow) -> None:
        """Test BFS returns immediate neighbors."""
        node_a = uuid4()
        node_b = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)

        mock_uow.graph.load_outgoing_edges.return_value = _mock_page_result([edge_ab])

        result = await traversal_service.bfs(start_node_id=node_a, max_depth=1)

        assert len(result) == 1
        assert result[0]['node_id'] == str(node_b)
        assert result[0]['depth'] == 1
        assert result[0]['parent_id'] == str(node_a)

    @pytest.mark.asyncio
    async def test_bfs_respects_max_depth(self, traversal_service, mock_uow) -> None:
        """Test BFS respects max_depth parameter."""
        node_a = uuid4()
        node_b = uuid4()
        node_c = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)
        edge_bc = _make_edge(source_id=node_b, target_id=node_c)

        def load_edges_side_effect(nid, **_kwargs):
            if nid == node_a:
                return _mock_page_result([edge_ab])
            if nid == node_b:
                return _mock_page_result([edge_bc])
            return _mock_page_result([])

        mock_uow.graph.load_outgoing_edges = AsyncMock(side_effect=load_edges_side_effect)

        result = await traversal_service.bfs(start_node_id=node_a, max_depth=1)

        assert len(result) == 1  # Only node_b, node_c is beyond max_depth
        assert result[0]['node_id'] == str(node_b)

    @pytest.mark.asyncio
    async def test_bfs_avoids_cycles(self, traversal_service, mock_uow) -> None:
        """Test BFS avoids revisiting nodes in a cycle."""
        node_a = uuid4()
        node_b = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)
        edge_ba = _make_edge(source_id=node_b, target_id=node_a, relationship_type='related_to')

        def load_edges_side_effect(nid, **_kwargs):
            if nid == node_a:
                return _mock_page_result([edge_ab])
            if nid == node_b:
                return _mock_page_result([edge_ba])
            return _mock_page_result([])

        mock_uow.graph.load_outgoing_edges = AsyncMock(side_effect=load_edges_side_effect)

        result = await traversal_service.bfs(start_node_id=node_a, max_depth=3)

        node_ids = [r['node_id'] for r in result]
        assert len(node_ids) == len(set(node_ids))  # No duplicates
        assert str(node_b) in node_ids

    @pytest.mark.asyncio
    async def test_bfs_filters_by_type(self, traversal_service, mock_uow) -> None:
        """Test BFS filters edges by relationship_type."""
        node_a = uuid4()
        mock_uow.graph.load_outgoing_edges.return_value = _mock_page_result([])

        await traversal_service.bfs(
            start_node_id=node_a,
            max_depth=3,
            relationship_type='prerequisite',
        )

        mock_uow.graph.load_outgoing_edges.assert_called_with(
            node_a,
            relationship_type='prerequisite',
            page=1,
            per_page=500,
        )


# ── DFS Tests ──────────────────────────────────────────────────────


class TestDFS:
    """Test DFS traversal."""

    @pytest.mark.asyncio
    async def test_dfs_returns_nodes(self, traversal_service, mock_uow) -> None:
        """Test DFS returns nodes in depth-first order."""
        node_a = uuid4()
        node_b = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)

        mock_uow.graph.load_outgoing_edges.return_value = _mock_page_result([edge_ab])

        result = await traversal_service.dfs(start_node_id=node_a, max_depth=3)

        assert len(result) >= 1
        assert any(r['node_id'] == str(node_b) for r in result)

    @pytest.mark.asyncio
    async def test_dfs_respects_max_depth(self, traversal_service, mock_uow) -> None:
        """Test DFS respects max_depth."""
        node_a = uuid4()
        node_b = uuid4()
        node_c = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)

        def load_edges_side_effect(nid, **_kwargs):
            if nid == node_a:
                return _mock_page_result([edge_ab])
            if nid == node_b:
                edge_bc = _make_edge(source_id=nid, target_id=node_c)
                return _mock_page_result([edge_bc])
            return _mock_page_result([])

        mock_uow.graph.load_outgoing_edges = AsyncMock(side_effect=load_edges_side_effect)

        result = await traversal_service.dfs(start_node_id=node_a, max_depth=0)

        assert len(result) == 0  # max_depth=0 means no traversal


# ── Shortest Path Tests ────────────────────────────────────────────


class TestShortestPath:
    """Test shortest_learning_path algorithm."""

    @pytest.mark.asyncio
    async def test_shortest_path_direct(self, traversal_service, mock_uow) -> None:
        """Test shortest path between directly connected nodes."""
        node_a = uuid4()
        node_b = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)

        mock_uow.graph.load_outgoing_edges.return_value = _mock_page_result([edge_ab])

        result = await traversal_service.shortest_learning_path(
            source_id=node_a,
            target_id=node_b,
        )

        assert len(result) >= 2  # a -> b
        assert result[-1]['node_id'] == str(node_b)

    @pytest.mark.asyncio
    async def test_shortest_path_multihop(self, traversal_service, mock_uow) -> None:
        """Test shortest path through multiple hops."""
        node_a = uuid4()
        node_b = uuid4()
        node_c = uuid4()
        node_d = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)
        edge_bc = _make_edge(source_id=node_b, target_id=node_c)
        edge_cd = _make_edge(source_id=node_c, target_id=node_d)

        def load_edges_side_effect(nid, **_kwargs):
            mapping = {node_a: [edge_ab], node_b: [edge_bc], node_c: [edge_cd]}
            edges = mapping.get(nid, [])
            return _mock_page_result(edges)

        mock_uow.graph.load_outgoing_edges = AsyncMock(side_effect=load_edges_side_effect)

        result = await traversal_service.shortest_learning_path(
            source_id=node_a,
            target_id=node_d,
            max_depth=10,
        )

        assert len(result) >= 3
        assert result[-1]['node_id'] == str(node_d)
        # Verify path order: a -> b -> c -> d
        node_ids = [r['node_id'] for r in result]
        assert node_ids.index(str(node_a)) < node_ids.index(str(node_b))
        assert node_ids.index(str(node_b)) < node_ids.index(str(node_d))

    @pytest.mark.asyncio
    async def test_no_path_exists(self, traversal_service, mock_uow) -> None:
        """Test returns empty list when no path exists."""
        node_a = uuid4()
        node_b = uuid4()
        node_c = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)

        def load_edges_side_effect(nid, **_kwargs):
            if nid == node_a:
                return _mock_page_result([edge_ab])
            return _mock_page_result([])

        mock_uow.graph.load_outgoing_edges = AsyncMock(side_effect=load_edges_side_effect)

        result = await traversal_service.shortest_learning_path(
            source_id=node_a,
            target_id=node_c,
            max_depth=3,
        )

        assert result == []

    @pytest.mark.asyncio
    async def test_same_node_returns_empty(self, traversal_service, mock_uow) -> None:  # noqa: ARG002
        """Test returns empty when source equals target."""
        node_a = uuid4()

        result = await traversal_service.shortest_learning_path(
            source_id=node_a,
            target_id=node_a,
        )

        assert result == []


# ── Prerequisite Chain Tests ───────────────────────────────────────


class TestPrerequisiteChain:
    """Test prerequisite_chain algorithm."""

    @pytest.mark.asyncio
    async def test_prerequisite_chain_single_level(self, traversal_service, mock_uow) -> None:
        """Test chain returns direct prerequisites."""
        node_a = uuid4()
        node_b = uuid4()
        node_b_obj = _make_node(node_b)
        mock_uow.graph.load_prerequisites.return_value = [node_b_obj]

        result = await traversal_service.prerequisite_chain(
            node_id=node_a,
            max_depth=1,
        )

        assert len(result) == 1
        level_0 = result[0]
        assert any(n['id'] == str(node_b) for n in level_0)

    @pytest.mark.asyncio
    async def test_prerequisite_chain_multilevel(self, traversal_service, mock_uow) -> None:
        """Test chain traverses multiple prerequisite levels."""
        node_a = uuid4()
        node_b = uuid4()
        node_c = uuid4()
        node_b_obj = _make_node(node_b)
        node_c_obj = _make_node(node_c)

        def load_prereqs_side_effect(nid):
            if nid == node_a:
                return [node_b_obj]
            if nid == node_b:
                return [node_c_obj]
            return []

        mock_uow.graph.load_prerequisites = AsyncMock(
            side_effect=load_prereqs_side_effect,
        )

        result = await traversal_service.prerequisite_chain(
            node_id=node_a,
            max_depth=3,
        )

        assert len(result) >= 2  # Two levels of prerequisites

    @pytest.mark.asyncio
    async def test_prerequisite_no_prereqs(self, traversal_service, mock_uow) -> None:
        """Test chain returns empty when no prerequisites exist."""
        mock_uow.graph.load_prerequisites.return_value = []

        result = await traversal_service.prerequisite_chain(
            node_id=uuid4(),
            max_depth=3,
        )

        assert result == []


# ── Dependent Chain Tests ──────────────────────────────────────────


class TestDependentChain:
    """Test dependent_chain algorithm."""

    @pytest.mark.asyncio
    async def test_dependent_chain(self, traversal_service, mock_uow) -> None:
        """Test dependent chain returns nodes that depend on this node."""
        node_a = uuid4()
        node_b = uuid4()
        node_b_obj = _make_node(node_b)

        mock_uow.graph.load_dependents.return_value = [node_b_obj]

        result = await traversal_service.dependent_chain(
            node_id=node_a,
            max_depth=1,
        )

        assert len(result) == 1
        assert any(n['id'] == str(node_b) for n in result[0])


# ── Neighbors Tests ────────────────────────────────────────────────


class TestNeighbors:
    """Test neighbors_at_depth."""

    @pytest.mark.asyncio
    async def test_neighbors_returns_outgoing_incoming(self, traversal_service, mock_uow) -> None:
        """Test neighbors returns both outgoing and incoming."""
        node_a = uuid4()
        node_b = uuid4()
        node_b_obj = _make_node(node_b)
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)

        mock_uow.graph.load_all_neighbors.return_value = {
            'outgoing': [node_b_obj],
            'incoming': [],
        }
        mock_uow.graph.load_edges_for_nodes.return_value = [edge_ab]
        mock_uow.graph.load_edge_types_for_node.return_value = [
            {'relationship_type': 'prerequisite', 'count': 1},
        ]

        result = await traversal_service.neighbors_at_depth(node_id=node_a, depth=1)

        assert 'outgoing' in result
        assert 'incoming' in result
        assert 'edges' in result
        assert 'edge_type_counts' in result
        assert len(result['outgoing']) == 1
        assert result['outgoing'][0]['id'] == str(node_b)


# ── Subgraph Extraction Tests ──────────────────────────────────────


class TestSubgraph:
    """Test extract_subgraph."""

    @pytest.mark.asyncio
    async def test_extract_subgraph_returns_nodes_edges(self, traversal_service, mock_uow) -> None:
        """Test subgraph returns nodes, edges, and center."""
        node_a = uuid4()
        node_b = uuid4()
        edge_ab = _make_edge(source_id=node_a, target_id=node_b)
        node_a_obj = _make_node(node_a)
        node_b_obj = _make_node(node_b)

        mock_uow.graph.load_outgoing_edges.return_value = _mock_page_result([edge_ab])
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(
            side_effect={
                node_a: node_a_obj,
                node_b: node_b_obj,
            }.get,
        )

        result = await traversal_service.extract_subgraph(
            center_node_id=node_a,
            depth=1,
        )

        assert 'nodes' in result
        assert 'edges' in result
        assert result['center_node_id'] == str(node_a)
        assert len(result['edges']) == 1
        assert len(result['nodes']) == 2  # center + neighbor
