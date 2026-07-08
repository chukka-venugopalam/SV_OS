"""AI provider implementations — pluggable backends for embeddings and chat."""

from __future__ import annotations

from app.services.ai.providers.base import EmbeddingProvider, EmbeddingResult
from app.services.ai.providers.gemini import GeminiEmbeddingProvider
from app.services.ai.providers.llm_anthropic import AnthropicChatProvider
from app.services.ai.providers.llm_base import LLMMessage, LLMProvider, LLMResponse
from app.services.ai.providers.llm_deepseek import DeepSeekChatProvider
from app.services.ai.providers.llm_ollama import OllamaChatProvider
from app.services.ai.providers.llm_openai import OpenAIChatProvider
from app.services.ai.providers.ollama import OllamaEmbeddingProvider
from app.services.ai.providers.openai import OpenAIEmbeddingProvider

__all__ = [
    'EmbeddingProvider',
    'EmbeddingResult',
    'OpenAIEmbeddingProvider',
    'OllamaEmbeddingProvider',
    'GeminiEmbeddingProvider',
    'LLMProvider',
    'LLMMessage',
    'LLMResponse',
    'OpenAIChatProvider',
    'AnthropicChatProvider',
    'DeepSeekChatProvider',
    'OllamaChatProvider',
]
