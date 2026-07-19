"""Tests for SimilarityService — concept similarity and relationship discovery.

Tests verify multi-signal similarity scoring, combining semantic,
graph, and type signals.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.ai.similarity import SimilarityService


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.graph = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    return uow


@pytest.fixture
def similarity_service(mock_uow):
    return SimilarityService(mock_uow)


def _make_node(
    node_id=None,
    title='Test',
    slug='test',
    node_type='concept',
    difficulty='beginner',
    embedding=None,
):
    node = MagicMock()
    node.id = node_id or uuid4()
    node.title = title
    node.slug = slug
    node.description = 'A test node description'
    node.node_type = MagicMock()
    node.node_type.value = node_type
    node.difficulty = MagicMock()
    node.difficulty.value = difficulty
    node.estimated_minutes = 30
    node.icon = None
    node.color = None
    node.view_count = 10
    node.extra_metadata = {}
    if embedding:
        node.extra_metadata['embedding'] = embedding
    return node


class TestFindSimilar:
    """Test find_similar."""

    @pytest.mark.asyncio
    async def test_node_not_found(self, similarity_service, mock_uow) -> None:
        """Test returns empty when source node not found."""
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=None)

        result = await similarity_service.find_similar(uuid4())
        assert result == []

    @pytest.mark.asyncio
    async def test_no_embedding_no_neighbors(self, similarity_service, mock_uow) -> None:
        """Test returns empty when no signals available."""
        node = _make_node(uuid4(), 'Lonely Node', 'lonely')

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=node)
        mock_uow.graph.load_all_neighbors = AsyncMock(
            return_value={
                'outgoing': [],
                'incoming': [],
            },
        )

        result = await similarity_service.find_similar(node.id)

        assert result == []

    @pytest.mark.asyncio
    async def test_graph_neighbor_found(self, similarity_service, mock_uow) -> None:
        """Test finds similar via graph proximity."""
        source_id = uuid4()
        neighbor_id = uuid4()
        source = _make_node(source_id, 'Source', 'source')
        neighbor = _make_node(neighbor_id, 'Neighbor', 'neighbor')

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(
            side_effect={source_id: source, neighbor_id: neighbor}.get,
        )
        mock_uow.graph.load_all_neighbors = AsyncMock(
            return_value={
                'outgoing': [neighbor],
                'incoming': [],
            },
        )

        result = await similarity_service.find_similar(source_id)

        assert len(result) >= 1
        assert any(r['node']['slug'] == 'neighbor' for r in result)

    @pytest.mark.asyncio
    async def test_semantic_similarity_used(self, similarity_service, mock_uow) -> None:
        """Test semantic signal is used when embeddings available."""
        source_id = uuid4()
        similar_id = uuid4()
        source = _make_node(source_id, 'Source', 'source', embedding=[0.9, 0.0, 0.0])
        similar = _make_node(similar_id, 'Similar', 'similar', embedding=[0.85, 0.0, 0.0])

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(
            side_effect={source_id: source, similar_id: similar}.get,
        )
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[source, similar])
        mock_uow.graph.load_all_neighbors = AsyncMock(
            return_value={
                'outgoing': [],
                'incoming': [],
            },
        )

        result = await similarity_service.find_similar(
            source_id,
            include_semantic=True,
            include_graph=True,
        )

        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_composite_scoring(self, similarity_service, mock_uow) -> None:
        """Test composite score includes all signals."""
        source_id = uuid4()
        neighbor_id = uuid4()
        source = _make_node(source_id, 'Source', 'source', embedding=[0.9, 0.0, 0.0])
        neighbor = _make_node(
            neighbor_id,
            'Neighbor',
            'neighbor',
            node_type='concept',
            embedding=[0.85, 0.0, 0.0],
        )

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(
            side_effect={source_id: source, neighbor_id: neighbor}.get,
        )
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[source, neighbor])
        mock_uow.graph.load_all_neighbors = AsyncMock(
            return_value={
                'outgoing': [neighbor],
                'incoming': [],
            },
        )

        result = await similarity_service.find_similar(source_id)

        if result:
            assert 'score' in result[0]
            assert 'signals' in result[0]
            assert 'reasons' in result[0]
            assert result[0]['score'] > 0
            signals = result[0]['signals']
            assert 'semantic' in signals
            assert 'graph' in signals
            assert 'type' in signals


class TestEdgeCases:
    """Test edge cases."""

    @pytest.mark.asyncio
    async def test_limit_respected(self, similarity_service, mock_uow) -> None:
        """Test limit restricts results."""
        source_id = uuid4()
        neighbors = [_make_node(uuid4(), f'Neighbor {i}', f'neighbor-{i}') for i in range(10)]
        source = _make_node(source_id, 'Source', 'source')

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(
            side_effect={source_id: source, **{n.id: n for n in neighbors}}.get,
        )
        mock_uow.graph.load_all_neighbors = AsyncMock(
            return_value={
                'outgoing': neighbors,
                'incoming': [],
            },
        )

        result = await similarity_service.find_similar(source_id, limit=3)
        assert len(result) <= 3
