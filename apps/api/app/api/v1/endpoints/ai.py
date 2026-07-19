"""AI Knowledge Intelligence API endpoints — embedding, search, and recommendations.

Endpoints:
- ``GET /knowledge/{slug}/similar`` — Similar concepts
- ``GET /recommendations/personalized`` — Personalized recommendations (V2)
- ``GET /search/semantic`` — Semantic search
- ``GET /search/hybrid`` — Hybrid search
- ``POST /ai/reindex`` — Re-index all nodes (admin only)
- ``POST /ai/embed`` — Generate embedding for a node (admin only)
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from structlog.stdlib import get_logger

from app.api.deps import (
    get_optional_user_id,
    get_uow,
    require_admin,
)
from app.schemas.response import build_success_response
from app.services.ai.embedding_service import EmbeddingService
from app.services.ai.hybrid_search import HybridSearchService
from app.services.ai.recommendation_v2 import RecommendationV2
from app.services.ai.semantic_search import SemanticSearchService
from app.services.ai.similarity import SimilarityService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


# ── Similar Concepts ────────────────────────────────────────────────


@router.get('/knowledge/{slug}/similar')
async def get_similar_concepts(
    slug: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    limit: Annotated[int, Query(ge=1, le=50, description='Number of results')] = 10,
) -> dict:
    """Find semantically similar concepts to a given knowledge node."""
    node = await uow.knowledge_nodes.find_by_slug(slug)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Knowledge node not found',
        )

    service = SimilarityService(uow)
    similar = await service.find_similar(
        node_id=node.id,
        limit=limit,
    )
    return build_success_response(
        data={'source': slug, 'items': similar, 'count': len(similar)},
        message='Similar concepts retrieved',
    )


# ── Personalized Recommendations (V2) ──────────────────────────────


@router.get('/recommendations/personalized')
async def get_personalized_recommendations(
    user_id: Annotated[UUID, Depends(get_optional_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    limit: Annotated[int, Query(ge=1, le=50, description='Number of recommendations')] = 20,
) -> dict:
    """Get personalised recommendations with score breakdowns (V2)."""
    if not user_id:
        return build_success_response(
            data={'items': [], 'count': 0},
            message='Login to get personalised recommendations',
        )

    engine = RecommendationV2(uow)
    recommendations = await engine.get_personalized(
        user_id=user_id,
        limit=limit,
    )
    return build_success_response(
        data={'items': recommendations, 'count': len(recommendations)},
        message='Personalized recommendations retrieved',
    )


# ── Semantic Search ────────────────────────────────────────────────


@router.get('/search/semantic')
async def semantic_search(
    query: Annotated[str, Query(min_length=1, description='Search query')],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    limit: Annotated[int, Query(ge=1, le=100, description='Number of results')] = 20,
    threshold: Annotated[float, Query(ge=0.0, le=1.0, description='Minimum similarity')] = 0.0,
) -> dict:
    """Search knowledge nodes using semantic similarity."""
    # Generate embedding for query
    embedding_service = EmbeddingService(uow=uow)
    query_embedding = await embedding_service.embed(query)

    semantic_service = SemanticSearchService(uow)
    results = await semantic_service.search(
        query_embedding=query_embedding,
        limit=limit,
        threshold=threshold,
    )
    return build_success_response(
        data={
            'query': query,
            'items': results,
            'count': len(results),
        },
        message='Semantic search completed',
    )


# ── Hybrid Search ──────────────────────────────────────────────────


@router.get('/search/hybrid')
async def hybrid_search(
    query: Annotated[str, Query(min_length=1, description='Search query')],
    user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 20,
    node_type: Annotated[str | None, Query(description='Filter by node type')] = None,
    difficulty: Annotated[str | None, Query(description='Filter by difficulty')] = None,
) -> dict:
    """Multi-signal hybrid search (keyword + semantic + graph + popularity)."""
    # Generate query embedding
    embedding_service = EmbeddingService(uow=uow)
    query_embedding = await embedding_service.embed(query)

    hybrid_service = HybridSearchService(uow)
    filters = {}
    if node_type:
        filters['node_type'] = node_type
    if difficulty:
        filters['difficulty'] = difficulty

    results = await hybrid_service.search(
        query=query,
        query_embedding=query_embedding,
        user_id=user_id,
        filters=filters or None,
        page=page,
        per_page=per_page,
    )
    return build_success_response(
        data=results,
        message='Hybrid search completed',
    )


# ── Embedding Administration (Admin Only) ──────────────────────────


@router.post('/ai/reindex')
async def reindex_all(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    _admin: Annotated[Any, Depends(require_admin)],
) -> dict:
    """Re-index all published knowledge nodes with embeddings.

    Requires admin privileges.
    """
    service = EmbeddingService(uow=uow)
    stats = await service.reindex_all()
    return build_success_response(
        data=stats,
        message='Re-indexing completed',
    )


@router.post('/ai/embed')
async def embed_node(
    node_id: Annotated[UUID, Query(..., description='Node ID to embed')],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    _admin: Annotated[Any, Depends(require_admin)],
) -> dict:
    """Generate embedding for a specific knowledge node.

    Requires admin privileges.
    """
    node = await uow.knowledge_nodes.get_by_id(node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Node not found',
        )

    service = EmbeddingService(uow=uow)
    embedding = await service.embed_node(node_id)
    if not embedding:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to generate embedding',
        )

    return build_success_response(
        data={
            'node_id': str(node_id),
            'dimensions': len(embedding),
            'model': service.model_name,
        },
        message='Embedding generated',
    )
