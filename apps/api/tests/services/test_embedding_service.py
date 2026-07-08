"""Tests for EmbeddingService — provider abstraction, caching, reindex.

Tests verify embedding generation, caching behavior, batch processing,
and edge cases using mocked providers.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.ai.embedding_service import EmbeddingService
from app.services.ai.providers.base import EmbeddingProvider, EmbeddingResult


class MockProvider(EmbeddingProvider):
    """A mock embedding provider for testing."""

    def __init__(self, dimensions: int = 4):
        self._dimensions = dimensions
        self._model_name = 'mock-model'
        self._call_count = 0

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def dimensions(self) -> int:
        return self._dimensions

    async def embed(self, text: str) -> EmbeddingResult:
        self._call_count += 1
        return EmbeddingResult(
            vector=[0.1] * self._dimensions,
            model=self._model_name,
            dimensions=self._dimensions,
            tokens_used=len(text),
        )

    async def embed_batch(self, texts: list[str]) -> list[EmbeddingResult]:
        self._call_count += 1
        return [
            EmbeddingResult(
                vector=[0.1] * self._dimensions,
                model=self._model_name,
                dimensions=self._dimensions,
                tokens_used=len(t),
            )
            for t in texts
        ]

    async def validate_connection(self) -> bool:
        return True


@pytest.fixture
def mock_provider():
    return MockProvider(dimensions=4)


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.knowledge_nodes = AsyncMock()
    return uow


class TestEmbeddingService:
    """Test embedding generation."""

    @pytest.mark.asyncio
    async def test_embed_single_text(self, mock_provider):
        """Test embedding a single text string."""
        service = EmbeddingService(provider=mock_provider)
        result = await service.embed('test text')

        assert len(result) == 4
        assert all(v == 0.1 for v in result)

    @pytest.mark.asyncio
    async def test_embed_with_cache(self, mock_provider):
        """Test caching reduces provider calls."""
        service = EmbeddingService(provider=mock_provider)

        result1 = await service.embed('same text')
        result2 = await service.embed('same text')

        assert result1 == result2
        assert mock_provider._call_count == 1  # Only 1 provider call

    @pytest.mark.asyncio
    async def test_embed_without_cache(self, mock_provider):
        """Test disabling cache forces provider calls."""
        service = EmbeddingService(provider=mock_provider)

        await service.embed('some text', use_cache=False)
        await service.embed('some text', use_cache=False)

        assert mock_provider._call_count == 2

    @pytest.mark.asyncio
    async def test_embed_empty_text(self, mock_provider):
        """Test embedding an empty string."""
        service = EmbeddingService(provider=mock_provider)
        result = await service.embed('')
        assert len(result) == 4


class TestBatchEmbedding:
    """Test batch embedding."""

    @pytest.mark.asyncio
    async def test_batch_empty(self, mock_provider):
        """Test batch with empty list returns empty."""
        service = EmbeddingService(provider=mock_provider)
        result = await service.embed_batch([])
        assert result == []

    @pytest.mark.asyncio
    async def test_batch_multiple_texts(self, mock_provider):
        """Test batch with multiple texts."""
        service = EmbeddingService(provider=mock_provider)
        results = await service.embed_batch(['text a', 'text b', 'text c'])

        assert len(results) == 3
        assert all(len(v) == 4 for v in results)

    @pytest.mark.asyncio
    async def test_batch_with_cache(self, mock_provider):
        """Test batch with cached texts."""
        service = EmbeddingService(provider=mock_provider)

        # First call populates cache
        await service.embed('text a')
        # Second call uses cache
        results = await service.embed_batch(['text a', 'text b'])

        assert len(results) == 2
        # text a was cached, text b caused a provider call
        assert mock_provider._call_count >= 2  # 1 for embed, 1 for batch


class TestCacheStats:
    """Test cache statistics."""

    @pytest.mark.asyncio
    async def test_cache_stats_initial(self, mock_provider):
        """Test cache stats start empty."""
        service = EmbeddingService(provider=mock_provider)
        stats = await service.get_cache_stats()

        assert stats['cache_size'] == 0
        assert stats['cache_hits'] == 0
        assert stats['cache_misses'] == 0

    @pytest.mark.asyncio
    async def test_cache_stats_after_operations(self, mock_provider):
        """Test cache stats reflect operations."""
        service = EmbeddingService(provider=mock_provider)

        await service.embed('first')     # miss
        await service.embed('first')     # hit
        await service.embed('second')    # miss

        stats = await service.get_cache_stats()

        assert stats['cache_size'] == 2
        assert stats['cache_hits'] == 1
        assert stats['cache_misses'] == 2
        assert stats['hit_rate_percent'] == pytest.approx(33.3, rel=0.1)


class TestEmbedNode:
    """Test embedding a knowledge node."""

    @pytest.mark.asyncio
    async def test_embed_node_no_uow(self, mock_provider):
        """Test embed_node returns None without UoW."""
        service = EmbeddingService(provider=mock_provider)
        result = await service.embed_node(uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_embed_node_not_found(self, mock_provider, mock_uow):
        """Test embed_node returns None for missing node."""
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=None)
        service = EmbeddingService(uow=mock_uow, provider=mock_provider)

        result = await service.embed_node(uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_embed_node_success(self, mock_provider, mock_uow):
        """Test embed_node returns embedding for existing node."""
        node = MagicMock()
        node.id = uuid4()
        node.title = 'Test Node'
        node.description = 'A test description'
        node.content = None
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=node)

        service = EmbeddingService(uow=mock_uow, provider=mock_provider)
        result = await service.embed_node(node.id)

        assert result is not None
        assert len(result) == 4


class TestReindex:
    """Test reindex_all."""

    @pytest.mark.asyncio
    async def test_reindex_no_uow(self, mock_provider):
        """Test reindex returns error without UoW."""
        service = EmbeddingService(provider=mock_provider)
        result = await service.reindex_all()

        assert 'error' in result
        assert result['nodes_processed'] == 0

    @pytest.mark.asyncio
    async def test_reindex_empty(self, mock_provider, mock_uow):
        """Test reindex with no published nodes."""
        mock_uow.knowledge_nodes.find_published = AsyncMock(return_value=[])
        mock_uow.knowledge_nodes.get_by_id = AsyncMock(return_value=None)

        service = EmbeddingService(uow=mock_uow, provider=mock_provider)
        result = await service.reindex_all()

        assert result['nodes_processed'] == 0
        assert result['embeddings_generated'] == 0


class TestProviderSelection:
    """Test default provider selection."""

    @pytest.mark.asyncio
    async def test_default_provider_is_openai(self):
        """Test default creates OpenAI provider."""
        import os
        original = os.environ.get('AI_EMBEDDING_PROVIDER')
        if 'AI_EMBEDDING_PROVIDER' in os.environ:
            del os.environ['AI_EMBEDDING_PROVIDER']

        service = EmbeddingService()
        # Default should be OpenAI
        assert 'openai' in service.provider.model_name.lower() or service.provider.model_name.startswith('text-embedding')

        if original:
            os.environ['AI_EMBEDDING_PROVIDER'] = original
