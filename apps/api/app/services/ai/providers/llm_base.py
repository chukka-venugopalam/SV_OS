"""Abstract LLM provider — pluggable interface for chat/completion LLMs.

All concrete providers (OpenAI, Anthropic, Gemini, DeepSeek, Ollama)
implement this interface, allowing the AI chat service to be provider-agnostic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator


@dataclass
class LLMMessage:
    """A single message in a conversation."""

    role: str  # 'user', 'assistant', 'system'
    content: str


@dataclass
class LLMResponse:
    """Complete (non-streaming) response from an LLM."""

    content: str
    model: str
    usage: dict = field(default_factory=dict)
    finish_reason: str = 'stop'


class LLMProvider(ABC):
    """Abstract base class for LLM chat/completion providers.

    Implementations must provide:
    - ``chat()`` — Complete single response
    - ``chat_stream()`` — Streaming response via async generator
    - ``model_name`` — The model identifier
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        """The model identifier (e.g. 'gpt-4o', 'claude-3-opus')."""
        ...

    @abstractmethod
    async def chat(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Send a chat conversation and get a complete response."""
        ...

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """Send a chat conversation and stream the response tokens."""
        ...
        # This should be: yield token
        if False:
            yield ''

    @abstractmethod
    async def validate_connection(self) -> bool:
        """Validate that the provider is reachable and credentials work."""
        ...
