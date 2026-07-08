"""
Abstract embedding provider — pluggable interface for embedding models.

All concrete providers (OpenAI, Gemini, Ollama) implement this interface,
allowing the EmbeddingService to be provider-agnostic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class EmbeddingResult:
    """Result of a single embedding operation."""

    vector: list[float]
    model: str
    dimensions: int
    tokens_used: int = 0


class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers.

    Implementations must provide:
    - ``embed()`` — Single text embedding
    - ``embed_batch()`` — Batch text embedding
    - ``model_name`` — The model identifier
    - ``dimensions`` — Output vector dimensions
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        """The model identifier (e.g. 'text-embedding-3-small')."""
        ...

    @property
    @abstractmethod
    def dimensions(self) -> int:
        """Output vector dimensions (e.g. 1536 for OpenAI)."""
        ...

    @abstractmethod
    async def embed(self, text: str) -> EmbeddingResult:
        """Generate an embedding vector for a single text string."""
        ...

    @abstractmethod
    async def embed_batch(self, texts: list[str]) -> list[EmbeddingResult]:
        """Generate embedding vectors for a batch of text strings.

        Providers should batch efficiently (e.g. up to 2048 texts per
        request for OpenAI).
        """
        ...

    @abstractmethod
    async def validate_connection(self) -> bool:
        """Validate that the provider is reachable and credentials work."""
        ...
