"""Search API endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_optional_user_id, get_uow
from app.repositories import UnitOfWork
from app.schemas.response import success_response
from app.services.search import SearchService

logger = get_logger(__name__)

router = APIRouter()


@router.get('')
async def search(
    q: str = Query('', min_length=1, description='Search query'),
    node_type: str | None = Query(None, description='Filter by node type'),
    difficulty: str | None = Query(None, description='Filter by difficulty'),
    page: int = Query(1, ge=1, description='Page number'),
    per_page: int = Query(20, ge=1, le=100, description='Items per page'),
    current_user_id: UUID | None = Depends(get_optional_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Full-text search across knowledge nodes with optional filters."""
    if not q.strip():
        return success_response(
            data={'items': [], 'total': 0, 'page': page, 'per_page': per_page, 'total_pages': 0},
            message='No query provided',
        )

    service = SearchService(uow)
    result = await service.search(
        query=q.strip(),
        node_type=node_type,
        difficulty=difficulty,
        page=page,
        per_page=per_page,
        user_id=current_user_id,
    )
    return success_response(
        data={
            'items': [_node_to_dict(n) for n in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Search results',
    )


@router.get('/suggestions')
async def get_suggestions(
    q: str = Query('', min_length=1, description='Partial query for suggestions'),
    limit: int = Query(10, ge=1, le=20, description='Number of suggestions'),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get autocomplete suggestions based on partial query."""
    if not q.strip():
        return success_response(data={'items': []}, message='No suggestions')

    service = SearchService(uow)
    suggestions = await service.get_suggestions(query=q.strip(), limit=limit)
    return success_response(
        data={'items': suggestions},
        message='Suggestions retrieved',
    )


@router.get('/history')
async def get_search_history(
    page: int = Query(1, ge=1, description='Page number'),
    per_page: int = Query(20, ge=1, le=100, description='Items per page'),
    current_user_id: UUID = Depends(get_current_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get search history for the authenticated user."""
    service = SearchService(uow)
    result = await service.get_search_history(
        user_id=current_user_id,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data={
            'items': [_history_to_dict(h) for h in result.items],
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        },
        message='Search history retrieved',
    )


@router.delete('/history')
async def clear_search_history(
    current_user_id: UUID = Depends(get_current_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Clear all search history for the authenticated user."""
    service = SearchService(uow)
    count = await service.clear_search_history(current_user_id)
    return success_response(
        data={'cleared': count},
        message='Search history cleared',
    )


@router.get('/trending')
async def get_trending(
    limit: int = Query(10, ge=1, le=50, description='Number of trending queries'),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get trending search queries across all users."""
    service = SearchService(uow)
    trending = await service.get_trending(limit=limit)
    return success_response(
        data={'items': trending},
        message='Trending searches retrieved',
    )


def _node_to_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value if hasattr(node.difficulty, 'value') else node.difficulty,
    }


def _history_to_dict(h) -> dict:
    return {
        'id': str(h.id),
        'query': h.query,
        'results_count': h.results_count,
        'created_at': h.created_at.isoformat() if h.created_at else None,
    }
