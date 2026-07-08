"""
Domain-specific AI engines — Tutor, Planner, Career Mentor, Project Mentor, Quiz.

Each engine has its own system prompt template and uses the context engine
and RAG engine to inject relevant knowledge graph data before LLM calls.
"""

from __future__ import annotations

import json
from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.services.ai.chat_service import ChatService
from app.services.ai.context_engine import ContextEngine
from app.services.ai.providers.llm_base import LLMMessage, LLMResponse
from app.services.ai.rag_engine import RAGEngine

logger = get_logger(__name__)


class TutorEngine:
    """AI Tutor — explains concepts, detects gaps, suggests next topics.

    Capabilities: explain, detect missing prerequisites, suggest next topics,
    generate examples, adjust to user level, analogies, summaries.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._chat = ChatService(uow)
        self._context = ContextEngine(uow)
        self._rag = RAGEngine(uow)

    async def tutor(
        self,
        user_id: UUID,
        message: str,
        node_slug: str | None = None,
        difficulty: str = 'intermediate',
        style: str | None = None,
    ) -> dict:
        context = await self._context.build_context(
            user_id=user_id, node_slug=node_slug,
        )
        rag = await self._rag.search(message, top_k=5, expand_graph=True, user_id=user_id)

        prompt_parts = [
            'You are an expert tutor in the SV-OS learning platform.',
            f'User difficulty level: {difficulty}.',
            style and f'Explanation style: {style}.' or '',
            '',
            '## Your Role',
            '- Explain concepts clearly with examples and analogies.',
            '- Detect and address missing prerequisites.',
            '- Suggest related topics the user should explore next.',
            '- Adapt explanations to the user\'s level.',
            '- Generate practical examples and summaries.',
            '- Use markdown for code blocks with language tags.',
            '',
        ]

        if context.get('knowledge_graph', {}).get('current_node'):
            n = context['knowledge_graph']['current_node']
            prompt_parts.append(f'## Current Topic: {n["title"]}')
            if context['knowledge_graph'].get('prerequisites'):
                prereqs = ', '.join(p['title'] for p in context['knowledge_graph']['prerequisites'][:5])
                prompt_parts.append(f'Prerequisites: {prereqs}')

        if context.get('user_progress', {}).get('weak_topics'):
            prompt_parts.append(f'Weak areas: {", ".join(context["user_progress"]["weak_topics"][:3])}')

        # Use the chat service with a custom system prompt
        llm = self._chat._provider
        llm_messages = [
            LLMMessage(role='system', content='\n'.join(filter(None, prompt_parts))),
            LLMMessage(role='user', content=message),
        ]

        response = await llm.chat(messages=llm_messages)
        citations = self._chat._format_citations(rag)

        return {
            'content': response.content,
            'model': response.model,
            'citations': citations,
            'suggestions': [
                'Can you give me an analogy for this?',
                'What prerequisites should I review first?',
                'Show me a practical example',
                'What should I learn after this?',
                'Give me a summary of the key points',
            ],
        }


class LearningPlanner:
    """AI Learning Planner — generates daily, weekly, monthly, and career roadmaps.

    Uses knowledge graph and user progress data to create adaptive schedules.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._chat = ChatService(uow)
        self._context = ContextEngine(uow)

    async def generate_plan(
        self,
        user_id: UUID,
        goal: str,
        plan_type: str = 'weekly',
        difficulty: str = 'intermediate',
        hours_per_week: float = 5.0,
    ) -> dict:
        context = await self._context.build_context(
            user_id=user_id, include_progress=True,
        )

        prompt = f"""You are an expert learning planner for SV-OS.

User Goal: {goal}
Plan Type: {plan_type}
Difficulty: {difficulty}
Available Hours/Week: {hours_per_week}

User Context:
- Progress: {context.get('user_progress', {}).get('completion_percentage', 0)}% complete
- Completed: {context.get('user_progress', {}).get('completed_nodes', 0)} nodes
- Weak areas: {context.get('user_progress', {}).get('weak_topics', [])}

Generate a detailed {plan_type} learning plan with:
1. Milestones with estimated duration
2. Specific topics to cover per session
3. Prerequisites to review
4. Projects or exercises to reinforce learning
5. Estimated completion timeline

Format as a structured markdown plan with clear sections.
"""

        llm = self._chat._provider
        response = await llm.chat(messages=[LLMMessage(role='user', content=prompt)])

        return {
            'plan': response.content,
            'model': response.model,
            'plan_type': plan_type,
            'goal': goal,
            'suggestions': [
                'Break this down into a daily schedule',
                'What projects can I build along the way?',
                'How much time should I allocate daily?',
                'What\'s the most efficient learning path?',
            ],
        }


