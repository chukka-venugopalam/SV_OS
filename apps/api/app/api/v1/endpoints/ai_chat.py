"""AI Chat API endpoints — complete conversational AI layer.

Endpoints:
- POST /ai/chat — Non-streaming chat
- POST /ai/chat/stream — Streaming chat (SSE)
- POST /ai/tutor — Tutor interaction
- POST /ai/planner — Generate learning plan
- POST /ai/project-mentor — Project mentor
- POST /ai/career-mentor — Career mentor
- POST /ai/quiz — Generate quiz
- POST /ai/explain — Explain a concept
- GET /ai/conversations — List conversations
- POST /ai/conversations — Create conversation
- DELETE /ai/conversations/{id} — Delete conversation
- PUT /ai/conversations/{id} — Update conversation
- GET /ai/conversations/{id}/messages — Get conversation messages
- GET /ai/preferences — Get AI preferences
- PUT /ai/preferences — Update AI preferences
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_uow
from app.schemas.response import build_success_response
from app.services.ai.chat_service import ChatService
from app.services.ai.domain_engines import (
    CareerMentor,
    LearningPlanner,
    ProjectMentor,
    QuizEngine,
    TutorEngine,
)

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork
    from app.schemas.chat import (
        CareerMentorRequest,
        ChatRequest,
        PlannerRequest,
        ProjectMentorRequest,
        QuizRequest,
        TutorRequest,
        UpdateConversationRequest,
    )

logger = get_logger(__name__)

router = APIRouter()


# ── Chat (Non-Streaming) ───────────────────────────────────────────


@router.post('/chat')
async def chat(
    body: ChatRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Send a message and get a complete (non-streaming) response."""
    service = ChatService(uow)
    result = await service.chat(
        user_id=current_user_id,
        message=body.message,
        session_id=body.session_id,
        session_type=body.session_type,
        temperature=body.temperature,
        regenerate=body.regenerate,
    )
    return build_success_response(data=result, message='Chat response generated')


# ── Chat (Streaming) ───────────────────────────────────────────────


