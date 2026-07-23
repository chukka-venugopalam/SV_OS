"""Tests for ContextEngine — comprehensive context gathering for AI prompts."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.services.ai.context_engine import ContextEngine


@pytest.fixture
def mock_uow():
    uow = MagicMock()  # type: ignore[method-assign]
    uow.session = MagicMock()  # type: ignore[method-assign]
    uow.session.execute = AsyncMock()  # type: ignore[method-assign]

    # Mock repository methods
    node = MagicMock()  # type: ignore[method-assign]
    node.id = uuid4()
    node.slug = 'python-basics'
    node.title = 'Python Basics'
    node.node_type = MagicMock()  # type: ignore[method-assign]
    node.node_type.value = 'concept'
    node.difficulty = MagicMock()  # type: ignore[method-assign]
    node.difficulty.value = 'beginner'

    uow.knowledge_nodes = MagicMock()  # type: ignore[method-assign]
    uow.knowledge_nodes.find_by_slug = AsyncMock(return_value=node)  # type: ignore[method-assign]

    uow.graph = MagicMock()  # type: ignore[method-assign]
    uow.graph.load_prerequisites = AsyncMock(return_value=[])  # type: ignore[method-assign]
    uow.graph.load_dependents = AsyncMock(return_value=[])  # type: ignore[method-assign]
    uow.graph.load_all_neighbors = AsyncMock(return_value={'outgoing': [], 'incoming': []})  # type: ignore[method-assign]

    return uow


class TestContextEngine:
    """Test the ContextEngine for gathering comprehensive context."""

    async def test_build_context_empty_user(self, mock_uow) -> None:
        """Context is built even without user_id (anonymous)."""
        engine = ContextEngine(mock_uow)
        context = await engine.build_context(user_id=None)
        assert isinstance(context, dict)
        assert 'knowledge_graph' in context
        assert 'user_progress' in context
        assert 'activity' in context
        assert 'recommendations' in context
        assert 'career' in context
        assert 'ai_memory' in context

    async def test_build_context_with_node(self, mock_uow) -> None:
        """Context includes knowledge graph data when node_slug is provided."""
        engine = ContextEngine(mock_uow)
        context = await engine.build_context(node_slug='python-basics')
        kg = context.get('knowledge_graph', {})
        assert kg.get('current_node', {}).get('title') == 'Python Basics'
        assert kg['current_node']['slug'] == 'python-basics'

    async def test_build_node_context(self, mock_uow) -> None:
        """Node-specific context excludes user data."""
        engine = ContextEngine(mock_uow)
        context = await engine.build_node_context(node_slug='python-basics')
        assert 'knowledge_graph' in context
        # User data should be empty
        assert context.get('user_progress', {}) == {}

    async def test_build_context_with_user_progress(self, mock_uow) -> None:
        """Progress intelligence is called for authenticated users."""
        engine = ContextEngine(mock_uow)
        user_id = uuid4()

        with patch.multiple(
            engine._progress,
            completion_forecast=AsyncMock(
                return_value={
                    'completion_percentage': 50.0,
                    'completed_nodes': 10,
                    'remaining_nodes': 10,
                },
            ),
            weak_topics=AsyncMock(
                return_value=[
                    {'node': {'title': 'Loops'}, 'score': 0.3},
                ],
            ),
            next_best_node=AsyncMock(
                return_value={
                    'node': {'title': 'Data Structures'},
                    'score': 0.9,
                },
            ),
        ):
            context = await engine.build_context(user_id=user_id)
            up = context.get('user_progress', {})
            assert up.get('completion_percentage') == 50.0
            assert up.get('completed_nodes') == 10
            assert up.get('next_recommended_node') == 'Data Structures'

    async def test_build_context_progress_error_graceful(self, mock_uow) -> None:
        """Progress errors don't crash context building."""
        engine = ContextEngine(mock_uow)
        engine._progress.completion_forecast = AsyncMock(side_effect=Exception('DB error'))  # type: ignore[method-assign]

        context = await engine.build_context(user_id=uuid4())
        assert context.get('user_progress', {}) == {}

    async def test_build_context_with_ai_memory(self, mock_uow) -> None:
        """AI memories are included in context for authenticated users."""
        mock_uow.session.execute = AsyncMock(return_value=MagicMock())  # type: ignore[method-assign]
        mock_uow.session.execute.return_value.all = MagicMock(  # type: ignore[method-assign]
            return_value=[
                MagicMock(memory_type='weak_concept', key='loops', value='Loops'),
                MagicMock(memory_type='career_goal', key='se', value='Software Engineer'),
            ],
        )

        engine = ContextEngine(mock_uow)
        context = await engine.build_context(user_id=uuid4())

        assert 'ai_memory' in context
        assert 'career' in context

    async def test_build_context_max_nodes_respected(self, mock_uow) -> None:
        """Max nodes parameter limits context size."""
        # Create many prerequisites
        mock_nodes = [
            MagicMock(spec=['slug', 'title', 'node_type', 'difficulty']) for _ in range(20)
        ]
        for n in mock_nodes:
            n.slug = 'node'
            n.title = 'Node'
            n.node_type.value = 'concept'
            n.difficulty.value = 'beginner'

        mock_uow.graph.load_prerequisites = AsyncMock(return_value=mock_nodes)  # type: ignore[method-assign]

        engine = ContextEngine(mock_uow)
        context = await engine.build_context(node_slug='python-basics', max_nodes=5)
        prereqs = context.get('knowledge_graph', {}).get('prerequisites', [])
        assert len(prereqs) <= 5

    async def test_build_context_multiple_calls_same_node(self, mock_uow) -> None:
        """Multiple calls with the same node don't cause side effects."""
        engine = ContextEngine(mock_uow)
        ctx1 = await engine.build_context(node_slug='python-basics')
        ctx2 = await engine.build_context(node_slug='python-basics')

        assert ctx1 == ctx2