class CareerMentor:
    """AI Career Mentor — analyses skills, market demand, and career readiness."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._chat = ChatService(uow)
        self._context = ContextEngine(uow)

    async def analyse(
        self,
        user_id: UUID,
        message: str,
        target_career_slug: str | None = None,
    ) -> dict:
        context = await self._context.build_context(user_id=user_id)

        career_info = ''
        if target_career_slug:
            career = await self._uow.careers.find_by_slug(target_career_slug)
            if career:
                prereqs = await self._uow.graph.load_prerequisites(career.id)
                career_info = f'Target Career: {career.title}\nDescription: {career.description}\nDemand: {getattr(career, "demand", "N/A")}\n'

        prompt = f"""You are an expert career mentor in the SV-OS learning platform.

{career_info}
User Progress: {context.get('user_progress', {}).get('completion_percentage', 0)}% complete
Completed Nodes: {context.get('user_progress', {}).get('completed_nodes', 0)}
Weak Areas: {context.get('user_progress', {}).get('weak_topics', [])}

User Question: {message}

Provide career guidance with:
1. Current skill assessment
2. Missing skills identification
3. Market demand analysis
4. Recommended learning roadmap
5. Salary expectations (if applicable)
6. Project recommendations to build portfolio
"""

        llm = self._chat._provider
        response = await llm.chat(messages=[LLMMessage(role='user', content=prompt)])

        return {
            'content': response.content,
            'model': response.model,
            'suggestions': [
                'What skills am I missing for this career?',
                'What projects should I build?',
                'How long will it take to transition?',
                'What\'s the job market like?',
            ],
        }


class ProjectMentor:
    """AI Project Mentor — guides through project planning and execution."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._chat = ChatService(uow)
        self._context = ContextEngine(uow)

    async def mentor(
        self,
        user_id: UUID,
        project_description: str,
        tech_stack: list[str] | None = None,
        difficulty: str = 'intermediate',
    ) -> dict:
        context = await self._context.build_context(user_id=user_id)
        stack = ', '.join(tech_stack) if tech_stack else 'Not specified'

        prompt = f"""You are an expert project mentor in the SV-OS learning platform.

Project Idea: {project_description}
Tech Stack: {stack}
Difficulty: {difficulty}
User Level: {context.get('user_progress', {}).get('completion_percentage', 0)}% through curriculum

Generate a complete project roadmap:
1. Required concepts to learn first
2. Project roadmap with milestones
3. Tech stack recommendations
4. Learning order (which concepts in which sequence)
5. GitHub repository structure suggestion
6. Deployment checklist
7. Estimated completion time based on difficulty

Keep it practical and actionable.
"""

        llm = self._chat._provider
        response = await llm.chat(messages=[LLMMessage(role='user', content=prompt)])

        return {
            'content': response.content,
            'model': response.model,
            'suggestions': [
                'Break this into smaller steps',
                'What prerequisites do I need?',
                'Suggest a tech stack',
                'How do I deploy this?',
            ],
        }


class QuizEngine:
    """AI Quiz Engine — generates adaptive quizzes with difficulty scaling."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._chat = ChatService(uow)
        self._rag = RAGEngine(uow)

    async def generate_quiz(
        self,
        user_id: UUID,
        topic: str,
        quiz_type: str = 'mcq',
        difficulty: str = 'intermediate',
        question_count: int = 5,
        node_slug: str | None = None,
    ) -> dict:
        rag = await self._rag.search(topic, top_k=3, expand_graph=False)

        context_text = '\n'.join(
            f'- {r["node"]["title"]}: {r["node"]["description"][:200]}'
            for r in rag
        )

        prompt = f"""You are an expert quiz generator for the SV-OS learning platform.

Topic: {topic}
Quiz Type: {quiz_type}
Difficulty: {difficulty}
Question Count: {question_count}

Knowledge Context:
{context_text}

Generate EXACTLY {question_count} questions in valid JSON format:
{{
  "quiz": [
    {{
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why this is correct"
    }}
  ]
}}

Return ONLY valid JSON, no other text.
"""

        llm = self._chat._provider
        response = await llm.chat(
            messages=[LLMMessage(role='user', content=prompt)],
            temperature=0.8,
        )

        questions = []
        try:
            parsed = json.loads(response.content)
            questions = parsed.get('quiz', [])
        except (json.JSONDecodeError, AttributeError):
            questions = await self._parse_quiz_fallback(response.content)

        return {
            'questions': questions,
            'total_questions': len(questions),
            'difficulty': difficulty,
            'topic': topic,
            'quiz_type': quiz_type,
            'suggestions': [
                'Make it more difficult',
                'Quiz me on prerequisites',
                'Give me flashcards instead',
                'Show me my weak areas',
            ],
        }

    async def _parse_quiz_fallback(self, content: str) -> list:
        """Fallback parsing if JSON extraction fails."""
        import re
        questions = []
        blocks = content.split('\n\n')
        for block in blocks[:10]:
            if '?' in block:
                questions.append({
                    'question': block.strip()[:200],
                    'options': [],
                    'correct_answer': '',
                    'explanation': '',
                })
        return questions[:10]
