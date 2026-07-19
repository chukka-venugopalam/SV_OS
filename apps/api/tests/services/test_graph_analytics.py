"""Tests for GraphAnalyticsService — centrality, bottlenecks, density.

These tests mock the UnitOfWork and repository layer to verify
analytics algorithm correctness without requiring a database.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.graph.analytics import GraphAnalyticsService

# ── Fixtures ───────────────────────────────────────────────────────


@pytest.fixture
def mock_uow():
    """Create a mock UnitOfWork."""
    uow = MagicMock()
    uow.graph = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    uow.knowledge_edges = AsyncMock()
    uow.session = AsyncMock()
    return uow


@pytest.fixture
def analytics_service(mock_uow):
    """Create a GraphAnalyticsService with a mock UoW."""
    return GraphAnalyticsService(mock_uow)


# ── Degree Centrality Tests ────────────────────────────────────────


class TestDegreeCentrality:
    """Test degree_centrality."""

    @pytest.mark.asyncio
    async def test_degree_centrality_executes_query(self, analytics_service, mock_uow) -> None:
        """Test degree centrality calls the database."""
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        result = await analytics_service.degree_centrality(limit=20)

        assert isinstance(result, list)
        mock_uow.session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_degree_centrality_returns_ranked_results(
        self, analytics_service, mock_uow
    ) -> None:
        """Test degree centrality returns properly formatted results."""
        row1 = MagicMock()
        row1.id = uuid4()
        row1.title = 'Node A'
        row1.slug = 'node-a'
        type_mock = MagicMock()
        type_mock.value = 'concept'
        row1.node_type = type_mock
        diff_mock = MagicMock()
        diff_mock.value = 'beginner'
        row1.difficulty = diff_mock
        row1.total_connections = 10

        mock_result = MagicMock()
        mock_result.all.return_value = [row1]
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        result = await analytics_service.degree_centrality(limit=5)

        assert len(result) == 1
        assert result[0]['title'] == 'Node A'
        assert result[0]['total_connections'] == 10


# ── Isolated Nodes Tests ──────────────────────────────────────────


class TestIsolatedNodes:
    """Test isolated_nodes."""

    @pytest.mark.asyncio
    async def test_isolated_nodes_returns_nodes(self, analytics_service, mock_uow) -> None:
        """Test isolated nodes returns nodes with no edges."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        result = await analytics_service.isolated_nodes()

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_isolated_nodes_empty(self, analytics_service, mock_uow) -> None:
        """Test isolated nodes returns empty list when none are isolated."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        result = await analytics_service.isolated_nodes()

        assert result == []


# ── Prerequisite Bottlenecks Tests ─────────────────────────────────


class TestPrerequisiteBottlenecks:
    """Test prerequisite_bottlenecks."""

    @pytest.mark.asyncio
    async def test_bottlenecks_executes_query(self, analytics_service, mock_uow) -> None:
        """Test bottlenecks calls the database."""
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        result = await analytics_service.prerequisite_bottlenecks(limit=10)

        assert isinstance(result, list)
        mock_uow.session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_bottlenecks_returns_dependent_count(self, analytics_service, mock_uow) -> None:
        """Test bottleneck results include dependent_count."""
        row1 = MagicMock()
        row1.id = uuid4()
        row1.title = 'Bottleneck Node'
        row1.slug = 'bottleneck-node'
        type_mock = MagicMock()
        type_mock.value = 'concept'
        row1.node_type = type_mock
        diff_mock = MagicMock()
        diff_mock.value = 'advanced'
        row1.difficulty = diff_mock
        row1.dependent_count = 15

        mock_result = MagicMock()
        mock_result.all.return_value = [row1]
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        result = await analytics_service.prerequisite_bottlenecks(limit=5)

        assert len(result) == 1
        assert result[0]['dependent_count'] == 15


# ── Concept Depth Tests ────────────────────────────────────────────


class TestConceptDepth:
    """Test concept_depth_distribution."""

    @pytest.mark.asyncio
    async def test_concept_depth_no_nodes(self, analytics_service, mock_uow) -> None:
        """Test depth distribution returns zeros when no nodes."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])

        result = await analytics_service.concept_depth_distribution()

        assert result['min_depth'] == 0
        assert result['max_depth'] == 0
        assert result['avg_depth'] == 0.0
        assert result['root_node_count'] == 0

    @pytest.mark.asyncio
    async def test_concept_depth_with_roots(self, analytics_service, mock_uow) -> None:
        """Test depth identifies root nodes correctly."""
        root_node = MagicMock()
        root_node.id = uuid4()
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[root_node])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_dependents = AsyncMock(return_value=[])

        result = await analytics_service.concept_depth_distribution()

        assert result['root_node_count'] >= 1
        assert isinstance(result['distribution'], dict)


