"""Tests for ChatService — conversational AI with streaming, context, and citations."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.services.ai.chat_service import ChatService
from app.services.ai.providers.llm_base import LLMResponse


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.session = MagicMock()
    uow.session.execute = AsyncMock()
    uow.flush = AsyncMock()
    # Mock execute result for preferences query
    pref_result = MagicMock()
    pref_result.one_or_none = MagicMock(return_value=None)
    uow.session.execute = AsyncMock(return_value=pref_result)
    return uow


@pytest.fixture
def mock_provider():
    provider = MagicMock()
    provider.model_name = 'test-model'
    provider.chat = AsyncMock(
        return_value=LLMResponse(
            content='This is a test response.',
            model='test-model',
            usage={'total_tokens': 10, 'prompt_tokens': 5, 'completion_tokens': 5},
        ),
    )
    provider.chat_stream = AsyncMock()
    return provider


@pytest.fixture
def mock_session():
    session = MagicMock()
    session.id = uuid4()
    session.user_id = uuid4()
    session.title = 'Test'
    session.session_type = 'chat'
    session.message_count = 0
    session.messages = []
    return session


class TestChatService:
    """Test the core ChatService functionality with proper mocks."""

    @pytest.fixture(autouse=True)
    def _patch_dependencies(self, mock_uow, mock_provider, mock_session):  # noqa: ARG002
        """Patch ALL external dependencies before each test."""
        patches = [
            patch.object(ChatService, '_create_provider', return_value=mock_provider),
            patch.object(
                ChatService,
                '_get_preferences',
                AsyncMock(
                    return_value={
                        'explanation_style': 'balanced',
                        'temperature': 0.7,
                        'max_tokens': 2048,
                        'auto_generate_titles': False,
                        'include_citations': True,
                    },
                ),
            ),
            patch.object(
                ChatService,
                '_get_or_create_session',
                AsyncMock(return_value=mock_session),
            ),
            patch.object(ChatService, '_create_session', AsyncMock(return_value=mock_session)),
        ]
        for p in patches:
            p.start()
        yield
        for p in patches:
            p.stop()

    def _make_service(self, mock_uow, mock_provider):
        """Create a ChatService with properly configured internals."""
        service = ChatService(mock_uow)
        service._provider = mock_provider
        service._context_engine = MagicMock()
        service._context_engine.build_context = AsyncMock(
            return_value={
                'knowledge_graph': {},
                'user_progress': {},
                'activity': [],
                'recommendations': [],
                'career': [],
                'projects': [],
                'ai_memory': [],
            },
        )
        service._rag = MagicMock()
        service._rag.search = AsyncMock(return_value=[])
        return service

    async def test_chat_returns_response(self, mock_uow, mock_provider) -> None:
        """Chat returns a dict with session_id, message, suggestions."""
        service = self._make_service(mock_uow, mock_provider)
        user_id = uuid4()
        result = await service.chat(user_id=user_id, message='Hello')
        assert isinstance(result, dict)
        assert 'session_id' in result
        assert 'message' in result
        assert result['message']['role'] == 'assistant'
        assert result['message']['content'] == 'This is a test response.'

    async def test_chat_with_existing_session(self, mock_uow, mock_provider) -> None:
        """Chat reuses an existing session."""
        service = self._make_service(mock_uow, mock_provider)
        session_id = uuid4()
        user_id = uuid4()
        result = await service.chat(
            user_id=user_id,
            message='Hello',
            session_id=session_id,
        )
        assert result['session_id'] is not None

    async def test_chat_with_citations(self, mock_uow, mock_provider) -> None:
        """Citations are returned when RAG finds results."""
        service = self._make_service(mock_uow, mock_provider)
        service._rag.search = AsyncMock(
            return_value=[
                {
                    'node': {'title': 'Test Node', 'slug': 'test-node', 'node_type': 'concept'},
                    'similarity': 0.95,
                },
            ],
        )
        user_id = uuid4()
        result = await service.chat(user_id=user_id, message='Hello')
        assert len(result.get('citations', [])) > 0
        assert result['citations'][0]['title'] == 'Test Node'

    async def test_chat_stream_yields_tokens(self, mock_uow, mock_provider) -> None:
        """Chat stream yields token events."""
        service = self._make_service(mock_uow, mock_provider)

        async def mock_stream(messages, temperature=0.7, max_tokens=2048):  # noqa: ARG001
            yield 'Hello'
            yield ' world'

        mock_provider.chat_stream = mock_stream

        user_id = uuid4()
        events = []
        async for event in service.chat_stream(user_id=user_id, message='Hi'):
            events.append(event)

        assert len(events) > 0
        token_events = [e for e in events if '"type":"token"' in e]
        assert len(token_events) > 0

    async def test_system_prompt_building(self, mock_uow, mock_provider) -> None:
        """System prompt includes knowledge graph and user progress data."""
        service = self._make_service(mock_uow, mock_provider)
        context = {
            'knowledge_graph': {
                'current_node': {
                    'title': 'Python Basics',
                    'difficulty': 'beginner',
                    'node_type': 'concept',
                },
                'prerequisites': [{'title': 'Variables'}],
            },
            'user_progress': {
                'completion_percentage': 45,
                'completed_nodes': 10,
                'remaining_nodes': 12,
                'weak_topics': ['Loops'],
            },
            'career': ['Software Engineer'],
        }
        prompt = service._build_system_prompt(context, [], {})
        assert 'Python Basics' in prompt
        assert '45%' in prompt
        assert 'Software Engineer' in prompt

    async def test_system_prompt_styles(self, mock_uow, mock_provider) -> None:
        """System prompt adapts to explanation style preferences."""
        service = self._make_service(mock_uow, mock_provider)
        for style, expected in [
            ('simple', 'simple terms'),
            ('detailed', 'thorough'),
            ('socratic', 'through questions'),
            ('example_driven', 'examples'),
        ]:
            prompt = service._build_system_prompt({}, [], {'explanation_style': style})
            assert expected in prompt.lower()

    async def test_title_generation(self, mock_uow, mock_provider) -> None:
        """Auto-generates short titles from first message."""
        service = self._make_service(mock_uow, mock_provider)
        title = await service._generate_title('Can you explain Python?')
        assert title
        assert len(title) <= 80

    async def test_suggestions_extraction(self, mock_uow, mock_provider) -> None:
        """Suggestions are extracted from bullet points in response."""
        service = self._make_service(mock_uow, mock_provider)
        response = 'Key points:\n- Learn Python\n- Then Django\n- Finally deploy'
        suggestions = await service._generate_suggestions('', response)
        assert len(suggestions) > 0
        assert any('Learn Python' in s for s in suggestions)

    async def test_suggestions_fallback(self, mock_uow, mock_provider) -> None:
        """Suggestions fallback when no bullet points found."""
        service = self._make_service(mock_uow, mock_provider)
        suggestions = await service._generate_suggestions('', 'Just a plain response')
        assert len(suggestions) >= 2
