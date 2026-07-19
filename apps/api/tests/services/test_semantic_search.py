"""Tests for SemanticSearchService — cosine similarity, nearest neighbors.

Tests verify search accuracy, threshold filtering, and edge cases
using mocked repositories.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.ai.semantic_search import SemanticSearchService


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.knowledge_nodes = AsyncMock()
    return uow


@pytest.fixture
def search_service(mock_uow):
    return SemanticSearchService(mock_uow)


def _make_node(
    node_id=None,
    title='Test',
    slug='test',
    description='A test node',
    node_type='concept',
    difficulty='beginner',
    embedding=None,
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
    node.view_count = 10
    node.extra_metadata = {}
    if embedding:
        node.extra_metadata['embedding'] = embedding
    return node


class TestCosineSimilarity:
    """Test cosine similarity computation."""

    def test_identical_vectors(self, search_service) -> None:
        """Test identical vectors have similarity 1.0."""
        vec = [1.0, 2.0, 3.0]
        sim = search_service._cosine_similarity(vec, vec)
        assert sim == pytest.approx(1.0)

    def test_orthogonal_vectors(self, search_service) -> None:
        """Test orthogonal vectors have similarity 0.0."""
        vec_a = [1.0, 0.0]
        vec_b = [0.0, 1.0]
        sim = search_service._cosine_similarity(vec_a, vec_b)
        assert sim == pytest.approx(0.0)

    def test_partial_similarity(self, search_service) -> None:
        """Test partially similar vectors."""
        vec_a = [1.0, 0.0]
        vec_b = [0.5, 0.5]
        sim = search_service._cosine_similarity(vec_a, vec_b)
        assert 0.5 < sim < 1.0

    def test_empty_vectors(self, search_service) -> None:
        """Test empty vectors return 0.0."""
        assert search_service._cosine_similarity([], []) == 0.0
        assert search_service._cosine_similarity([1.0], []) == 0.0

    def test_zero_vector(self, search_service) -> None:
        """Test zero vector returns 0.0."""
        vec_a = [1.0, 0.0]
        vec_b = [0.0, 0.0]
        sim = search_service._cosine_similarity(vec_a, vec_b)
        assert sim == 0.0


class TestSemanticSearch:
    """Test semantic search."""

    @pytest.mark.asyncio
    async def test_search_empty_results(self, search_service, mock_uow) -> None:
        """Test search returns empty when no nodes have embeddings."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(
            return_value=[
                _make_node(uuid4(), 'Node 1', 'node-1'),
            ],
        )

        results = await search_service.search(
            query_embedding=[0.1, 0.2, 0.3],
            limit=10,
        )

        assert results == []

    @pytest.mark.asyncio
    async def test_search_finds_similar(self, search_service, mock_uow) -> None:
        """Test search finds nodes with similar embeddings."""
        target_id = uuid4()
        node = _make_node(target_id, 'Target Node', 'target', embedding=[0.9, 0.1, 0.0])

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])

        results = await search_service.search(
            query_embedding=[0.9, 0.1, 0.0],
            limit=10,
        )

        assert len(results) == 1
        assert results[0]['node']['slug'] == 'target'
        assert results[0]['similarity'] > 0.9

    @pytest.mark.asyncio
    async def test_search_with_threshold(self, search_service, mock_uow) -> None:
        """Test threshold filters low-similarity results."""
        node = _make_node(uuid4(), 'Node', 'node', embedding=[0.0, 0.0, 1.0])  # Orthogonal to query

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])

        results = await search_service.search(
            query_embedding=[1.0, 0.0, 0.0],  # Orthogonal — similarity ~0
            limit=10,
            threshold=0.5,
        )

        assert results == []  # Similarity ~0, below threshold

    @pytest.mark.asyncio
    async def test_search_excludes_nodes(self, search_service, mock_uow) -> None:
        """Test search excludes specified node IDs."""
        excluded_id = uuid4()
        node = _make_node(excluded_id, 'Excluded', 'excluded', embedding=[0.9, 0.1, 0.0])

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node])

        results = await search_service.search(
            query_embedding=[0.9, 0.1, 0.0],
            limit=10,
            exclude_node_ids=[excluded_id],
        )

        assert results == []

    @pytest.mark.asyncio
    async def test_search_ranking(self, search_service, mock_uow) -> None:
        """Test results are ranked by similarity descending."""
        node_a = _make_node(uuid4(), 'Node A', 'node-a', embedding=[0.9, 0.0, 0.0])
        node_b = _make_node(uuid4(), 'Node B', 'node-b', embedding=[0.5, 0.0, 0.0])

        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[node_a, node_b])

        results = await search_service.search(
            query_embedding=[1.0, 0.0, 0.0],
            limit=10,
        )

        assert len(results) == 2
        assert results[0]['similarity'] >= results[1]['similarity']
        assert results[0]['rank'] == 1
        assert results[1]['rank'] == 2


class TestFindSimilarToNode:
    """Test find_similar_to_node."""

    @pytest.mark.asyncio
    async def test_find_similar_node_not_found(self, search_service, mock_uow) -> None:
        """Test returns empty when source node not found."""
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=None)

        results = await search_service.find_similar_to_node(uuid4())
        assert results == []

    @pytest.mark.asyncio
    async def test_find_similar_no_embedding(self, search_service, mock_uow) -> None:
        """Test returns empty when source has no embedding."""
        node = _make_node(uuid4(), 'Node', 'node')
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=node)

        results = await search_service.find_similar_to_node(uuid4())
        assert results == []

    @pytest.mark.asyncio
    async def test_find_similar_excludes_source(self, search_service, mock_uow) -> None:
        """Test source node is excluded from results."""
        source_id = uuid4()
        source = _make_node(source_id, 'Source', 'source', embedding=[0.9, 0.0, 0.0])
        other = _make_node(uuid4(), 'Other', 'other', embedding=[0.85, 0.0, 0.0])

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=source)
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[source, other])

        results = await search_service.find_similar_to_node(source_id)

        slugs = [r['node']['slug'] for r in results]
        assert 'source' not in slugs  # Source excluded
        assert 'other' in slugs


class TestSimilarityMatrix:
    """Test compute_similarity_matrix."""

    @pytest.mark.asyncio
    async def test_empty_matrix(self, search_service, mock_uow) -> None:  # noqa: ARG002
        """Test empty node list returns empty."""
        results = await search_service.compute_similarity_matrix([])
        assert results == []

    @pytest.mark.asyncio
    async def test_similarity_matrix_pairs(self, search_service, mock_uow) -> None:
        """Test matrix computes pairwise similarities."""
        node_a_id = uuid4()
        node_b_id = uuid4()
        node_a = _make_node(node_a_id, 'A', 'a', embedding=[1.0, 0.0, 0.0])
        node_b = _make_node(node_b_id, 'B', 'b', embedding=[0.9, 0.0, 0.0])

        def get_by_id_side_effect(nid):
            return {node_a_id: node_a, node_b_id: node_b}.get(nid)

        mock_uow.knowledge_nodes.get_by_id = AsyncMock(side_effect=get_by_id_side_effect)

        results = await search_service.compute_similarity_matrix([node_a_id, node_b_id])

        assert len(results) == 1
        assert results[0]['similarity'] > 0.9
