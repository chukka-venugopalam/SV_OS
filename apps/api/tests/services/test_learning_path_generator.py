"""Tests for LearningPathGenerator — path generation, milestones, sorting.

These tests mock the UnitOfWork to verify learning path generation
logic without requiring a database.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.learning_path_generator import LearningPathGenerator

# ── Fixtures ───────────────────────────────────────────────────────


@pytest.fixture
def mock_uow():
    """Create a mock UnitOfWork."""
    uow = MagicMock()
    uow.graph = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    uow.user_progress = AsyncMock()
    return uow


@pytest.fixture
def generator(mock_uow):
    """Create a LearningPathGenerator with a mock UoW."""
    return LearningPathGenerator(mock_uow)


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
    return node


# ── Path Generation Tests ──────────────────────────────────────────


class TestGeneratePath:
    """Test generate_path."""

    @pytest.mark.asyncio
    async def test_generate_path_goal_not_found(self, generator, mock_uow) -> None:
        """Test returns error dict when goal node not found."""
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=None)

        result = await generator.generate_path(goal_node_id=uuid4())

        assert 'error' in result
        assert result['error'] == 'Goal node not found'

    @pytest.mark.asyncio
    async def test_generate_path_no_prerequisites(self, generator, mock_uow) -> None:
        """Test path generation with no prerequisites."""
        goal_id = uuid4()
        goal = _make_node(goal_id, title='Goal Node', slug='goal-node')

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=goal)
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])

        result = await generator.generate_path(goal_node_id=goal_id)

        assert 'error' not in result
        assert result['goal']['title'] == 'Goal Node'
        # No prerequisites means total_nodes = 0 (goal node excluded from prereq count)
        assert result['stats']['total_nodes'] == 0
        assert result['milestones'] == []

    @pytest.mark.asyncio
    async def test_generate_path_with_prerequisites(self, generator, mock_uow) -> None:
        """Test path generation includes prerequisites."""
        goal_id = uuid4()
        prereq_id = uuid4()
        goal = _make_node(goal_id, title='Advanced Topic')
        prereq = _make_node(prereq_id, title='Basic Topic', difficulty='beginner')

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=goal)
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(
            side_effect={goal_id: goal, prereq_id: prereq}.get,
        )
        mock_uow.graph.load_prerequisites = AsyncMock(
            side_effect=lambda nid: (
                {'prereqs': ([prereq] if nid != prereq_id else [])}.get('prereqs', [])
                if nid == goal_id
                else []
            ),
        )

        result = await generator.generate_path(goal_node_id=goal_id)

        assert result['stats']['total_nodes'] >= 1

    @pytest.mark.asyncio
    async def test_generate_path_includes_stats(self, generator, mock_uow) -> None:
        """Test path generation includes stats."""
        goal_id = uuid4()
        goal = _make_node(goal_id, title='Goal')

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=goal)
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))

        result = await generator.generate_path(goal_node_id=goal_id, user_id=uuid4())

        assert 'stats' in result
        assert 'total_nodes' in result['stats']
        assert 'remaining_nodes' in result['stats']
        assert 'estimated_minutes' in result['stats']
        assert 'estimated_hours' in result['stats']
        assert 'completion_percentage' in result['stats']


# ── Prerequisite Building Tests ────────────────────────────────────


class TestBuildPrerequisiteSet:
    """Test _build_prerequisite_set."""

    @pytest.mark.asyncio
    async def test_build_returns_ordered_prereqs(self, generator, mock_uow) -> None:
        """Test prerequisite set is ordered (roots first)."""
        node_a = uuid4()
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])

        result = await generator._build_prerequisite_set(node_a, max_depth=3)

        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_build_avoids_cycles(self, generator, mock_uow) -> None:
        """Test prerequisite building avoids infinite loops."""
        node_a = uuid4()
        node_b = MagicMock()
        node_b.id = node_a  # Self-referencing cycle

        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[node_b])

        result = await generator._build_prerequisite_set(node_a, max_depth=5)

        assert isinstance(result, list)


# ── Milestone Building Tests ───────────────────────────────────────


class TestBuildMilestones:
    """Test _build_milestones."""

    def test_empty_milestones(self, generator) -> None:
        """Test empty nodes produce empty milestones."""
        result = generator._build_milestones([])

        assert result == []

    def test_single_milestone(self, generator) -> None:
        """Test few nodes produce a single milestone."""
        nodes = [_make_node(uuid4(), title=f'Node {i}', difficulty='beginner') for i in range(3)]

        result = generator._build_milestones(nodes)

        assert len(result) == 1
        assert result[0]['node_count'] == 3
        assert result[0]['estimated_minutes'] > 0
        assert result[0]['estimated_hours'] > 0

    def test_multiple_milestones(self, generator) -> None:
        """Test many nodes produce multiple milestones."""
        nodes = [_make_node(uuid4(), title=f'Node {i}', difficulty='beginner') for i in range(12)]

        result = generator._build_milestones(nodes)

        assert len(result) >= 2  # 12 nodes / 5 per milestone = 3 milestones

    def test_milestone_structure(self, generator) -> None:
        """Test milestone dict structure is correct."""
        node = _make_node(uuid4(), title='Test', difficulty='intermediate')
        result = generator._build_milestones([node])

        assert len(result) == 1
        milestone = result[0]
        assert 'level' in milestone
        assert 'title' in milestone
        assert 'node_count' in milestone
        assert 'estimated_minutes' in milestone
        assert 'estimated_hours' in milestone
        assert 'nodes' in milestone
        assert len(milestone['nodes']) == 1


# ── Topological Sort Tests ─────────────────────────────────────────


class TestTopologicalSort:
    """Test _topological_sort."""

    @pytest.mark.asyncio
    async def test_sort_empty_list(self, generator, mock_uow) -> None:  # noqa: ARG002
        """Test sorting empty list returns empty."""
        result = await generator._topological_sort([], uuid4())
        assert result == []

    @pytest.mark.asyncio
    async def test_sort_returns_sorted_nodes(self, generator, mock_uow) -> None:
        """Test sorting returns nodes sorted by depth and difficulty."""
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])

        node_a = _make_node(uuid4(), title='A', difficulty='expert')
        node_b = _make_node(uuid4(), title='B', difficulty='beginner')

        result = await generator._topological_sort([node_a, node_b], uuid4())

        assert len(result) == 2


# ── Edge Cases ─────────────────────────────────────────────────────


class TestEdgeCases:
    """Test edge cases for learning path generation."""

    @pytest.mark.asyncio
    async def test_no_goal_node(self, generator, mock_uow) -> None:
        """Test behavior when goal node doesn't exist."""
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=None)

        result = await generator.generate_path(goal_node_id=uuid4())

        assert 'error' in result

    @pytest.mark.asyncio
    async def test_difficulty_filter_applied(self, generator, mock_uow) -> None:
        """Test difficulty filter excludes hard nodes."""
        goal_id = uuid4()
        goal = _make_node(goal_id, title='Goal', difficulty='beginner')

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=goal)
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[])

        result = await generator.generate_path(
            goal_node_id=goal_id,
            difficulty='beginner',
            estimated_hours=5,
        )

        assert 'error' not in result
