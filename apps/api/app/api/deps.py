"""FastAPI dependency injection — provides dependencies for all route handlers.

This module is the central wiring point for the application's dependency
graph.  It provides:

- Database sessions
- Application settings
- Repository interfaces (injected via Unit of Work or individually)
- Service interfaces (AuthService, UserService)
- Auth dependencies (JWT validation, current user, admin check)
- Request context (request ID, correlation ID, timing)
- Unit of Work factory
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, settings as app_settings
from app.core.database import async_session_factory as _async_session_factory
from app.core.database import get_db_session as _get_db_session
from app.repositories import (
    AuditLogRepository,
    BaseRepository,
    BookmarkRepository,
    CareerRepository,
    GraphRepository,
    KnowledgeEdgeRepository,
    KnowledgeNodeRepository,
    LearningPathRepository,
    LearningResourceRepository,
    LearningSessionRepository,
    ProjectRepository,
    RecommendationRepository,
    SearchHistoryRepository,
    SkillRepository,
    TagRepository,
    UnitOfWork,
    UserProgressRepository,
    UserRepository,
)
from app.services.auth import AuthService
from app.services.activity_feed import ActivityFeedService
from app.services.ai import (
    EmbeddingService,
    HybridSearchService,
    RecommendationV2,
    SemanticSearchService,
    SimilarityService,
)
from app.services.favorite import FavoriteService
from app.services.graph.traversal import GraphTraversalService
from app.services.graph.analytics import GraphAnalyticsService
from app.services.learning_path_generator import LearningPathGenerator
from app.services.progress_intelligence import ProgressIntelligence
from app.services.recommendation_engine import RecommendationEngine
from app.services.user import UserService

security_scheme = HTTPBearer(auto_error=False)


# ── Request Context ────────────────────────────────────────────────


@dataclass
class RequestContext:
    """Request-scoped context available to all handlers and services."""

    request_id: str = ''
    correlation_id: str = ''
    duration_ms: float = 0.0
    current_user: dict | None = None


async def get_request_context(request: Request) -> RequestContext:
    """Extract the request context from ``request.state``."""
    return RequestContext(
        request_id=getattr(request.state, 'request_id', ''),
        correlation_id=getattr(request.state, 'correlation_id', ''),
        duration_ms=getattr(request.state, 'duration_ms', 0.0),
        current_user=getattr(request.state, 'current_user', None),
    )


# ── Database ───────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session for the request lifecycle.

    Delegates to ``app.core.database.get_db_session`` to avoid
    duplicating the commit/rollback logic.
    """
    async for session in _get_db_session():
        yield session


# ── Settings ───────────────────────────────────────────────────────


def get_settings() -> Settings:
    """Provide application settings."""
    return app_settings


# ── Unit of Work ────────────────────────────────────────────────────

async def get_uow(
    db: AsyncSession = Depends(get_db),
) -> AsyncGenerator[UnitOfWork, None]:
    """Provide a request-scoped Unit of Work.

    Auto-commits on success, rolls back on exception.
    This is the **preferred** way to access repositories in
    service-layer code.
    """
    async with UnitOfWork(db) as uow:
        yield uow


# ── Repository Interfaces ──────────────────────────────────────────
# Each repository can also be injected individually for simpler
# read-only endpoints that don't need a full Unit of Work.


def get_user_repository(
    db: AsyncSession = Depends(get_db),
) -> UserRepository:
    """Provide a ``UserRepository`` instance."""
    return UserRepository(db)


def get_node_repository(
    db: AsyncSession = Depends(get_db),
) -> KnowledgeNodeRepository:
    """Provide a ``KnowledgeNodeRepository`` instance."""
    return KnowledgeNodeRepository(db)


def get_edge_repository(
    db: AsyncSession = Depends(get_db),
) -> KnowledgeEdgeRepository:
    """Provide a ``KnowledgeEdgeRepository`` instance."""
    return KnowledgeEdgeRepository(db)


