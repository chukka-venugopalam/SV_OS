"""Anthropic chat provider — Claude 3.5 Sonnet, Claude 3 Opus via Messages API."""

from __future__ import annotations

import json
import os
from typing import AsyncGenerator

import httpx
from structlog.stdlib import get_logger

from app.services.ai.providers.llm_base import LLMMessage, LLMProvider, LLMResponse

logger = get_logger(__name__)

DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'
API_BASE = 'https://api.anthropic.com/v1'


class AnthropicChatProvider(LLMProvider):
    """Anthropic Claude chat completion provider."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        self._api_key = api_key or os.getenv('ANTHROPIC_API_KEY', '')
        self._model = model or os.getenv('ANTHROPIC_CHAT_MODEL', DEFAULT_MODEL)
        self._client = httpx.AsyncClient(timeout=60.0)
        self._api_version = '2023-06-01'

    @property
    def model_name(self) -> str:
        return self._model

    async def chat(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        system_msgs = [m for m in messages if m.role == 'system']
        chat_msgs = [m for m in messages if m.role != 'system']

        payload = {
            'model': self._model,
            'max_tokens': max_tokens,
            'temperature': temperature,
            'messages': [{'role': m.role, 'content': m.content} for m in chat_msgs],
        }
        if system_msgs:
            payload['system'] = system_msgs[0].content

        response = await self._client.post(
            f'{API_BASE}/messages',
            headers=self._headers(),
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        content = data.get('content', [{}])[0].get('text', '') if data.get('content') else ''
        usage = data.get('usage', {})
        return LLMResponse(
            content=content,
            model=data.get('model', self._model),
            usage={'input_tokens': usage.get('input_tokens', 0),
                   'output_tokens': usage.get('output_tokens', 0)},
            finish_reason=data.get('stop_reason', 'stop'),
        )

    async def chat_stream(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        system_msgs = [m for m in messages if m.role == 'system']
        chat_msgs = [m for m in messages if m.role != 'system']

        payload = {
            'model': self._model,
            'max_tokens': max_tokens,
            'temperature': temperature,
            'stream': True,
            'messages': [{'role': m.role, 'content': m.content} for m in chat_msgs],
        }
        if system_msgs:
            payload['system'] = system_msgs[0].content

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                'POST',
                f'{API_BASE}/messages',
                headers=self._headers(),
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line or not line.startswith('data: '):
                        continue
                    try:
                        chunk = json.loads(line[6:])
                        if chunk.get('type') == 'content_block_delta':
                            delta = chunk.get('delta', {})
                            token = delta.get('text', '')
                            if token:
                                yield token
                    except (json.JSONDecodeError, KeyError):
                        continue

    async def validate_connection(self) -> bool:
        if not self._api_key:
            return False
        try:
            result = await self.chat([LLMMessage(role='user', content='ping')], max_tokens=1)
            return bool(result.content)
        except Exception:
            return False

    def _headers(self) -> dict:
        return {
            'x-api-key': self._api_key,
            'anthropic-version': self._api_version,
            'Content-Type': 'application/json',
        }
