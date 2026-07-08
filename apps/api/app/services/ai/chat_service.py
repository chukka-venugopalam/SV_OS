"""
Chat Service — production conversational AI with streaming, RAG, and citations.

Manages:
- Multiple conversation sessions
- Streaming responses via SSE
- Context injection from ContextEngine
- Citation generation from RAG results
- Follow-up suggestion generation
- Conversation title auto-generation
- Provider selection via environment variables
"""

from __future__ import annotations

import os
import re
from typing import AsyncGenerator
from uuid import UUID, uuid4

from structlog.stdlib import get_logger

from app.models.chat_session import ChatMessage, ChatSession
from app.repositories import UnitOfWork
from app.services.ai.context_engine import ContextEngine
from app.services.ai.providers.llm_anthropic import AnthropicChatProvider
from app.services.ai.providers.llm_base import LLMMessage, LLMProvider
from app.services.ai.providers.llm_deepseek import DeepSeekChatProvider
from app.services.ai.providers.llm_openai import OpenAIChatProvider
from app.services.ai.rag_engine import RAGEngine

logger = get_logger(__name__)

# Maximum conversation history to include
MAX_HISTORY_MESSAGES = 20
MAX_HISTORY_TOKENS = 8000


class ChatService:
    """Production conversational AI with fullcontext, streaming, and citations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._provider = self._create_provider()
        self._context_engine = ContextEngine(uow)
        self._rag = RAGEngine(uow)

    # ── Provider Factory ───────────────────────────────────────────

    def _create_provider(self) -> LLMProvider:
        provider = os.getenv('AI_CHAT_PROVIDER', 'openai').lower()
        if provider == 'anthropic':
            return AnthropicChatProvider()
        elif provider == 'deepseek':
            return DeepSeekChatProvider()
        elif provider == 'ollama':
            from app.services.ai.providers.llm_ollama import OllamaChatProvider
            return OllamaChatProvider()
        return OpenAIChatProvider()

    # ── Chat (Non-Streaming) ───────────────────────────────────────

    async def chat(
        self,
        user_id: UUID,
        message: str,
        session_id: UUID | None = None,
        session_type: str = 'chat',
        temperature: float | None = None,
        regenerate: bool = False,
    ) -> dict:
        """Send a message and get a complete (non-streaming) response."""
        session = await self._get_or_create_session(user_id, session_id, session_type)
        prefs = await self._get_preferences(user_id)

        temp = temperature if temperature is not None else prefs.get('temperature', 0.7)
        max_tokens = prefs.get('max_tokens', 2048)
        include_citations = prefs.get('include_citations', True)

        # Remove last assistant message if regenerating
        if regenerate:
            await self._remove_last_assistant(session.id)

        # Save user message
        user_msg = await self._save_message(session.id, 'user', message)
        user_msg_id = user_msg.id if hasattr(user_msg, 'id') else uuid4()

        # Build context and RAG
        context = await self._context_engine.build_context(user_id=user_id)
        rag_results = await self._rag.search(message, top_k=5) if include_citations else []

        # Build messages
        llm_messages = self._build_messages(
            session=session,
            user_message=message,
            context=context,
            rag_results=rag_results,
            prefs=prefs,
        )

        # Call provider
        response = await self._provider.chat(
            messages=llm_messages,
            temperature=temp,
            max_tokens=max_tokens,
        )

        # Save assistant message
        assistant_msg = await self._save_message(
            session.id, 'assistant', response.content,
            model_used=response.model,
            token_count=response.usage.get('total_tokens', 0),
        )

        # Generate suggestions
        suggestions = await self._generate_suggestions(message, response.content)

        # Auto-generate title
        title = None
        if prefs.get('auto_generate_titles', True) and session.message_count <= 1:
            title = await self._generate_title(message)
            if title:
                await self._uow.session.execute(
                    'UPDATE chat_sessions SET title = :title WHERE id = :id',
                    {'title': title, 'id': session.id},
                )
                await self._uow.flush()

        return {
            'session_id': session.id,
            'message': {
                'id': str(assistant_msg.id),
                'session_id': str(session.id),
                'role': 'assistant',
                'content': response.content,
                'content_type': 'markdown',
                'token_count': response.usage.get('total_tokens', 0),
                'model_used': response.model,
                'created_at': assistant_msg.created_at.isoformat() if getattr(assistant_msg, 'created_at', None) else None,
            },
            'suggestions': suggestions,
            'citations': self._format_citations(rag_results),
        }

    # ── Streaming Chat ─────────────────────────────────────────────

    async def chat_stream(
        self,
        user_id: UUID,
        message: str,
        session_id: UUID | None = None,
        session_type: str = 'chat',
        temperature: float | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream a chat response token by token via SSE."""
        session = await self._get_or_create_session(user_id, session_id, session_type)
        prefs = await self._get_preferences(user_id)

        temp = temperature if temperature is not None else prefs.get('temperature', 0.7)
        max_tokens = prefs.get('max_tokens', 2048)
        include_citations = prefs.get('include_citations', True)

        # Save user message
        await self._save_message(session.id, 'user', message)

        # Build context and RAG
        context = await self._context_engine.build_context(user_id=user_id)
        rag_results = await self._rag.search(message, top_k=5) if include_citations else []

        # Build messages
        llm_messages = self._build_messages(
            session=session, user_message=message,
            context=context, rag_results=rag_results, prefs=prefs,
        )

        # Stream the response
        full_content = ''
        async for token in self._provider.chat_stream(
            messages=llm_messages, temperature=temp, max_tokens=max_tokens,
        ):
            full_content += token
            yield f'data: {{\"type\":\"token\",\"content\":\"{self._escape_json(token)}\"}}\n\n'

        # Save assistant message
        assistant = await self._save_message(
            session.id, 'assistant', full_content,
            model_used=self._provider.model_name,
        )

        # Generate suggestions
        suggestions = await self._generate_suggestions(message, full_content)

        # Auto-generate title
        if prefs.get('auto_generate_titles', True) and session.message_count <= 1:
            title = await self._generate_title(message)
            if title:
                await self._uow.session.execute(
                    'UPDATE chat_sessions SET title = :title WHERE id = :id',
                    {'title': title, 'id': session.id},
                )
                await self._uow.flush()

        # Send completion event
        import json
        done_data = {
            'type': 'done',
            'session_id': str(session.id),
            'suggestions': suggestions,
            'citations': self._format_citations(rag_results),
        }
        yield f'data: {json.dumps(done_data)}\n\n'

    # ── Message Building ───────────────────────────────────────────

    def _build_messages(
        self, session, user_message: str, context: dict,
        rag_results: list, prefs: dict,
    ) -> list[LLMMessage]:
        """Build the LLM message array with system prompt, context, and history."""
        messages = []

        # System prompt with context
        system = self._build_system_prompt(context, rag_results, prefs)
        messages.append(LLMMessage(role='system', content=system))

        # Conversation history (last N messages)
        history = list(session.messages) if hasattr(session, 'messages') else []
        for msg in history[-MAX_HISTORY_MESSAGES * 2:]:
            if msg.role in ('user', 'assistant'):
                messages.append(LLMMessage(role=msg.role, content=msg.content))

        # Current user message
        messages.append(LLMMessage(role='user', content=user_message))

        return messages

    def _build_system_prompt(
        self, context: dict, rag_results: list, prefs: dict,
    ) -> str:
        """Build the system prompt with injected context."""
        style = prefs.get('explanation_style', 'balanced')
        style_guide = {
            'simple': 'Explain in simple terms. Use analogies. Avoid jargon.',
            'detailed': 'Provide thorough, detailed explanations with depth.',
            'balanced': 'Balance clarity with depth. Default mode.',
            'socratic': 'Guide through questions. Encourage discovery.',
            'example_driven': 'Lead with practical examples. Show before telling.',
        }.get(style, 'Be clear and helpful.')

        parts = [
            'You are SV-OS, an AI-native Learning Operating System.',
            'You have deep knowledge of the user\'s learning journey.',
            '',
            style_guide,
            '',
            '## Knowledge Graph Context',
        ]

        kg = context.get('knowledge_graph', {})
        if kg.get('current_node'):
            n = kg['current_node']
            parts.append(f'- Current topic: {n["title"]} ({n["difficulty"]}, {n["node_type"]})')
        if kg.get('prerequisites'):
            parts.append(f'- Prerequisites: {", ".join(n["title"] for n in kg["prerequisites"][:5])}')
        if kg.get('related_nodes'):
            parts.append(f'- Related: {", ".join(n["title"] for n in kg["related_nodes"][:5])}')

        up = context.get('user_progress', {})
        if up:
            parts.extend([
                '',
                '## User Progress',
                f'- Overall: {up.get("completion_percentage", 0)}% complete',
                f'- Completed: {up.get("completed_nodes", 0)} nodes',
                f'- Remaining: {up.get("remaining_nodes", 0)} nodes',
            ])
            if up.get('weak_topics'):
                parts.append(f'- Areas needing review: {", ".join(up["weak_topics"][:3])}')
            if up.get('next_recommended_node'):
                parts.append(f'- Recommended next: {up["next_recommended_node"]}')

        if rag_results:
            parts.extend(['', '## Knowledge Base Context (RAG)'])
            for r in rag_results[:5]:
                title = r.get('node', {}).get('title', '') or r.get('title', '')
                slug = r.get('node', {}).get('slug', '') or r.get('slug', '')
                parts.append(f'- {title} (/{slug})')

        if context.get('career'):
            parts.extend(['', '## Career Goals', f'- {", ".join(context["career"][:3])}'])

        parts.extend([
            '',
            '## Response Guidelines',
            '- Use markdown formatting.',
            '- Cite knowledge graph topics by slug: `[Topic](/slug)`.',
            '- Suggest 2-3 follow-up questions at the end.',
            '- Be concise but thorough.',
            '- If referencing a knowledge node, mention its slug.',
        ])

        return '\n'.join(parts)

    # ── Session Management ─────────────────────────────────────────

    async def _get_or_create_session(
        self, user_id: UUID, session_id: UUID | None, session_type: str,
    ) -> ChatSession:
        if session_id:
            session = await self._uow.session.get(ChatSession, session_id)
            if session and session.user_id == user_id:
                return session
        return await self._create_session(user_id, session_type)

    async def _create_session(
        self, user_id: UUID, session_type: str,
    ) -> ChatSession:
        session = ChatSession(
            user_id=user_id, title='New Conversation',
            session_type=session_type,
        )
        self._uow.session.add(session)
        await self._uow.flush()
        await self._uow.session.refresh(session)
        return session

    async def _save_message(
        self, session_id: UUID, role: str, content: str,
        model_used: str | None = None, token_count: int = 0,
    ) -> ChatMessage:
        msg = ChatMessage(
            session_id=session_id, role=role, content=content,
            model_used=model_used, token_count=token_count,
        )
        self._uow.session.add(msg)
        await self._uow.flush()
        # Update message count
        await self._uow.session.execute(
            'UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = :id',
            {'id': session_id},
        )
        await self._uow.flush()
        return msg

    async def _remove_last_assistant(self, session_id: UUID) -> None:
        await self._uow.session.execute(
            'DELETE FROM chat_messages WHERE id IN ('
            'SELECT id FROM chat_messages WHERE session_id = :sid AND role = \'assistant\' '
            'ORDER BY created_at DESC LIMIT 1)',
            {'sid': session_id},
        )
        await self._uow.flush()

    # ── Utilities ──────────────────────────────────────────────────

    async def _get_preferences(self, user_id: UUID) -> dict:
        try:
            row = await self._uow.session.execute(
                'SELECT explanation_style, temperature, max_tokens, '
                'auto_generate_titles, include_citations FROM ai_preferences '
                'WHERE user_id = :uid AND is_deleted = false',
                {'uid': user_id},
            )
            r = row.one_or_none()
            if r:
                return {
                    'explanation_style': r[0] or 'balanced',
                    'temperature': r[1] or 0.7,
                    'max_tokens': r[2] or 2048,
                    'auto_generate_titles': r[3] if r[3] is not None else True,
                    'include_citations': r[4] if r[4] is not None else True,
                }
        except Exception:
            pass
        return {'explanation_style': 'balanced', 'temperature': 0.7,
                'max_tokens': 2048, 'auto_generate_titles': True,
                'include_citations': True}

    async def _generate_suggestions(
        self, user_message: str, response: str,
    ) -> list[str]:
        """Generate follow-up suggestions based on the conversation."""
        suggestions = []
        lines = response.strip().split('\n')
        for line in reversed(lines):
            if line.startswith('- ') or line.startswith('* '):
                suggestion = line[2:].strip()
                if len(suggestion) > 10 and len(suggestion) < 120:
                    suggestions.append(suggestion)
                    if len(suggestions) >= 3:
                        break
        return suggestions[:3] if suggestions else [
            'Tell me more about this topic',
            'What should I learn next?',
            'Give me a practice exercise',
        ]

    async def _generate_title(self, message: str) -> str | None:
        """Generate a short title from the first user message."""
        title = message.strip()[:80]
        if len(title) > 30:
            # Try to find a natural break
            break_chars = ['.', '?', '!', '\n']
            for char in break_chars:
                idx = title.find(char)
                if 15 < idx < 60:
                    title = title[:idx]
                    break
        return title.strip()[:80]

    def _format_citations(self, rag_results: list) -> list[dict]:
        return [
            {
                'title': r.get('node', {}).get('title', '') or r.get('title', ''),
                'slug': r.get('node', {}).get('slug', '') or r.get('slug', ''),
                'node_type': r.get('node', {}).get('node_type', ''),
                'similarity': r.get('similarity', 0),
            }
            for r in rag_results[:5]
        ]

    def _escape_json(self, s: str) -> str:
        """Escape a string for JSON embedding."""
        return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
