"""Embedding provider implementations — pluggable backends."""

from __future__ import annotations

from app.services.ai.providers.base import EmbeddingProvider, EmbeddingResult
from app.services.ai.providers.ollama import OllamaEmbeddingProvider
from app.services.ai.providers.openai import OpenAIEmbeddingProvider

__all__ = [
    'EmbeddingProvider',
    'EmbeddingResult',
    'OpenAIEmbeddingProvider',
    'OllamaEmbeddingProvider',
]