@router.post('/chat/stream')
async def chat_stream(
    body: ChatRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    """Send a message and stream the response via SSE."""
    service = ChatService(uow)

    async def event_stream():
        async for event in service.chat_stream(
            user_id=current_user_id,
            message=body.message,
            session_id=body.session_id,
            session_type=body.session_type,
            temperature=body.temperature,
        ):
            yield event

    return StreamingResponse(
        event_stream(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    )


# ── Tutor ──────────────────────────────────────────────────────────


@router.post('/tutor')
async def tutor(
    body: TutorRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get a tutor response for a concept or question."""
    engine = TutorEngine(uow)
    result = await engine.tutor(
        user_id=current_user_id,
        message=body.message,
        node_slug=body.node_slug,
        difficulty=body.difficulty,
        style=body.style,
    )
    return build_success_response(data=result, message='Tutor response generated')


# ── Learning Planner ───────────────────────────────────────────────


@router.post('/planner')
async def planner(
    body: PlannerRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Generate a personalised learning plan."""
    engine = LearningPlanner(uow)
    result = await engine.generate_plan(
        user_id=current_user_id,
        goal=body.goal,
        plan_type=body.plan_type,
        difficulty=body.difficulty,
        hours_per_week=body.estimated_hours_per_week,
    )
    return build_success_response(data=result, message='Learning plan generated')


# ── Career Mentor ──────────────────────────────────────────────────


@router.post('/career-mentor')
async def career_mentor(
    body: CareerMentorRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get career guidance and analysis."""
    engine = CareerMentor(uow)
    result = await engine.analyse(
        user_id=current_user_id,
        message=body.message,
        target_career_slug=body.target_career_slug,
    )
    return build_success_response(data=result, message='Career analysis generated')


# ── Project Mentor ─────────────────────────────────────────────────


@router.post('/project-mentor')
async def project_mentor(
    body: ProjectMentorRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get project guidance and roadmap."""
    engine = ProjectMentor(uow)
    result = await engine.mentor(
        user_id=current_user_id,
        project_description=body.project_description,
        tech_stack=body.tech_stack,
        difficulty=body.difficulty,
    )
    return build_success_response(data=result, message='Project roadmap generated')


# ── Explain ─────────────────────────────────────────────────────────


@router.post('/explain')
async def explain(
    body: TutorRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get an explanation for a concept."""
    engine = TutorEngine(uow)
    result = await engine.tutor(
        user_id=current_user_id,
        message=f'Explain this concept in detail: {body.message}',
        node_slug=body.node_slug,
        difficulty=body.difficulty,
        style=body.style or 'detailed',
    )
    return build_success_response(data=result, message='Explanation generated')


# ── Quiz ────────────────────────────────────────────────────────────


@router.post('/quiz')
async def generate_quiz(
    body: QuizRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Generate a quiz on a specific topic."""
    engine = QuizEngine(uow)
    result = await engine.generate_quiz(
        user_id=current_user_id,
        topic=body.topic,
        quiz_type=body.quiz_type,
        difficulty=body.difficulty,
        question_count=body.question_count,
        node_slug=body.node_slug,
    )
    return build_success_response(data=result, message='Quiz generated')


# ── Conversations ──────────────────────────────────────────────────


@router.get('/conversations')
async def list_conversations(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
    session_type: Annotated[str | None, Query(description='Filter by type')] = None,
) -> dict:
    """List conversations for the authenticated user."""
    filters = ''
    params = {'uid': current_user_id, 'limit': per_page, 'offset': (page - 1) * per_page}

    if session_type:
        filters = 'AND session_type = :stype'
        params['stype'] = session_type

    result = await uow.session.execute(
        f'SELECT id, title, session_type, message_count, is_archived, created_at '
        f'FROM chat_sessions WHERE user_id = :uid AND is_deleted = false {filters} '
        f'ORDER BY created_at DESC LIMIT :limit OFFSET :offset',
        params,
    )
    items = []
    for row in result.all():
        items.append(
            {
                'id': str(row[0]),
                'title': row[1],
                'session_type': row[2],
                'message_count': row[3],
                'is_archived': row[4],
                'created_at': row[5].isoformat() if row[5] else None,
            },
        )

    count = await uow.session.execute(
        f'SELECT COUNT(*) FROM chat_sessions WHERE user_id = :uid AND is_deleted = false {filters}',
        {'uid': current_user_id}
        if not session_type
        else {'uid': current_user_id, 'stype': session_type},
    )
    total = count.scalar() or 0
    total_pages = max(1, (total + per_page - 1) // per_page) if total else 1

    return build_success_response(
        data={
            'items': items,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
        },
        message='Conversations retrieved',
    )


@router.post('/conversations', status_code=status.HTTP_201_CREATED)
async def create_conversation(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Create a new conversation."""
    from app.models.chat_session import ChatSession

    session = ChatSession(user_id=current_user_id, title='New Conversation')
    uow.session.add(session)
    await uow.flush()
    await uow.session.refresh(session)

    return build_success_response(
        data={
            'id': str(session.id),
            'title': session.title,
            'session_type': session.session_type,
            'created_at': session.created_at.isoformat() if session.created_at else None,
        },
        message='Conversation created',
    )


@router.get('/conversations/{session_id}/messages')
async def get_conversation_messages(
    session_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get all messages for a conversation."""
    rows = await uow.session.execute(
        'SELECT cm.id, cm.session_id, cm.role, cm.content, cm.content_type, '
        'cm.token_count, cm.model_used, cm.created_at '
        'FROM chat_messages cm JOIN chat_sessions cs ON cs.id = cm.session_id '
        'WHERE cm.session_id = :sid AND cs.user_id = :uid AND cm.is_deleted = false '
        'ORDER BY cm.created_at',
        {'sid': session_id, 'uid': current_user_id},
    )
    messages = [
        {
            'id': str(r[0]),
            'session_id': str(r[1]),
            'role': r[2],
            'content': r[3],
            'content_type': r[4],
            'token_count': r[5],
            'model_used': r[6],
            'created_at': r[7].isoformat() if r[7] else None,
        }
        for r in rows.all()
    ]

    return build_success_response(
        data={'items': messages, 'count': len(messages)},
        message='Messages retrieved',
    )


@router.put('/conversations/{session_id}')
async def update_conversation(
    session_id: UUID,
    body: UpdateConversationRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Update conversation title or archive status."""
    updates = []
    params = {'sid': session_id, 'uid': current_user_id}
    if body.title is not None:
        updates.append('title = :title')
        params['title'] = body.title
    if body.is_archived is not None:
        updates.append('is_archived = :archived')
        params['archived'] = body.is_archived

    if updates:
        await uow.session.execute(
            f'UPDATE chat_sessions SET {", ".join(updates)} WHERE id = :sid AND user_id = :uid',
            params,
        )
        await uow.flush()

    return build_success_response(message='Conversation updated')


@router.delete('/conversations/{session_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    session_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> None:
    """Soft-delete a conversation."""
    await uow.session.execute(
        'UPDATE chat_sessions SET is_deleted = true WHERE id = :sid AND user_id = :uid',
        {'sid': session_id, 'uid': current_user_id},
    )
    await uow.flush()


# ── AI Preferences ─────────────────────────────────────────────────


@router.get('/preferences')
async def get_ai_preferences(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get AI interaction preferences for the user."""
    row = await uow.session.execute(
        'SELECT preferred_model, explanation_style, temperature, max_tokens, '
        'auto_generate_titles, include_citations '
        'FROM ai_preferences WHERE user_id = :uid AND is_deleted = false',
        {'uid': current_user_id},
    )
    r = row.one_or_none()
    if r:
        data = {
            'preferred_model': r[0],
            'explanation_style': r[1] or 'balanced',
            'temperature': float(r[2]) if r[2] else 0.7,
            'max_tokens': r[3] or 2048,
            'auto_generate_titles': bool(r[4]) if r[4] is not None else True,
            'include_citations': bool(r[5]) if r[5] is not None else True,
        }
    else:
        data = {
            'preferred_model': None,
            'explanation_style': 'balanced',
            'temperature': 0.7,
            'max_tokens': 2048,
            'auto_generate_titles': True,
            'include_citations': True,
        }

    return build_success_response(data=data, message='Preferences retrieved')


@router.put('/preferences')
async def update_ai_preferences(
    body: dict,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Update AI interaction preferences."""
    allowed = {
        'preferred_model',
        'explanation_style',
        'temperature',
        'max_tokens',
        'auto_generate_titles',
        'include_citations',
    }
    updates = {k: v for k, v in body.items() if k in allowed}

    if updates:
        # Upsert pattern
        existing = await uow.session.execute(
            'SELECT id FROM ai_preferences WHERE user_id = :uid AND is_deleted = false',
            {'uid': current_user_id},
        )
        if existing.one_or_none():
            set_clause = ', '.join(f'{k} = :{k}' for k in updates)
            updates['uid'] = current_user_id
            await uow.session.execute(
                f'UPDATE ai_preferences SET {set_clause} WHERE user_id = :uid',
                updates,
            )
        else:
            updates['user_id'] = current_user_id
            cols = ', '.join(updates.keys())
            vals = ', '.join(f':{k}' for k in updates)
            await uow.session.execute(
                f'INSERT INTO ai_preferences ({cols}) VALUES ({vals})',
                updates,
            )
        await uow.flush()

    return build_success_response(message='Preferences updated')