def get_career_repository(
    db: AsyncSession = Depends(get_db),
) -> CareerRepository:
    """Provide a ``CareerRepository`` instance."""
    return CareerRepository(db)


def get_project_repository(
    db: AsyncSession = Depends(get_db),
) -> ProjectRepository:
    """Provide a ``ProjectRepository`` instance."""
    return ProjectRepository(db)


def get_skill_repository(
    db: AsyncSession = Depends(get_db),
) -> SkillRepository:
    """Provide a ``SkillRepository`` instance."""
    return SkillRepository(db)


def get_learning_path_repository(
    db: AsyncSession = Depends(get_db),
) -> LearningPathRepository:
    """Provide a ``LearningPathRepository`` instance."""
    return LearningPathRepository(db)


def get_learning_session_repository(
    db: AsyncSession = Depends(get_db),
) -> LearningSessionRepository:
    """Provide a ``LearningSessionRepository`` instance."""
    return LearningSessionRepository(db)


def get_learning_resource_repository(
    db: AsyncSession = Depends(get_db),
) -> LearningResourceRepository:
    """Provide a ``LearningResourceRepository`` instance."""
    return LearningResourceRepository(db)


def get_progress_repository(
    db: AsyncSession = Depends(get_db),
) -> UserProgressRepository:
    """Provide a ``UserProgressRepository`` instance."""
    return UserProgressRepository(db)


def get_bookmark_repository(
    db: AsyncSession = Depends(get_db),
) -> BookmarkRepository:
    """Provide a ``BookmarkRepository`` instance."""
    return BookmarkRepository(db)


def get_recommendation_repository(
    db: AsyncSession = Depends(get_db),
) -> RecommendationRepository:
    """Provide a ``RecommendationRepository`` instance."""
    return RecommendationRepository(db)


def get_tag_repository(
    db: AsyncSession = Depends(get_db),
) -> TagRepository:
    """Provide a ``TagRepository`` instance."""
    return TagRepository(db)


def get_search_history_repository(
    db: AsyncSession = Depends(get_db),
) -> SearchHistoryRepository:
    """Provide a ``SearchHistoryRepository`` instance."""
    return SearchHistoryRepository(db)


def get_audit_log_repository(
    db: AsyncSession = Depends(get_db),
) -> AuditLogRepository:
    """Provide a ``AuditLogRepository`` instance."""
    return AuditLogRepository(db)


def get_graph_repository(
    db: AsyncSession = Depends(get_db),
) -> GraphRepository:
    """Provide a ``GraphRepository`` instance."""
    return GraphRepository(db)


def get_base_repository(
    db: AsyncSession = Depends(get_db),
) -> BaseRepository:
    """Provide a generic repository.

    Useful for dynamic operations where the concrete model type is
    determined at runtime.
    """
    return BaseRepository[None](db)  # type: ignore[type-var]


# ── Service Interfaces ─────────────────────────────────────────────
# Services are instantiated with a UnitOfWork.  For endpoints that
# need a single service, use the individual dependency injectors.
# For endpoints that need multiple services, inject ``get_uow``
# and instantiate services manually.


def get_auth_service(
    uow: UnitOfWork = Depends(get_uow),
) -> AuthService:
    """Provide an ``AuthService`` instance."""
    return AuthService(uow)


def get_user_service(
    uow: UnitOfWork = Depends(get_uow),
) -> UserService:
    """Provide a ``UserService`` instance."""
    return UserService(uow)


def get_favorite_service(
    uow: UnitOfWork = Depends(get_uow),
) -> FavoriteService:
    """Provide a ``FavoriteService`` instance."""
    return FavoriteService(uow)


def get_graph_traversal_service(
    uow: UnitOfWork = Depends(get_uow),
) -> GraphTraversalService:
    """Provide a ``GraphTraversalService`` instance."""
    return GraphTraversalService(uow)


