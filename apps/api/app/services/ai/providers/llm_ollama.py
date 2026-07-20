"""Ollama chat provider — local LLMs via Ollama API (Llama, Mistral, Qwen, etc.)."""

from __future__ import annotations

import json
import os
from typing import TYPE_CHECKING

import httpx
from structlog.stdlib import get_logger

from app.services.ai.providers.llm_base import LLMMessage, LLMProvider, LLMResponse
from app.services.ai.providers.ollama import DEFAULT_OLLAMA_URL

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

logger = get_logger(__name__)

DEFAULT_MODEL = 'llama3.2'


class OllamaChatProvider(LLMProvider):
    """Ollama chat completion provider for local models."""

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
    ) -> None:
        self._base_url = (base_url or os.getenv('OLLAMA_URL', DEFAULT_OLLAMA_URL)).rstrip('/')
        self._model = model or os.getenv('OLLAMA_CHAT_MODEL', DEFAULT_MODEL)
        self._client = httpx.AsyncClient(timeout=120.0)

    @property
    def model_name(self) -> str:
        return self._model

    async def chat(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        response = await self._client.post(
            f'{self._base_url}/api/chat',
            json={
                'model': self._model,
                'messages': [{'role': m.role, 'content': m.content} for m in messages],
                'options': {
                    'temperature': temperature,
                    'num_predict': max_tokens,
                },
                'stream': False,
            },
        )
        response.raise_for_status()
        data = response.json()
        return LLMResponse(
            content=data.get('message', {}).get('content', ''),
            model=data.get('model', self._model),
            usage={'total_tokens': 0},  # Ollama doesn't return token counts
        )

    async def chat_stream(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        async with (
            httpx.AsyncClient(timeout=300.0) as client,
            client.stream(
                'POST',
                f'{self._base_url}/api/chat',
                json={
                    'model': self._model,
                    'messages': [{'role': m.role, 'content': m.content} for m in messages],
                    'options': {
                        'temperature': temperature,
                        'num_predict': max_tokens,
                    },
                    'stream': True,
                },
            ) as response,
        ):
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                    token = chunk.get('message', {}).get('content', '')
                    if token:
                        yield token
                    if chunk.get('done'):
                        break
                except (json.JSONDecodeError, KeyError):
                    continue

    async def validate_connection(self) -> bool:
        try:
            response = await self._client.get(f'{self._base_url}/api/tags')
            response.raise_for_status()
            return True
        except Exception as exc:
            logger.warning('ollama_connection_failed', error=str(exc))
            return False
