"""
Gemini embedding provider — uses Google Gemini Embedding API.

Supports embedding-001 and text-embedding-004 models.
"""

from __future__ import annotations

import os

import httpx
from structlog.stdlib import get_logger

from app.services.ai.providers.base import EmbeddingProvider, EmbeddingResult

logger = get_logger(__name__)

DEFAULT_MODEL = 'text-embedding-004'
DEFAULT_DIMENSIONS = 768
GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'


class GeminiEmbeddingProvider(EmbeddingProvider):
    """Embedding provider using Google's Gemini Embedding API.

    Configuration:
        ``GEMINI_API_KEY``: Google AI API key (env var)
        ``GEMINI_EMBEDDING_MODEL``: Model name (default: text-embedding-004)
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        dimensions: int = DEFAULT_DIMENSIONS,
    ) -> None:
        self._api_key = api_key or os.getenv('GEMINI_API_KEY', '')
        self._model = model
        self._dimensions = dimensions
        self._client = httpx.AsyncClient(timeout=30.0)

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimensions(self) -> int:
        return self._dimensions

    async def embed(self, text: str) -> EmbeddingResult:
        """Generate an embedding using the Gemini API."""
        url = f'{GEMINI_API_BASE}/models/{self._model}:embedContent?key={self._api_key}'
        response = await self._client.post(
            url,
            json={
                'content': {
                    'parts': [{'text': text}],
                },
            },
        )
        response.raise_for_status()
        data = response.json()

        embedding = data.get('embedding', {}).get('values', [0.0] * self._dimensions)
        return EmbeddingResult(
            vector=embedding,
            model=self._model,
            dimensions=len(embedding),
        )

    async def embed_batch(self, texts: list[str]) -> list[EmbeddingResult]:
        """Generate embeddings for multiple texts.

        Gemini's API doesn't support native batching, so we call
        sequentially but use connection pooling via httpx.
        """
        if not texts:
            return []

        results = []
        for text in texts:
            result = await self.embed(text)
            results.append(result)

        return results

    async def validate_connection(self) -> bool:
        """Check if the Gemini API is reachable."""
        if not self._api_key:
            logger.warning('gemini_no_api_key')
            return False
        try:
            result = await self.embed('test')
            return result.dimensions > 0
        except Exception as exc:
            logger.warning('gemini_connection_failed', error=str(exc))
            return False

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