def get_graph_analytics_service(
    uow: UnitOfWork = Depends(get_uow),
) -> GraphAnalyticsService:
    """Provide a ``GraphAnalyticsService`` instance."""
    return GraphAnalyticsService(uow)


def get_recommendation_engine(
    uow: UnitOfWork = Depends(get_uow),
) -> RecommendationEngine:
    """Provide a ``RecommendationEngine`` instance."""
    return RecommendationEngine(uow)


def get_learning_path_generator(
    uow: UnitOfWork = Depends(get_uow),
) -> LearningPathGenerator:
    """Provide a ``LearningPathGenerator`` instance."""
    return LearningPathGenerator(uow)


def get_progress_intelligence(
    uow: UnitOfWork = Depends(get_uow),
) -> ProgressIntelligence:
    """Provide a ``ProgressIntelligence`` instance."""
    return ProgressIntelligence(uow)


def get_activity_feed_service(
    uow: UnitOfWork = Depends(get_uow),
) -> ActivityFeedService:
    """Provide an ``ActivityFeedService`` instance."""
    return ActivityFeedService(uow)


def get_embedding_service(
    uow: UnitOfWork = Depends(get_uow),
) -> EmbeddingService:
    """Provide an ``EmbeddingService`` instance."""
    return EmbeddingService(uow=uow)


def get_semantic_search_service(
    uow: UnitOfWork = Depends(get_uow),
) -> SemanticSearchService:
    """Provide a ``SemanticSearchService`` instance."""
    return SemanticSearchService(uow)


def get_hybrid_search_service(
    uow: UnitOfWork = Depends(get_uow),
) -> HybridSearchService:
    """Provide a ``HybridSearchService`` instance."""
    return HybridSearchService(uow)


def get_recommendation_v2(
    uow: UnitOfWork = Depends(get_uow),
) -> RecommendationV2:
    """Provide a ``RecommendationV2`` instance."""
    return RecommendationV2(uow)


def get_similarity_service(
    uow: UnitOfWork = Depends(get_uow),
) -> SimilarityService:
    """Provide a ``SimilarityService`` instance."""
    return SimilarityService(uow)


# ── Auth Dependencies ──────────────────────────────────────────────


async def get_current_user_id_from_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> UUID | None:
    """Extract and validate the current user ID from the JWT access token.

    Returns ``None`` for unauthenticated requests.
    """
    if credentials is None or not credentials.credentials:
        return None

    from app.services.auth import AuthService
    from app.core.config import settings

    try:
        from jose import JWTError, jwt

        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=['HS256'],
        )
        sub = payload.get('sub')
        if sub and payload.get('type') == 'access':
            return UUID(sub)
    except (JWTError, ValueError, Exception):
        pass

    return None


async def get_current_user_id(
    user_id: UUID | None = Depends(get_current_user_id_from_token),
) -> UUID:
    """Require a valid authenticated user and return their UUID.

    Raises ``HTTPException(401)`` if not authenticated.
    """
    if user_id is None:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Not authenticated',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    return user_id


async def get_optional_user_id(
    user_id: UUID | None = Depends(get_current_user_id_from_token),
) -> UUID | None:
    """Get the current user ID or ``None`` if not authenticated.

    Use for endpoints that work for both authenticated and anonymous users.
    """
    return user_id


async def get_current_user(
    current_user_id: UUID = Depends(get_current_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> Any:
    """Get the full current user model from the database.

    Raises ``HTTPException(401)`` if not authenticated.
    """
    from app.repositories.errors import EntityNotFoundError

    user = await uow.users.get_by_id(current_user_id)
    if not user or not user.is_active:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not found or inactive',
        )
    return user


async def require_admin(
    user: Any = Depends(get_current_user),
) -> Any:
    """Require the current user to have the ``admin`` role.

    Raises ``HTTPException(403)`` if not an admin.
    """
    role = getattr(user, 'role', None)
    role_value = role.value if hasattr(role, 'value') else str(role) if role else ''
    if role_value != 'admin':
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin access required',
        )
    return user
