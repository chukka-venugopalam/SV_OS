"""Tests for domain-specific AI engines — Tutor, Planner, Career, Project, Quiz."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest

from app.services.ai.domain_engines import (
    CareerMentor, LearningPlanner, ProjectMentor, QuizEngine, TutorEngine,
)
from app.services.ai.providers.llm_base import LLMResponse


@pytest.fixture
def mock_uow():
    uow = MagicMock()
    uow.session = MagicMock()
    uow.session.execute = AsyncMock()
    uow.knowledge_nodes = MagicMock()
    uow.knowledge_nodes.find_by_slug = AsyncMock()
    uow.careers = MagicMock()
    uow.careers.find_by_slug = AsyncMock()
    uow.graph = MagicMock()
    uow.graph.load_prerequisites = AsyncMock(return_value=[])
    return uow


@pytest.fixture(autouse=True)
def patch_domain_engines():
    """Patch all external service dependencies used by domain engines."""
    with patch('app.services.ai.domain_engines.ContextEngine') as MockCtx:
        mock_ctx = MagicMock()
        mock_ctx.build_context = AsyncMock(return_value={
            'knowledge_graph': {}, 'user_progress': {}, 'activity': [],
            'recommendations': [], 'career': [], 'projects': [], 'ai_memory': [],
        })
        mock_ctx.build_node_context = AsyncMock(return_value={'knowledge_graph': {}})
        MockCtx.return_value = mock_ctx

        with patch('app.services.ai.domain_engines.RAGEngine') as MockRAG:
            mock_rag = MagicMock()
            mock_rag.search = AsyncMock(return_value=[])
            MockRAG.return_value = mock_rag

            with patch('app.services.ai.domain_engines.ChatService') as MockChat:
                mock_provider = MagicMock()
                mock_provider.model_name = 'test-model'
                mock_provider.chat = AsyncMock(
                    return_value=LLMResponse(content='', model='test-model', usage={})
                )
                mock_chat = MagicMock()
                mock_chat._provider = mock_provider
                mock_chat._format_citations = MagicMock(return_value=[])
                MockChat.return_value = mock_chat
                yield


class TestTutorEngine:
    """Test the TutorEngine for concept explanation."""

    async def test_tutor_returns_content(self, mock_uow, patch_domain_engines):
        engine = TutorEngine(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Python is a programming language...', model='test-model', usage={}
        ))
        result = await engine.tutor(
            user_id=uuid4(), message='Explain Python', difficulty='beginner',
        )
        assert 'content' in result
        assert result['content'] == 'Python is a programming language...'
        assert 'citations' in result
        assert 'suggestions' in result

    async def test_tutor_includes_node_context(self, mock_uow, patch_domain_engines):
        engine = TutorEngine(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Python Basics content', model='test-model', usage={}
        ))
        result = await engine.tutor(
            user_id=uuid4(), message='Explain Python', node_slug='python-basics',
        )
        assert result['content'] == 'Python Basics content'


class TestLearningPlanner:
    """Test the LearningPlanner for generating learning plans."""

    async def test_generate_plan_returns_plan(self, mock_uow, patch_domain_engines):
        engine = LearningPlanner(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Weekly plan: Study Python...', model='test-model', usage={}
        ))
        result = await engine.generate_plan(
            user_id=uuid4(), goal='Learn Python', plan_type='weekly',
        )
        assert 'plan' in result
        assert 'suggestions' in result
        assert result['plan_type'] == 'weekly'

    async def test_generate_plan_includes_goal(self, mock_uow, patch_domain_engines):
        engine = LearningPlanner(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Plan content', model='test-model', usage={}
        ))
        result = await engine.generate_plan(
            user_id=uuid4(), goal='Master React', plan_type='monthly',
        )
        assert result['goal'] == 'Master React'


class TestCareerMentor:
    """Test the CareerMentor for skill analysis."""

    async def test_analyse_returns_content(self, mock_uow, patch_domain_engines):
        engine = CareerMentor(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Your skills analysis...', model='test-model', usage={}
        ))
        result = await engine.analyse(
            user_id=uuid4(), message='What career is right for me?',
        )
        assert 'content' in result
        assert 'suggestions' in result

    async def test_analyse_with_career_target(self, mock_uow, patch_domain_engines):
        engine = CareerMentor(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Data Science requires...', model='test-model', usage={}
        ))
        result = await engine.analyse(
            user_id=uuid4(), message='Am I ready?', target_career_slug='data-scientist',
        )
        assert 'content' in result


class TestProjectMentor:
    """Test the ProjectMentor for project guidance."""

    async def test_mentor_returns_content(self, mock_uow, patch_domain_engines):
        engine = ProjectMentor(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Build a REST API...', model='test-model', usage={}
        ))
        result = await engine.mentor(
            user_id=uuid4(), project_description='Build a web app',
            tech_stack=['React', 'Node'],
        )
        assert 'content' in result
        assert 'suggestions' in result

    async def test_mentor_without_tech_stack(self, mock_uow, patch_domain_engines):
        engine = ProjectMentor(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='Start with basics...', model='test-model', usage={}
        ))
        result = await engine.mentor(
            user_id=uuid4(), project_description='Build anything', tech_stack=None,
        )
        assert 'content' in result


class TestQuizEngine:
    """Test the QuizEngine for generating quizzes."""

    async def test_generate_quiz_returns_questions(self, mock_uow, patch_domain_engines):
        engine = QuizEngine(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='{"quiz": [{"question": "Q?", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "E"}]}',
            model='test-model', usage={},
        ))
        result = await engine.generate_quiz(
            user_id=uuid4(), topic='Python', quiz_type='mcq',
        )
        assert 'questions' in result
        assert len(result['questions']) > 0

    async def test_generate_quiz_fallback_parsing(self, mock_uow, patch_domain_engines):
        """Quiz engine falls back to basic parsing when JSON fails."""
        engine = QuizEngine(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='What is Python?\n\nWhat is a variable?',
            model='test-model', usage={},
        ))
        result = await engine.generate_quiz(
            user_id=uuid4(), topic='Python',
        )
        assert 'questions' in result

    async def test_generate_quiz_different_types(self, mock_uow, patch_domain_engines):
        """Quiz generates different types."""
        engine = QuizEngine(mock_uow)
        engine._chat._provider.chat = AsyncMock(return_value=LLMResponse(
            content='{"quiz": [{"question": "Q1", "options": ["A"], "correct_answer": "A", "explanation": "E"}]}',
            model='test-model', usage={},
        ))
        for qt in ('mcq', 'flashcards', 'true_false'):
            result = await engine.generate_quiz(
                user_id=uuid4(), topic='Python', quiz_type=qt,
            )
            assert 'questions' in result
