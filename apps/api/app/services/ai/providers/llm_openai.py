"""OpenAI chat provider — GPT-4o, GPT-4, GPT-3.5 via Chat Completions API."""

from __future__ import annotations

import json
import os
from typing import TYPE_CHECKING

import httpx
from structlog.stdlib import get_logger

from app.services.ai.providers.llm_base import LLMMessage, LLMProvider, LLMResponse

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

logger = get_logger(__name__)

DEFAULT_MODEL = 'gpt-4o'
API_BASE = 'https://api.openai.com/v1'


class OpenAIChatProvider(LLMProvider):
    """OpenAI chat completion provider."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str = API_BASE,
    ) -> None:
        self._api_key = api_key or os.getenv('OPENAI_API_KEY', '')
        self._model = model or os.getenv('OPENAI_CHAT_MODEL', DEFAULT_MODEL)
        self._base_url = base_url
        self._client = httpx.AsyncClient(timeout=60.0)

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
            f'{self._base_url}/chat/completions',
            headers=self._headers(),
            json={
                'model': self._model,
                'messages': [{'role': m.role, 'content': m.content} for m in messages],
                'temperature': temperature,
                'max_tokens': max_tokens,
                'stream': False,
            },
        )
        response.raise_for_status()
        data = response.json()
        choice = data['choices'][0]
        usage = data.get('usage', {})
        return LLMResponse(
            content=choice['message']['content'],
            model=data['model'],
            usage={
                'prompt_tokens': usage.get('prompt_tokens', 0),
                'completion_tokens': usage.get('completion_tokens', 0),
                'total_tokens': usage.get('total_tokens', 0),
            },
            finish_reason=choice.get('finish_reason', 'stop'),
        )

    async def chat_stream(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        async with (
            httpx.AsyncClient(timeout=120.0) as client,
            client.stream(
                'POST',
                f'{self._base_url}/chat/completions',
                headers=self._headers(),
                json={
                    'model': self._model,
                    'messages': [{'role': m.role, 'content': m.content} for m in messages],
                    'temperature': temperature,
                    'max_tokens': max_tokens,
                    'stream': True,
                },
            ) as response,
        ):
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line or line.startswith(':') or line == 'data: [DONE]':
                    continue
                if line.startswith('data: '):
                    try:
                        chunk = json.loads(line[6:])
                        delta = chunk.get('choices', [{}])[0].get('delta', {})
                        token = delta.get('content', '')
                        if token:
                            yield token
                    except (json.JSONDecodeError, IndexError, KeyError):
                        continue

    async def validate_connection(self) -> bool:
        if not self._api_key:
            return False
        try:
            result = await self.chat([LLMMessage(role='user', content='test')], max_tokens=1)
            return bool(result.content)
        except Exception:
            return False

    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._api_key}',
            'Content-Type': 'application/json',
        }
