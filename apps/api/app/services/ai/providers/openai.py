"""OpenAI embedding provider — uses OpenAI Embeddings API.

Supports text-embedding-3-small, text-embedding-3-large, and
text-embedding-ada-002 models.
"""

from __future__ import annotations

import os

import httpx
from structlog.stdlib import get_logger

from app.services.ai.providers.base import EmbeddingProvider, EmbeddingResult

logger = get_logger(__name__)

DEFAULT_MODEL = 'text-embedding-3-small'
DEFAULT_DIMENSIONS = 1536
EMBEDDING_API_URL = 'https://api.openai.com/v1/embeddings'


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """Embedding provider using OpenAI's Embeddings API.

    Configuration:
        ``OPENAI_API_KEY``: OpenAI API key (env var)
        ``OPENAI_EMBEDDING_MODEL``: Model name (default: text-embedding-3-small)
        ``OPENAI_EMBEDDING_DIMENSIONS``: Vector dimensions (default: 1536)
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        dimensions: int = DEFAULT_DIMENSIONS,
        base_url: str = EMBEDDING_API_URL,
    ) -> None:
        self._api_key = api_key or os.getenv('OPENAI_API_KEY', '')
        self._model = model
        self._dimensions = dimensions
        self._base_url = base_url
        self._client = httpx.AsyncClient(timeout=30.0)

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimensions(self) -> int:
        return self._dimensions

    async def embed(self, text: str) -> EmbeddingResult:
        """Generate an embedding using the OpenAI API."""
        response = await self._client.post(
            self._base_url,
            headers=self._headers(),
            json={
                'model': self._model,
                'input': text,
            },
        )
        response.raise_for_status()
        data = response.json()

        usage = data.get('usage', {})
        token_count = usage.get('total_tokens', 0)

        return EmbeddingResult(
            vector=data['data'][0]['embedding'],
            model=self._model,
            dimensions=len(data['data'][0]['embedding']),
            tokens_used=token_count,
        )

    async def embed_batch(self, texts: list[str]) -> list[EmbeddingResult]:
        """Generate embeddings for multiple texts in a single API call."""
        if not texts:
            return []

        response = await self._client.post(
            self._base_url,
            headers=self._headers(),
            json={
                'model': self._model,
                'input': texts,
            },
        )
        response.raise_for_status()
        data = response.json()

        usage = data.get('usage', {})
        total_tokens = usage.get('total_tokens', 0)
        per_item_tokens = total_tokens // max(len(texts), 1)

        # Results may not be in order — sort by index
        sorted_data = sorted(data['data'], key=lambda x: x['index'])
        results = []
        for item in sorted_data:
            results.append(
                EmbeddingResult(
                    vector=item['embedding'],
                    model=self._model,
                    dimensions=len(item['embedding']),
                    tokens_used=per_item_tokens,
                ),
            )

        return results

    async def validate_connection(self) -> bool:
        """Check if the OpenAI API is reachable with current credentials."""
        if not self._api_key:
            logger.warning('openai_no_api_key')
            return False
        try:
            result = await self.embed('test')
            return result.dimensions > 0
        except Exception as exc:
            logger.warning('openai_connection_failed', error=str(exc))
            return False

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()

    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._api_key}',
            'Content-Type': 'application/json',
        }
