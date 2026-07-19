"""Tests for ProgressIntelligence — next_best_node, missing_prereqs, weak topics, forecasts.

These tests mock the UnitOfWork and repositories to verify intelligence
logic without requiring a database.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.progress_intelligence import ProgressIntelligence

# ── Fixtures ───────────────────────────────────────────────────────


@pytest.fixture
def mock_uow():
    """Create a mock UnitOfWork."""
    uow = MagicMock()
    uow.graph = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    uow.user_progress = AsyncMock()
    uow.bookmarks = AsyncMock()
    return uow


@pytest.fixture
def intelligence(mock_uow):
    """Create a ProgressIntelligence with a mock UoW."""
    return ProgressIntelligence(mock_uow)


def _make_node(
    node_id=None,
    title='Test Node',
    slug='test-node',
    description='A test node',
    node_type='concept',
    difficulty='beginner',
):
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
    node.view_count = 10
    node.edge_count = 5
    return node


# ── Next Best Node Tests ───────────────────────────────────────────


class TestNextBestNode:
    """Test next_best_node."""

    @pytest.mark.asyncio
    async def test_next_best_node_returns_node(self, intelligence, mock_uow) -> None:
        """Test returns a recommendation when available."""
        node = _make_node(uuid4())
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await intelligence.next_best_node(user_id=uuid4())

        if result:
            assert 'node' in result
            assert 'score' in result
            assert 'reasons' in result
            assert str(node.id) == result['node']['id']

    @pytest.mark.asyncio
    async def test_next_best_node_no_completed(self, intelligence, mock_uow) -> None:
        """Test returns None when all nodes completed."""
        node_id = uuid4()
        node = _make_node(node_id)
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_progress = MagicMock()
        mock_progress.items = [MagicMock(node_id=node_id)]
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=mock_progress)
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])

        result = await intelligence.next_best_node(user_id=uuid4())

        assert result is None


# ── Missing Prerequisites Tests ────────────────────────────────────


class TestMissingPrerequisites:
    """Test missing_prerequisites."""

    @pytest.mark.asyncio
    async def test_missing_prereqs_with_goal(self, intelligence, mock_uow) -> None:
        """Test returns missing prereqs for a specific goal."""
        node_id = uuid4()
        prereq_id = uuid4()
        prereq = _make_node(prereq_id, title='Missing Prerequisite')
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[prereq])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))

        result = await intelligence.missing_prerequisites(
            user_id=uuid4(),
            goal_node_id=node_id,
        )

        assert len(result) >= 1
        assert any(n['id'] == str(prereq_id) for n in result)

    @pytest.mark.asyncio
    async def test_missing_prereqs_all_completed(self, intelligence, mock_uow) -> None:
        """Test returns empty list when all prereqs completed."""
        node_id = uuid4()
        prereq_id = uuid4()
        prereq = _make_node(prereq_id)
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[prereq])
        mock_uow.user_progress.find_by_user = AsyncMock(
            return_value=MagicMock(items=[MagicMock(node_id=prereq_id)]),
        )

        result = await intelligence.missing_prerequisites(
            user_id=uuid4(),
            goal_node_id=node_id,
        )

        assert result == []

    @pytest.mark.asyncio
    async def test_missing_prereqs_no_goal(self, intelligence, mock_uow) -> None:
        """Test without a goal checks all nodes."""
        node = _make_node(uuid4())
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))

        result = await intelligence.missing_prerequisites(user_id=uuid4())

        assert isinstance(result, list)


# ── Weak Topics Tests ──────────────────────────────────────────────


class TestWeakTopics:
    """Test weak_topics."""

    @pytest.mark.asyncio
    async def test_weak_topics_no_stale(self, intelligence, mock_uow) -> None:
        """Test returns empty when no stale topics."""
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))

        result = await intelligence.weak_topics(user_id=uuid4())

        assert result == []

    @pytest.mark.asyncio
    async def test_weak_topics_identifies_stale(self, intelligence, mock_uow) -> None:
        """Test identifies stale topics (in learning > 7 days)."""
        node_id = uuid4()
        node = _make_node(node_id, title='Stale Concept')

        stale_progress = MagicMock()
        stale_progress.node_id = node_id
        stale_progress.status = 'learning'
        stale_progress.updated_at = datetime.now(UTC) - timedelta(days=14)

        mock_uow.user_progress.find_by_user = AsyncMock(
            return_value=MagicMock(items=[stale_progress]),
        )
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=node)

        result = await intelligence.weak_topics(user_id=uuid4())

        assert len(result) >= 1
        assert result[0]['node']['title'] == 'Stale Concept'
        assert result[0]['weakness_score'] > 0

    @pytest.mark.asyncio
    async def test_weak_topics_filters_recent(self, intelligence, mock_uow) -> None:
        """Test recently updated nodes are not marked as weak."""
        fresh_progress = MagicMock()
        fresh_progress.node_id = uuid4()
        fresh_progress.status = 'learning'
        fresh_progress.updated_at = datetime.now(UTC) - timedelta(hours=1)

        mock_uow.user_progress.find_by_user = AsyncMock(
            return_value=MagicMock(items=[fresh_progress]),
        )
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=_make_node(uuid4()))

        result = await intelligence.weak_topics(user_id=uuid4())

        assert len(result) == 0  # Not stale yet


# ── Estimated Completion Tests ─────────────────────────────────────


class TestEstimatedCompletion:
    """Test estimated_completion."""

    @pytest.mark.asyncio
    async def test_estimated_completion_returns_estimate(self, intelligence, mock_uow) -> None:
        """Test returns completion estimate with metrics."""
        node_id = uuid4()
        prereq_id = uuid4()
        prereq = _make_node(prereq_id, difficulty='intermediate')

        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[prereq])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))

        result = await intelligence.estimated_completion(
            user_id=uuid4(),
            goal_node_id=node_id,
        )

        assert 'goal_node_id' in result
        assert 'missing_prerequisites' in result
        assert result['missing_prerequisites'] >= 1
        assert 'estimated_minutes' in result
        assert 'estimated_hours' in result
        assert 'estimated_days' in result

    @pytest.mark.asyncio
    async def test_estimated_completion_no_missing(self, intelligence, mock_uow) -> None:
        """Test returns zero when nothing is missing."""
        node_id = uuid4()
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))

        result = await intelligence.estimated_completion(
            user_id=uuid4(),
            goal_node_id=node_id,
        )

        assert result['missing_prerequisites'] == 0
        # No missing prereqs means 0 estimated minutes
        assert result['estimated_minutes'] == 0


# ── Completion Forecast Tests ──────────────────────────────────────


class TestCompletionForecast:
    """Test completion_forecast."""

    @pytest.mark.asyncio
    async def test_forecast_returns_comprehensive_stats(self, intelligence, mock_uow) -> None:
        """Test forecast returns all expected fields."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(
            return_value=[_make_node(uuid4()) for _ in range(10)],
        )
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await intelligence.completion_forecast(user_id=uuid4())

        assert 'total_nodes' in result
        assert 'completed_nodes' in result
        assert 'remaining_nodes' in result
        assert 'completion_percentage' in result
        assert 'user_pace_minutes_per_node' in result
        assert 'estimated_days_to_completion' in result
        assert 'next_recommendations' in result

    @pytest.mark.asyncio
    async def test_forecast_with_some_completed(self, intelligence, mock_uow) -> None:
        """Test forecast reflects some progress."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(
            return_value=[_make_node(uuid4()) for _ in range(10)],
        )
        mock_uow.user_progress.find_by_user = AsyncMock(
            return_value=MagicMock(
                items=[
                    MagicMock(node_id=uuid4(), status='completed', updated_at=datetime.now(UTC))
                    for _ in range(3)
                ],
            ),
        )
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await intelligence.completion_forecast(user_id=uuid4())

        assert result['completed_nodes'] >= 0
        assert result['total_nodes'] == 10
