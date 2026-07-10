"""Tests for HybridSearchService — multi-signal ranking.

Tests verify keyword, semantic, graph, popularity, and difficulty
signal scoring along with filtering and pagination.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.ai.hybrid_search import HybridSearchService


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.knowledge_nodes = AsyncMock()
    uow.graph = AsyncMock()
    uow.user_progress = AsyncMock()
    uow.bookmarks = AsyncMock()
    return uow


@pytest.fixture
def search_service(mock_uow):
    return HybridSearchService(mock_uow)


def _make_node(
    node_id=None,
    title='Test',
    slug='test',
    description='A test node',
    node_type='concept',
    difficulty='beginner',
    view_count=10,
):
    node = MagicMock()
    node.id = node_id or uuid4()
    node.title = title
    node.slug = slug
    node.description = description
    node.node_type = MagicMock()
    node.node_type.value = node_type
    node.difficulty = MagicMock()
    node.difficulty.value = difficulty
    node.estimated_minutes = 30
    node.icon = None
    node.color = None
    node.view_count = view_count
    node.extra_metadata = {}
    return node


class TestKeywordScore:
    """Test keyword scoring signal."""

    def test_exact_title_match(self, search_service):
        """Test exact title match gives maximum score."""
        node = _make_node(title='Python Basics')
        score = search_service._keyword_score('Python Basics', node)
        assert score == 1.0

    def test_partial_title_match(self, search_service):
        """Test partial title match."""
        node = _make_node(title='Advanced Python Programming')
        score = search_service._keyword_score('Python', node)
        assert score == 0.8

    def test_description_match(self, search_service):
        """Test description match (word overlap bonuses apply)."""
        node = _make_node(title='Node', description='Learn Python programming')
        score = search_service._keyword_score('Python', node)
        assert score == 0.6  # 0.5 from desc match + word overlap boost

    def test_no_match(self, search_service):
        """Test no match returns 0."""
        node = _make_node(title='Java', description='Java programming')
        score = search_service._keyword_score('Python', node)
        assert score == 0.0

    def test_empty_query(self, search_service):
        """Test empty query returns 0."""
        node = _make_node(title='Python')
        score = search_service._keyword_score('', node)
        assert score == 0.0


class TestDifficultyScore:
    """Test difficulty scoring signal."""

    def test_beginner(self, search_service):
        """Test beginner difficulty."""
        node = _make_node(difficulty='beginner')
        score = search_service._difficulty_score(node)
        assert score == 0.7

    def test_intermediate(self, search_service):
        """Test intermediate difficulty."""
        node = _make_node(difficulty='intermediate')
        score = search_service._difficulty_score(node)
        assert score == 0.7

    def test_advanced(self, search_service):
        """Test advanced difficulty."""
        node = _make_node(difficulty='advanced')
        score = search_service._difficulty_score(node)
        assert score == 0.4

    def test_expert(self, search_service):
        """Test expert difficulty."""
        node = _make_node(difficulty='expert')
        score = search_service._difficulty_score(node)
        assert score == 0.1


class TestPopularityScore:
    """Test popularity scoring signal."""

    def test_highly_popular(self, search_service):
        """Test >500 views."""
        node = _make_node(view_count=600)
        score = search_service._popularity_score(node)
        assert score == 1.0

    def test_moderately_popular(self, search_service):
        """Test >100 views."""
        node = _make_node(view_count=150)
        score = search_service._popularity_score(node)
        assert score == 0.8

    def test_unpopular(self, search_service):
        """Test 0 views."""
        node = _make_node(view_count=0)
        score = search_service._popularity_score(node)
        assert score == 0.0


class TestHybridSearch:
    """Test full hybrid search."""

    @pytest.mark.asyncio
    async def test_search_empty(self, search_service, mock_uow):
        """Test search returns empty when no nodes match."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])

        result = await search_service.search(query='test')

        assert result['items'] == []
        assert result['total'] == 0

    @pytest.mark.asyncio
    async def test_search_with_keyword_match(self, search_service, mock_uow):
        """Test search returns nodes with keyword matches."""
        node = _make_node(title='Python Basics', slug='python-basics')

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])

        result = await search_service.search(query='Python')

        assert len(result['items']) == 1
        assert result['items'][0]['node']['slug'] == 'python-basics'
        assert result['items'][0]['score'] > 0
        assert 'signals' in result['items'][0]

    @pytest.mark.asyncio
    async def test_search_pagination(self, search_service, mock_uow):
        """Test search paginates results."""
        nodes = [
            _make_node(uuid4(), f'Node {i}', f'node-{i}', description='Python programming')
            for i in range(5)
        ]

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=nodes)
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])

        result = await search_service.search(query='Python', page=1, per_page=2)

        assert len(result['items']) == 2
        assert result['total'] == 5
        assert result['page'] == 1
        assert result['per_page'] == 2
        assert result['total_pages'] == 3

    @pytest.mark.asyncio
    async def test_search_with_filters(self, search_service, mock_uow):
        """Test search applies type and difficulty filters."""
        concept_node = _make_node(title='Python', node_type='concept', view_count=0)
        tool_node = _make_node(title='VSCode', node_type='tool', view_count=0)

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[concept_node, tool_node])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])

        result = await search_service.search(
            query='VSCode',  # Tool name — only tool_node matches
            filters={'node_type': 'concept'},  # Filter for concepts only
        )

        assert len(result['items']) == 1
        assert result['items'][0]['node']['node_type'] == 'concept'

    @pytest.mark.asyncio
    async def test_search_with_user_context(self, search_service, mock_uow):
        """Test search includes user progress/bookmark flags."""
        node_id = uuid4()
        node = _make_node(node_id, 'Python', 'python-basics')
        user_id = uuid4()

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(
            return_value=MagicMock(items=[MagicMock(node_id=node_id)])
        )
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])

        result = await search_service.search(query='Python', user_id=user_id)

        assert len(result['items']) == 1
        assert result['items'][0]['is_in_progress'] is True
        assert result['items'][0]['is_bookmarked'] is False

    @pytest.mark.asyncio
    async def test_search_with_embedding(self, search_service, mock_uow):
        """Test search uses semantic signal when embedding provided."""
        node = _make_node(title='Python', slug='python')
        node.extra_metadata = {'embedding': [0.9, 0.0, 0.0]}

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])
        mock_uow.graph.load_edges_for_nodes = AsyncMock(return_value=[])
        mock_uow.user_progress.find_by_user = AsyncMock(return_value=MagicMock(items=[]))
        mock_uow.bookmarks.find_by_user = AsyncMock(return_value=[])

        result = await search_service.search(
            query='Python',
            query_embedding=[0.9, 0.0, 0.0],
        )

        assert len(result['items']) == 1
        assert result['items'][0]['signals']['semantic'] > 0


class TestEdgeCases:
    """Test edge cases."""

    @pytest.mark.asyncio
    async def test_no_nodes_published(self, search_service, mock_uow):
        """Test with no published nodes."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])

        result = await search_service.search(query='anything')

        assert result['items'] == []
        assert result['total'] == 0

    @pytest.mark.asyncio
    async def test_empty_query(self, search_service, mock_uow):
        """Test with empty query."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])
        result = await search_service.search(query='')
        assert result['total'] == 0

    @pytest.mark.asyncio
    async def test_custom_weights(self, mock_uow):
        """Test custom weight configuration."""
        service = HybridSearchService(
            mock_uow,
            w_keyword=0.5,
            w_semantic=0.0,
            w_graph=0.0,
            w_popularity=0.5,
            w_difficulty=0.0,
        )
        assert service._w_keyword == 0.5
        assert service._w_popularity == 0.5
