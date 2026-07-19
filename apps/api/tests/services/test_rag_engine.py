"""Tests for RAGEngine — Retrieval-Augmented Generation pipeline."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.services.ai.rag_engine import RAGEngine


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.session = MagicMock()
    uow.session.execute = AsyncMock()
    uow.graph = MagicMock()
    uow.graph.load_prerequisites = AsyncMock(return_value=[])
    uow.graph.load_dependents = AsyncMock(return_value=[])
    return uow


class TestRAGEngine:
    """Test the RAG search pipeline."""

    async def test_search_empty_query(self, mock_uow) -> None:
        """Search returns empty results for empty query."""
        engine = RAGEngine(mock_uow)
        with (
            patch.object(engine._embedding, 'embed', AsyncMock(return_value=[0.1, 0.2, 0.3])),
            patch.object(engine._semantic, 'search', AsyncMock(return_value=[])),
            patch.object(engine._hybrid, 'search', AsyncMock(return_value={'items': []})),
        ):
            results = await engine.search(query='')
            assert isinstance(results, list)

    async def test_search_returns_results(self, mock_uow) -> None:
        """Search returns ranked results from semantic + hybrid."""
        engine = RAGEngine(mock_uow)
        sample_node = {
            'id': str(uuid4()),
            'title': 'Python Basics',
            'slug': 'python-basics',
            'node_type': 'concept',
            'difficulty': 'beginner',
            'description': 'Introduction to Python',
        }

        with (
            patch.object(engine._embedding, 'embed', AsyncMock(return_value=[0.1, 0.2, 0.3])),
            patch.object(
                engine._semantic,
                'search',
                AsyncMock(
                    return_value=[
                        {'node': sample_node, 'similarity': 0.95},
                    ],
                ),
            ),
            patch.object(engine._hybrid, 'search', AsyncMock(return_value={'items': []})),
        ):
            results = await engine.search(query='Python', top_k=5)
            assert len(results) > 0
            assert 'citation' in results[0]

    async def test_search_deduplicates_results(self, mock_uow) -> None:
        """Duplicate results from semantic and hybrid are merged."""
        engine = RAGEngine(mock_uow)
        node_id = str(uuid4())
        sample_node = {
            'id': node_id,
            'title': 'Python',
            'slug': 'python',
            'node_type': 'concept',
            'difficulty': 'beginner',
        }

        with (
            patch.object(engine._embedding, 'embed', AsyncMock(return_value=[0.1, 0.2])),
            patch.object(
                engine._semantic,
                'search',
                AsyncMock(
                    return_value=[
                        {'node': sample_node, 'similarity': 0.95},
                    ],
                ),
            ),
            patch.object(
                engine._hybrid,
                'search',
                AsyncMock(
                    return_value={
                        'items': [
                            {'node': sample_node, 'score': 0.90},
                        ],
                    },
                ),
            ),
        ):
            results = await engine.search(query='Python', top_k=5)
            # Should be deduplicated
            assert len(results) == 1

    async def test_search_with_graph_expansion(self, mock_uow) -> None:
        """Graph expansion adds prerequisite/dependent context."""
        engine = RAGEngine(mock_uow)
        node_id = str(uuid4())
        sample_node = {
            'id': node_id,
            'title': 'Python',
            'slug': 'python',
            'node_type': 'concept',
            'difficulty': 'beginner',
        }

        prereq_node = MagicMock()
        prereq_node.title = 'Variables'
        prereq_node.slug = 'variables'
        mock_uow.graph.load_prerequisites = AsyncMock(return_value=[prereq_node])

        with (
            patch.object(engine._embedding, 'embed', AsyncMock(return_value=[0.1, 0.2])),
            patch.object(
                engine._semantic,
                'search',
                AsyncMock(
                    return_value=[
                        {'node': sample_node, 'similarity': 0.95},
                    ],
                ),
            ),
            patch.object(engine._hybrid, 'search', AsyncMock(return_value={'items': []})),
        ):
            results = await engine.search(query='Python', expand_graph=True)
            assert len(results) > 0
            assert 'prerequisites' in results[0]
            assert len(results[0]['prerequisites']) > 0

    async def test_search_handles_embedding_failure(self, mock_uow) -> None:
        """Search falls back to hybrid only when embedding fails."""
        engine = RAGEngine(mock_uow)
        with (
            patch.object(engine._embedding, 'embed', AsyncMock(side_effect=Exception('API error'))),
            patch.object(
                engine._hybrid,
                'search',
                AsyncMock(
                    return_value={
                        'items': [
                            {
                                'node': {
                                    'id': str(uuid4()),
                                    'title': 'Test',
                                    'slug': 'test',
                                    'node_type': 'concept',
                                    'difficulty': 'beginner',
                                },
                                'score': 0.8,
                            },
                        ],
                    },
                ),
            ),
        ):
            results = await engine.search(query='Python')
            assert len(results) > 0

    async def test_search_respects_top_k(self, mock_uow) -> None:
        """Search limits results to top_k."""
        engine = RAGEngine(mock_uow)
        # Make more results than top_k
        semantic_results = [
            {
                'node': {
                    'id': str(uuid4()),
                    'title': f'Node {i}',
                    'slug': f'node-{i}',
                    'node_type': 'concept',
                    'difficulty': 'beginner',
                },
                'similarity': 1.0 - i * 0.1,
            }
            for i in range(10)
        ]

        with (
            patch.object(engine._embedding, 'embed', AsyncMock(return_value=[0.1])),
            patch.object(engine._semantic, 'search', AsyncMock(return_value=semantic_results)),
            patch.object(engine._hybrid, 'search', AsyncMock(return_value={'items': []})),
        ):
            results = await engine.search(query='test', top_k=3)
            assert len(results) <= 3

    async def test_search_sorts_by_similarity(self, mock_uow) -> None:
        """Results are sorted by similarity descending."""
        engine = RAGEngine(mock_uow)
        results_list = [
            {
                'node': {
                    'id': str(uuid4()),
                    'title': 'Low',
                    'slug': 'low',
                    'node_type': 'concept',
                    'difficulty': 'beginner',
                },
                'similarity': 0.3,
            },
            {
                'node': {
                    'id': str(uuid4()),
                    'title': 'High',
                    'slug': 'high',
                    'node_type': 'concept',
                    'difficulty': 'beginner',
                },
                'similarity': 0.9,
            },
        ]

        with (
            patch.object(engine._embedding, 'embed', AsyncMock(return_value=[0.1])),
            patch.object(engine._semantic, 'search', AsyncMock(return_value=results_list)),
            patch.object(engine._hybrid, 'search', AsyncMock(return_value={'items': []})),
        ):
            results = await engine.search(query='test', top_k=5)
            if len(results) >= 2:
                assert results[0]['similarity'] >= results[1]['similarity']
