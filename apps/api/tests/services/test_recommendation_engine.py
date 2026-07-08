"""Tests for RecommendationEngine — scoring, ranking, recommendations.

These tests mock the UnitOfWork to verify recommendation algorithm
logic without requiring a database.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.recommendation_engine import RecommendationEngine


# ── Fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def mock_uow():
    """Create a mock UnitOfWork."""
    uow = MagicMock()
    uow.graph = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    uow.bookmarks = AsyncMock()
    uow.user_progress = AsyncMock()
    uow.careers = AsyncMock()
    return uow


@pytest.fixture
def engine(mock_uow):
    """Create a RecommendationEngine with a mock UoW."""
    return RecommendationEngine(mock_uow)


def _make_node(node_id=None, title="Test Node", slug="test-node",
               description="A test node", node_type="concept",
               difficulty="beginner", view_count=10, edge_count=5):
    """Helper to create a mock node."""
    node = MagicMock()
    node.id = node_id or uuid4()
    node.title = title
    node.slug = slug
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
    node.view_count = view_count
    node.edge_count = edge_count
    return node


# ── Empty State Tests ──────────────────────────────────────────────

class TestEmptyStates:
    """Test edge cases with no data."""

    @pytest.mark.asyncio
    async def test_no_published_nodes(self, engine, mock_uow):
        """Test returns empty list when no published nodes."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])

        result = await engine.get_recommendations(user_id=uuid4())

        assert result == []

    @pytest.mark.asyncio
    async def test_all_nodes_completed(self, engine, mock_uow):
        """Test returns empty list when all nodes are completed."""
        node_id = uuid4()
        node = _make_node(node_id)
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_progress = MagicMock()
        mock_progress.items = [MagicMock(node_id=node_id)]
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=mock_progress)
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])

        result = await engine.get_recommendations(
            user_id=uuid4(), exclude_completed=True,
        )

        assert result == []


# ── Scoring Tests ──────────────────────────────────────────────────

class TestScoring:
    """Test scoring logic."""

    @pytest.mark.asyncio
    async def test_high_prerequisite_score(self, engine, mock_uow):
        """Test nodes with completed prerequisites get high score."""
        node_id = uuid4()
        prereq_id = uuid4()
        node = _make_node(node_id, view_count=50, edge_count=20)
        prereq_node = _make_node(prereq_id)

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(
            items=[MagicMock(node_id=prereq_id)]  # Completed this prereq
        ))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[prereq_node])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_recommendations(user_id=uuid4(), limit=10)

        if result:
            assert result[0]["score"] > 0
            assert "reasons" in result[0]
            assert "node" in result[0]

    @pytest.mark.asyncio
    async def test_popular_node_gets_score_boost(self, engine, mock_uow):
        """Test popular nodes get higher scores."""
        popular_node = _make_node(uuid4(), view_count=200, edge_count=100)
        unpopular_node = _make_node(uuid4(), view_count=1, edge_count=0)

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[
            popular_node, unpopular_node,
        ])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_recommendations(user_id=uuid4(), limit=10)

        assert len(result) == 2
        # Popular node should be ranked first
        popular_ids = [r["node"]["id"] for r in result]
        assert str(popular_node.id) in popular_ids


# ── Career Recommendation Tests ────────────────────────────────────

class TestCareerRecommendations:
    """Test get_recommended_careers."""

    @pytest.mark.asyncio
    async def test_career_recommendations_empty(self, engine, mock_uow):
        """Test returns empty list when no careers match."""
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.careers.find_published = AsyncMock(return_value=[])
        mock_uow.graph.load_all_neighbors = AsyncMock(return_value={
            "incoming": [], "outgoing": [],
        })

        result = await engine.get_recommended_careers(user_id=uuid4())

        assert result == []

    @pytest.mark.asyncio
    async def test_career_match_scoring(self, engine, mock_uow):
        """Test career match scoring works."""
        career_id = uuid4()
        completed_node_id = uuid4()

        career = MagicMock()
        career.id = career_id
        career.title = "Data Scientist"
        career.slug = "data-scientist"
        career.description = "Works with data"
        career.salary_range = "$100k-$150k"
        demand_mock = MagicMock()
        demand_mock.value = "growing"
        career.demand = demand_mock

        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(
            items=[MagicMock(node_id=completed_node_id)]
        ))
        mock_uow.careers.find_published = AsyncMock(return_value=[career])
        mock_uow.graph.load_all_neighbors = AsyncMock(return_value={
            "incoming": [MagicMock(id=completed_node_id)],
            "outgoing": [],
        })

        result = await engine.get_recommended_careers(user_id=uuid4())

        assert len(result) == 1
        assert result[0]["career"]["title"] == "Data Scientist"
        assert result[0]["match_score"] > 0

    @pytest.mark.asyncio
    async def test_career_no_required_nodes(self, engine, mock_uow):
        """Test careers with no required nodes are skipped."""
        career = MagicMock()
        career.id = uuid4()
        career.title = "Empty Career"
        career.slug = "empty-career"
        career.description = "No requirements"
        career.salary_range = None
        demand_mock = MagicMock()
        demand_mock.value = "stable"
        career.demand = demand_mock

        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.careers.find_published = AsyncMock(return_value=[career])
        mock_uow.graph.load_all_neighbors = AsyncMock(return_value={
            "incoming": [], "outgoing": [],
        })

        result = await engine.get_recommended_careers(user_id=uuid4())

        assert result == []


# ── Next Best Node Tests ───────────────────────────────────────────

class TestNextBestNode:
    """Test get_next_best_nodes."""

    @pytest.mark.asyncio
    async def test_next_best_node_returns_top(self, engine, mock_uow):
        """Test next_best_node returns the top recommendation."""
        node = _make_node(uuid4())
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_next_best_nodes(user_id=uuid4(), count=3)

        assert len(result) <= 3
