"""Recommendations API endpoints — stub implementation for MVP.

Full recommendation engine (collaborative filtering, content-based, graph-based)
will be implemented in a future phase.  This stub provides the API contract
so the frontend can be developed against stable endpoints.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_uow
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import build_error_response, build_success_response
from app.services.recommendation import RecommendationService

logger = get_logger(__name__)

router = APIRouter()


@router.get("")
async def get_recommendations(
    recommendation_type: str | None = Query(None, description="Filter by recommendation type"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user_id: UUID = Depends(get_current_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get recommendations for the authenticated user (stub)."""
    service = RecommendationService(uow)
    result = await service.get_for_user(
        user_id=current_user_id,
        recommendation_type=recommendation_type,
        page=page,
        per_page=per_page,
    )
    return build_success_response(
        data={
            "items": [_recommendation_to_dict(r) for r in result.items],
            "total": result.total,
            "page": result.page,
            "per_page": result.per_page,
            "total_pages": result.total_pages,
        },
        message="Recommendations retrieved",
    )


@router.get("/popular")
async def get_popular(
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get popular knowledge nodes as recommendations (stub)."""
    service = RecommendationService(uow)
    nodes = await service.get_popular_nodes(limit=limit)
    return build_success_response(
        data={"items": [_node_to_dict(n) for n in nodes]},
        message="Popular nodes retrieved",
    )


@router.post("/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Dismiss a recommendation."""
    service = RecommendationService(uow)
    try:
        await service.dismiss(recommendation_id)
    except EntityNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")

    return build_success_response(message="Recommendation dismissed")


def _recommendation_to_dict(r) -> dict:
    return {
        "id": str(r.id),
        "node_id": str(r.node_id),
        "recommendation_type": r.recommendation_type.value if hasattr(r.recommendation_type, "value") else r.recommendation_type,
        "score": r.score,
        "reason": r.reason,
        "is_dismissed": r.is_dismissed,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _node_to_dict(n) -> dict:
    return {
        "id": str(n.id),
        "slug": n.slug,
        "title": n.title,
        "node_type": n.node_type.value if hasattr(n.node_type, "value") else n.node_type,
        "difficulty": n.difficulty.value if hasattr(n.difficulty, "value") else n.difficulty,
        "estimated_minutes": n.estimated_minutes,
        "icon": n.icon,
        "color": n.color,
        "view_count": n.view_count,
    }
