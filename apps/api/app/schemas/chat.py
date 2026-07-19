"""Chat, conversation, and AI schemas — API contracts for Phase 4 AI layer.

Defines request/response schemas for:
- Chat messages and sessions
- AI memory and preferences
- Quiz generation
- Learning plans
- Tutor interactions
- Career/project mentor
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

# ── Chat Messages ──────────────────────────────────────────────────


class ChatMessageSchema(BaseModel):
    """A single chat message in API responses."""

    id: UUID = Field(description='Message identifier')
    session_id: UUID = Field(description='Parent session identifier')
    role: str = Field(description='user, assistant, or system')
    content: str = Field(description='Message content')
    content_type: str = Field(default='text', description='text, markdown, quiz, plan, etc.')
    token_count: int = Field(default=0, ge=0)
    model_used: str | None = Field(default=None)
    created_at: datetime = Field(description='When the message was created')


class ChatRequest(BaseModel):
    """Request to send a message in a conversation."""

    session_id: UUID | None = Field(default=None, description='Existing session ID or null for new')
    message: str = Field(..., min_length=1, max_length=50000, description='User message')
    session_type: str = Field(default='chat', description='chat, tutor, planner, quiz, etc.')
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    regenerate: bool = Field(default=False, description='Regenerate the last assistant response')


class ChatResponse(BaseModel):
    """Response from a chat interaction."""

    session_id: UUID = Field(description='Session ID (existing or new)')
    message: ChatMessageSchema = Field(description='Assistant response')
    suggestions: list[str] = Field(default_factory=list, description='Follow-up suggestions')
    citations: list[dict] = Field(default_factory=list, description='Knowledge graph citations')


# ── Conversations ──────────────────────────────────────────────────


class ConversationSummary(BaseModel):
    """Summary of a conversation for list views."""

    id: UUID = Field(description='Session identifier')
    title: str = Field(description='Conversation title')
    session_type: str = Field(description='Session type')
    message_count: int = Field(default=0, ge=0)
    is_archived: bool = Field(default=False)
    last_message_at: datetime | None = Field(default=None)
    created_at: datetime = Field(description='When the conversation started')


class ConversationList(BaseModel):
    """Paginated list of conversations."""

    items: list[ConversationSummary]
    total: int = Field(ge=0)
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    total_pages: int = Field(default=1, ge=1)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""

    title: str = Field(default='New Conversation', max_length=300)
    session_type: str = Field(default='chat', description='chat, tutor, planner, etc.')


class UpdateConversationRequest(BaseModel):
    """Request to update a conversation."""

    title: str | None = Field(default=None, max_length=300)
    is_archived: bool | None = Field(default=None)


# ── AI Memory ──────────────────────────────────────────────────────


class AImemorySchema(BaseModel):
    """A single memory fact about a user."""

    id: UUID = Field(description='Memory identifier')
    memory_type: str = Field(description='Type of memory')
    key: str = Field(description='Machine-readable key')
    value: str = Field(description='Human-readable value')
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    created_at: datetime = Field(description='When the memory was created')


class AIPreferenceSchema(BaseModel):
    """User AI interaction preferences."""

    preferred_model: str | None = Field(default=None)
    explanation_style: str = Field(default='balanced')
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=256, le=32768)
    auto_generate_titles: bool = Field(default=True)
    include_citations: bool = Field(default=True)


# ── Tutor ──────────────────────────────────────────────────────────


class TutorRequest(BaseModel):
    """Request for the tutor engine."""

    message: str = Field(..., min_length=1, description='Question or topic')
    node_slug: str | None = Field(default=None, description='Specific knowledge node slug')
    difficulty: str = Field(default='intermediate', description='beginner, intermediate, advanced')
    style: str | None = Field(
        default=None,
        description='simple, detailed, socratic, example_driven',
    )


# ── Planner ────────────────────────────────────────────────────────


class PlannerRequest(BaseModel):
    """Request to generate a learning plan."""

    goal: str = Field(..., min_length=1, description='Learning goal')
    plan_type: str = Field(default='weekly', description='daily, weekly, monthly, career_roadmap')
    difficulty: str = Field(default='intermediate')
    estimated_hours_per_week: float = Field(default=5.0, ge=1.0, le=80.0)


# ── Career Mentor ──────────────────────────────────────────────────


class CareerMentorRequest(BaseModel):
    """Request for career mentor analysis."""

    target_career_slug: str | None = Field(default=None, description='Target career slug')
    message: str = Field(..., min_length=1, description='Question or career goal')


# ── Project Mentor ─────────────────────────────────────────────────


class ProjectMentorRequest(BaseModel):
    """Request for project mentor guidance."""

    project_description: str = Field(..., min_length=1, description='Project idea')
    tech_stack: list[str] = Field(default_factory=list, description='Preferred technologies')
    difficulty: str = Field(default='intermediate')


# ── Quiz ───────────────────────────────────────────────────────────


class QuizRequest(BaseModel):
    """Request to generate a quiz."""

    topic: str = Field(..., min_length=1, description='Topic to quiz on')
    quiz_type: str = Field(
        default='mcq',
        description='mcq, flashcards, coding, interview, fill_blanks, true_false',
    )
    difficulty: str = Field(default='intermediate')
    question_count: int = Field(default=5, ge=1, le=20)
    node_slug: str | None = Field(default=None)


class QuizAnswer(BaseModel):
    """A single answer submission."""

    question_index: int = Field(ge=0)
    answer: str
    time_taken_seconds: int | None = Field(default=None, ge=0)


class QuizSubmission(BaseModel):
    """Submission of quiz answers for scoring."""

    quiz_id: UUID = Field(description='Quiz history ID')
    answers: list[QuizAnswer]


class QuizResult(BaseModel):
    """Result of a scored quiz."""

    quiz_id: UUID
    score: float = Field(ge=0.0, le=100.0)
    correct_count: int = Field(ge=0)
    total_questions: int = Field(ge=0)
    weak_topics: list[str] = Field(default_factory=list)
    answers: list[dict] = Field(default_factory=list)
