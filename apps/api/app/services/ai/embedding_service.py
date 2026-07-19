"""Embedding Service — generates and manages vector embeddings for the knowledge graph.

Provides:
- Single and batch embedding generation
- Embedding cache (in-memory, future: Redis)
- Re-indexing support
- Provider-agnostic design via EmbeddingProvider interface

All API endpoints use this service rather than providers directly.
"""

from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

from app.services.ai.providers.ollama import OllamaEmbeddingProvider
from app.services.ai.providers.openai import OpenAIEmbeddingProvider

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork
    from app.services.ai.providers.base import EmbeddingProvider, EmbeddingResult

logger = get_logger(__name__)


class ProviderType(StrEnum):
    """Supported embedding provider types."""

    OPENAI = 'openai'
    OLLAMA = 'ollama'


class EmbeddingService:
    """Provider-agnostic embedding service with caching.

    Configuration is read from environment variables:
        ``AI_EMBEDDING_PROVIDER``: 'openai' (default) or 'ollama'
        ``OPENAI_API_KEY``: Required for OpenAI provider
        ``OLLAMA_URL``: Optional, defaults to http://localhost:11434

    Future: Add Redis caching layer for production deployments.
    """

    def __init__(
        self,
        uow: UnitOfWork | None = None,
        provider: EmbeddingProvider | None = None,
    ) -> None:
        self._uow = uow
        self._provider = provider or self._create_default_provider()
        self._cache: dict[str, list[float]] = {}
        self._cache_hits = 0
        self._cache_misses = 0

    @property
    def provider(self) -> EmbeddingProvider:
        """The current embedding provider."""
        return self._provider

    @property
    def model_name(self) -> str:
        return self._provider.model_name

    @property
    def dimensions(self) -> int:
        return self._provider.dimensions

    # ── Embedding Generation ───────────────────────────────────────

    async def embed(self, text: str, use_cache: bool = True) -> list[float]:
        """Generate an embedding vector for a text string.

        Args:
            text: The text to embed.
            use_cache: If True, checks the in-memory cache first.

        Returns:
            A list of floats representing the embedding vector.

        """
        if use_cache and text in self._cache:
            self._cache_hits += 1
            return self._cache[text]

        self._cache_misses += 1
        result = await self._provider.embed(text)

        if use_cache:
            self._cache[text] = result.vector

        logger.debug(
            'embedding_generated',
            model=self._provider.model_name,
            dimensions=result.dimensions,
            tokens=result.tokens_used,
            cache_size=len(self._cache),
        )

        return result.vector

    async def embed_batch(
        self,
        texts: list[str],
        use_cache: bool = True,
    ) -> list[list[float]]:
        """Generate embeddings for multiple texts.

        Uncached texts are batched to the provider, then cached.
        """
        if not texts:
            return []

        if use_cache:
            cached: list[list[float]] = []
            uncached_indices: list[int] = []
            uncached_texts: list[str] = []

            for i, text in enumerate(texts):
                if text in self._cache:
                    cached.append(self._cache[text])
                    self._cache_hits += 1
                else:
                    uncached_indices.append(i)
                    uncached_texts.append(text)

            if not uncached_texts:
                return self._reorder_results(texts, cached, uncached_indices, [])

            results = await self._provider.embed_batch(uncached_texts)

            for text, result in zip(uncached_texts, results, strict=False):
                self._cache[text] = result.vector
                self._cache_misses += 1

            return self._reorder_results(texts, cached, uncached_indices, results)

        results = await self._provider.embed_batch(texts)
        return [r.vector for r in results]

    async def embed_node(self, node_id: UUID) -> list[float] | None:
        """Generate an embedding for a knowledge node's content.

        Combines title, description, and content for a richer embedding.
        """
        if not self._uow:
            return None

        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        if not node:
            return None

        text = f'{node.title}\n\n{node.description}'
        if node.content:
            text += f'\n\n{node.content[:5000]}'

        return await self.embed(text)

    # ── Index Management ───────────────────────────────────────────

    async def reindex_all(self) -> dict:
        """Re-index all published knowledge nodes.

        Returns stats about the re-indexing operation.
        """
        if not self._uow:
            return {'error': 'No database connection', 'nodes_processed': 0}

        nodes = await self._uow.knowledge_nodes.find_published()
        texts = []
        node_ids = []

        for node in nodes:
            text = f'{node.title}\n\n{node.description}'
            if node.content:
                text += f'\n\n{node.content[:5000]}'
            texts.append(text)
            node_ids.append(node.id)

        # Batch embed
        embeddings = await self.embed_batch(texts, use_cache=False)

        # Store embeddings in node metadata (future: dedicated vector table)
        updated_count = 0
        for node_id, embedding in zip(node_ids, embeddings, strict=False):
            if not self._uow:
                continue
            node = await self._uow.knowledge_nodes.get_by_id(node_id)
            if node:
                metadata = dict(node.extra_metadata or {})
                metadata['embedding'] = embedding[:100]  # Store truncated for metadata
                metadata['embedding_model'] = self._provider.model_name
                metadata['embedding_dimensions'] = len(embedding)
                await self._uow.knowledge_nodes.update(
                    node_id,
                    extra_metadata=metadata,
                )
                updated_count += 1

        logger.info(
            'reindex_complete',
            nodes_processed=len(nodes),
            embeddings_generated=len(embeddings),
            updated=updated_count,
        )

        self._cache.clear()

        return {
            'nodes_processed': len(nodes),
            'embeddings_generated': len(embeddings),
            'nodes_updated': updated_count,
            'model': self._provider.model_name,
            'dimensions': self._provider.dimensions,
        }

    async def get_cache_stats(self) -> dict:
        """Get embedding cache statistics."""
        total = self._cache_hits + self._cache_misses
        hit_rate = (self._cache_hits / total * 100) if total > 0 else 0.0
        return {
            'cache_size': len(self._cache),
            'cache_hits': self._cache_hits,
            'cache_misses': self._cache_misses,
            'hit_rate_percent': round(hit_rate, 1),
        }

    # ── Helpers ────────────────────────────────────────────────────

    def _create_default_provider(self) -> EmbeddingProvider:
        """Create the default provider based on environment configuration."""
        import os

        provider_type = os.getenv('AI_EMBEDDING_PROVIDER', 'openai').lower()

        if provider_type == 'ollama':
            ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
            ollama_model = os.getenv('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text')
            return OllamaEmbeddingProvider(
                base_url=ollama_url,
                model=ollama_model,
            )

        # Default: OpenAI
        api_key = os.getenv('OPENAI_API_KEY', '')
        model = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')
        dims = int(os.getenv('OPENAI_EMBEDDING_DIMENSIONS', '1536'))
        return OpenAIEmbeddingProvider(
            api_key=api_key,
            model=model,
            dimensions=dims,
        )

    def _reorder_results(
        self,
        original_texts: list[str],
        _cached: list[list[float]],
        uncached_indices: list[int],
        uncached_results: list[EmbeddingResult],
    ) -> list[list[float]]:
        """Re-embed batched results back into original text order."""
        result_map: dict[int, list[float]] = {}
        for i, text in enumerate(original_texts):
            if text in self._cache:
                result_map[i] = self._cache[text]
        for idx, res in zip(uncached_indices, uncached_results, strict=False):
            result_map[idx] = res.vector

        return [result_map[i] for i in range(len(original_texts))]
