"""Ollama embedding provider — local embedding models via Ollama API.

Uses Ollama's embedding endpoint to generate embeddings from
locally-run models like nomic-embed-text, mxbai-embed-large, etc.
"""

from __future__ import annotations

import httpx
from structlog.stdlib import get_logger

from app.services.ai.providers.base import EmbeddingProvider, EmbeddingResult

logger = get_logger(__name__)

DEFAULT_OLLAMA_URL = 'http://localhost:11434'
DEFAULT_MODEL = 'nomic-embed-text'
DEFAULT_DIMENSIONS = 768


class OllamaEmbeddingProvider(EmbeddingProvider):
    """Embedding provider that uses a local Ollama instance.

    Configuration:
        ``OLLAMA_URL``: Ollama server URL (default: http://localhost:11434)
        ``OLLAMA_EMBEDDING_MODEL``: Model name (default: nomic-embed-text)
    """

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_URL,
        model: str = DEFAULT_MODEL,
        dimensions: int = DEFAULT_DIMENSIONS,
    ) -> None:
        self._base_url = base_url.rstrip('/')
        self._model = model
        self._dimensions = dimensions
        self._client = httpx.AsyncClient(timeout=60.0)

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimensions(self) -> int:
        return self._dimensions

    async def embed(self, text: str) -> EmbeddingResult:
        """Generate an embedding using the Ollama API."""
        response = await self._client.post(
            f'{self._base_url}/api/embed',
            json={
                'model': self._model,
                'input': text,
            },
        )
        response.raise_for_status()
        data = response.json()

        # Ollama returns embeddings in data['embeddings'][0]
        embeddings = data.get('embeddings', [])
        if not embeddings:
            logger.error('ollama_empty_embedding', model=self._model)
            vector = [0.0] * self._dimensions
        else:
            vector = embeddings[0]

        return EmbeddingResult(
            vector=vector,
            model=self._model,
            dimensions=len(vector),
            tokens_used=data.get('prompt_eval_count', 0),
        )

    async def embed_batch(self, texts: list[str]) -> list[EmbeddingResult]:
        """Generate embeddings for multiple texts in a single request."""
        if not texts:
            return []

        response = await self._client.post(
            f'{self._base_url}/api/embed',
            json={
                'model': self._model,
                'input': texts,
            },
        )
        response.raise_for_status()
        data = response.json()

        embeddings = data.get('embeddings', [])
        results = []
        for _i, vec in enumerate(embeddings):
            results.append(
                EmbeddingResult(
                    vector=vec,
                    model=self._model,
                    dimensions=len(vec),
                    tokens_used=data.get('prompt_eval_count', 0) // max(len(texts), 1),
                ),
            )

        # Pad with zero vectors if response has fewer embeddings than input
        while len(results) < len(texts):
            results.append(
                EmbeddingResult(
                    vector=[0.0] * self._dimensions,
                    model=self._model,
                    dimensions=self._dimensions,
                ),
            )

        return results

    async def validate_connection(self) -> bool:
        """Check if the Ollama server is reachable."""
        try:
            response = await self._client.get(f'{self._base_url}/api/tags')
            response.raise_for_status()
            return True
        except Exception as exc:
            logger.warning('ollama_connection_failed', error=str(exc))
            return False

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
