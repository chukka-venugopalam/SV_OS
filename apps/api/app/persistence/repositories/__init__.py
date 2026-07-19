"""Persistence repositories — data access objects for domain entities.

New code should import repositories from this package or from ``persistence.repositories``.
For backward compatibility, ``app.repositories`` continues to re-export all symbols.

This module re-exports all repository classes from the canonical location
at ``app.repositories``, which holds the actual implementations.
"""

from app.repositories import (  # noqa: F401
    AuditLogRepository,
    BaseRepository,
    BookmarkRepository,
    CareerRepository,
    FavoriteRepository,
    GraphRepository,
    KnowledgeEdgeRepository,
    KnowledgeNodeRepository,
    LearningPathRepository,
    LearningResourceRepository,
    LearningSessionRepository,
    PasswordResetRepository,
    ProjectRepository,
    RecommendationRepository,
    SearchHistoryRepository,
    SkillRepository,
    TagRepository,
    UnitOfWork,
    UserProgressRepository,
    UserRepository,
)
from app.repositories.errors import (  # noqa: F401
    ConcurrentModificationError,
    DuplicateEntityError,
    EntityNotFoundError,
    RepositoryError,
)
from app.repositories.query_helpers import (  # noqa: F401
    CursorPageResult,
    FilterCondition,
    PageResult,
    QueryBuilder,
    SortDirection,
)

__all__ = [
    'AuditLogRepository',
    'BaseRepository',
    'BookmarkRepository',
    'CareerRepository',
    'ConcurrentModificationError',
    'CursorPageResult',
    'DuplicateEntityError',
    'EntityNotFoundError',
    'FavoriteRepository',
    'FilterCondition',
    'GraphRepository',
    'KnowledgeEdgeRepository',
    'KnowledgeNodeRepository',
    'LearningPathRepository',
    'LearningResourceRepository',
    'LearningSessionRepository',
    'PageResult',
    'PasswordResetRepository',
    'ProjectRepository',
    'QueryBuilder',
    'RecommendationRepository',
    'RepositoryError',
    'SearchHistoryRepository',
    'SkillRepository',
    'SortDirection',
    'TagRepository',
    'UnitOfWork',
    'UserProgressRepository',
    'UserRepository',
]
