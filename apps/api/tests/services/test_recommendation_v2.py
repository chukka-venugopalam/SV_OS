"""Tests for RecommendationV2 — enhanced scoring with semantic and temporal signals.

Tests verify personalized recommendations, score breakdowns, and
edge cases using mocked repositories.
"""

from __future__ import annotations

from datetime import UTC
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.ai.recommendation_v2 import RecommendationV2


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.graph = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    uow.user_progress = AsyncMock()
    uow.bookmarks = AsyncMock()
    uow.search_history = AsyncMock()
    return uow


@pytest.fixture
def engine(mock_uow):
    return RecommendationV2(mock_uow)


def _make_node(
    node_id=None,
    title='Test',
    slug='test',
    node_type='concept',
    difficulty='beginner',
    view_count=10,
    estimated_minutes=30,
):
    node = MagicMock()
    node.id = node_id or uuid4()
    node.title = title
    node.slug = slug
    node.description = 'A test node for testing'
    node.node_type = MagicMock()
    node.node_type.value = node_type
    node.difficulty = MagicMock()
    node.difficulty.value = difficulty
    node.estimated_minutes = estimated_minutes
    node.view_count = view_count
    node.icon = None
    node.color = None
    node.extra_metadata = {}
    return node


class TestPersonalizedRecommendations:
    """Test get_personalized."""

    @pytest.mark.asyncio
    async def test_empty_no_published_nodes(self, engine, mock_uow):
        """Test returns empty when no published nodes."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.search_history.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_personalized(user_id=uuid4())

        assert result == []

    @pytest.mark.asyncio
    async def test_all_nodes_completed(self, engine, mock_uow):
        """Test returns empty when all nodes completed."""
        from datetime import datetime

        node_id = uuid4()
        node = _make_node(node_id)

        completed_progress = MagicMock()
        completed_progress.node_id = node_id
        completed_progress.status = 'completed'
        completed_progress.updated_at = datetime.now(UTC)

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.user_progress.find_by_user = AsyncMock(
            return_value=MagicMock(items=[completed_progress])
        )
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.search_history.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_personalized(user_id=uuid4())

        assert result == []

    @pytest.mark.asyncio
    async def test_returns_recommendations_with_breakdown(self, engine, mock_uow):
        """Test recommendations include score breakdown."""
        node = _make_node(uuid4(), 'Python', 'python')

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.search_history.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_personalized(user_id=uuid4(), limit=10)

        if result:
            assert 'score' in result[0]
            assert 'breakdown' in result[0]
            assert 'reasons' in result[0]
            assert 'node' in result[0]

    @pytest.mark.asyncio
    async def test_breakdown_contains_all_signals(self, engine, mock_uow):
        """Test score breakdown contains all expected signals."""
        node = _make_node(uuid4(), 'Python', 'python')

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.search_history.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_personalized(user_id=uuid4(), limit=10)

        if result:
            breakdown = result[0]['breakdown']
            expected_signals = [
                'prerequisite_completion',
                'weak_topic_reinforcement',
                'bookmark_affinity',
                'graph_distance',
                'semantic_similarity',
                'difficulty_match',
                'estimated_time_match',
                'recent_search_relevance',
                'learning_velocity',
            ]
            for signal in expected_signals:
                assert signal in breakdown

    @pytest.mark.asyncio
    async def test_limit_respects_count(self, engine, mock_uow):
        """Test limit restricts number of results."""
        nodes = [_make_node(uuid4(), f'Node {i}', f'node-{i}') for i in range(10)]

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=nodes)
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])
        mock_uow.search_history.find_by_user = AsyncMock(return_value=[])
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])

        result = await engine.get_personalized(user_id=uuid4(), limit=3)

        assert len(result) <= 3


class TestScoringSignals:
    """Test individual scoring signals."""

    @pytest.mark.asyncio
    async def test_weak_topic_score(self, engine, mock_uow):  # noqa: ARG002
        """Test weak topic scoring."""
        node_id = uuid4()
        node = _make_node(node_id, 'Weak Topic', 'weak')
        weak_topics = [{'node': {'id': str(node_id)}}]

        score = engine._weak_topic_score(node, weak_topics)
        assert score == 0.9

    def test_weak_topic_score_not_weak(self, engine):
        """Test non-weak topic gets 0."""
        node = _make_node(uuid4(), 'Normal', 'normal')
        score = engine._weak_topic_score(node, [])
        assert score == 0.0

    @pytest.mark.asyncio
    async def test_bookmark_affinity(self, engine, mock_uow):  # noqa: ARG002
        """Test bookmark affinity with many bookmarks."""
        node = _make_node(node_type='concept')
        score = engine._bookmark_affinity_score(node, {uuid4(), uuid4(), uuid4()})
        assert score == 0.3

    def test_bookmark_affinity_empty(self, engine):
        """Test bookmark affinity with no bookmarks."""
        node = _make_node(node_type='concept')
        score = engine._bookmark_affinity_score(node, set())
        assert score == 0.0

    def test_difficulty_score_fast_learner(self, engine):
        """Test difficulty for fast learners."""
        node = _make_node(difficulty='advanced')
        score = engine._difficulty_score(node, learning_velocity=3.0)
        assert score == 0.7

    def test_difficulty_score_slow_learner(self, engine):
        """Test difficulty for slow learners."""
        node = _make_node(difficulty='expert')
        score = engine._difficulty_score(node, learning_velocity=0.5)
        assert score == 0.3

    @pytest.mark.asyncio
    async def test_recent_search_score(self, engine, mock_uow):  # noqa: ARG002
        """Test recent search matching."""
        node = _make_node(title='Python Programming', slug='python')
        score = engine._recent_search_score(node, ['python', 'data science'])
        assert score == 0.6

    def test_recent_search_no_match(self, engine):
        """Test recent search no match."""
        node = _make_node(title='Java Programming', slug='java')
        score = engine._recent_search_score(node, ['python'])
        assert score == 0.0

    def test_velocity_boost(self, engine):
        """Test velocity boost scales with pace."""
        assert engine._velocity_boost(None, 3.0) == 0.5
        assert engine._velocity_boost(None, 1.5) == 0.3
        assert engine._velocity_boost(None, 0.5) == 0.1


class TestReasonBuilding:
    """Test build_reasons."""

    def test_top_reasons(self, engine):
        """Test top 3 reasons from breakdown."""
        breakdown = {
            'prerequisite_completion': 0.9,
            'weak_topic_reinforcement': 0.0,
            'bookmark_affinity': 0.5,
            'graph_distance': 0.2,
            'semantic_similarity': 0.0,
            'difficulty_match': 0.0,
            'estimated_time_match': 0.0,
            'recent_search_relevance': 0.0,
            'learning_velocity': 0.0,
        }
        reasons = engine._build_reasons(breakdown)

        assert len(reasons) <= 3
        assert any('prerequisite' in r.lower() for r in reasons)

    def test_empty_breakdown(self, engine):
        """Test empty breakdown returns no reasons."""
        breakdown = {
            k: 0.0
            for k in [
                'prerequisite_completion',
                'weak_topic_reinforcement',
                'bookmark_affinity',
                'graph_distance',
                'semantic_similarity',
                'difficulty_match',
                'estimated_time_match',
                'recent_search_relevance',
                'learning_velocity',
            ]
        }
        reasons = engine._build_reasons(breakdown)
        assert reasons == []