# ── Graph Density Tests ────────────────────────────────────────────


class TestGraphDensity:
    """Test graph_density."""

    @pytest.mark.asyncio
    async def test_density_single_node(self, analytics_service, mock_uow) -> None:
        """Test density is 0 when only one node."""
        mock_uow.knowledge_nodes.count = AsyncMock(return_value=1)
        mock_uow.knowledge_edges.count = AsyncMock(return_value=0)

        result = await analytics_service.graph_density()

        assert result['total_nodes'] == 1
        assert result['density'] == 0.0

    @pytest.mark.asyncio
    async def test_density_two_nodes_one_edge(self, analytics_service, mock_uow) -> None:
        """Test density with two nodes and one edge."""
        mock_uow.knowledge_nodes.count = AsyncMock(return_value=2)
        mock_uow.knowledge_edges.count = AsyncMock(return_value=1)

        result = await analytics_service.graph_density()

        assert result['total_nodes'] == 2
        assert result['total_edges'] == 1
        # density = (2 * 1) / (2 * 1) = 1.0
        assert result['density'] == 1.0

    @pytest.mark.asyncio
    async def test_density_sparse_graph(self, analytics_service, mock_uow) -> None:
        """Test density for a sparse graph."""
        mock_uow.knowledge_nodes.count = AsyncMock(return_value=10)
        mock_uow.knowledge_edges.count = AsyncMock(return_value=5)

        result = await analytics_service.graph_density()

        assert result['total_nodes'] == 10
        assert result['total_edges'] == 5
        # density = (2 * 5) / (10 * 9) = 10/90 = 0.111111
        assert result['density'] == pytest.approx(0.111111, rel=1e-3)
        assert result['max_possible_edges'] == 45


# ── Branching Factor Tests ─────────────────────────────────────────


class TestBranchingFactor:
    """Test average_branching_factor."""

    @pytest.mark.asyncio
    async def test_branching_factor_returns_histogram(self, analytics_service, mock_uow) -> None:
        """Test branching factor returns histogram structure."""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 2.0
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        mock_hist_result = MagicMock()
        mock_hist_result.all.return_value = []
        mock_uow.session.execute = AsyncMock(side_effect=[mock_result, mock_hist_result])

        result = await analytics_service.average_branching_factor()

        assert 'avg_branching_factor' in result
        assert 'histogram' in result


# ── Graph Statistics Tests ─────────────────────────────────────────


class TestGraphStatistics:
    """Test graph_statistics (combined metrics)."""

    @pytest.mark.asyncio
    async def test_graph_statistics_combines_metrics(self, analytics_service, mock_uow) -> None:
        """Test graph statistics combines density, branching, and depth."""
        mock_uow.knowledge_nodes.count = AsyncMock(return_value=10)
        mock_uow.knowledge_edges.count = AsyncMock(return_value=5)
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_dependents = AsyncMock(return_value=[])

        mock_result = MagicMock()
        mock_result.scalar.return_value = 0.5
        mock_uow.session.execute = AsyncMock(return_value=mock_result)

        result = await analytics_service.graph_statistics()

        assert 'total_nodes' in result
        assert 'total_edges' in result
        assert 'graph_density' in result
        assert 'avg_branching_factor' in result
        assert 'branching_histogram' in result
        assert 'depth' in result
        assert 'min' in result['depth']
        assert 'max' in result['depth']
        assert 'avg' in result['depth']
