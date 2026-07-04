"""Data access layer — repositories abstract database operations.

This module provides the complete repository layer for all domain
entities.  Repositories consume SQLAlchemy models and perform
persistence operations.  They must never expose ORM models outside
the data-access layer.

The ``UnitOfWork`` provides transaction management and single-point
access to all repositories.

Usage::

    # Via Unit of Work (preferred)
    async with UnitOfWork(session) as uow:
        user = await uow.users.get_by_id(user_id)
        await uow.users.update(user_id, display_name=\"New Name\")
        # Auto-commits on success

    # Direct repository usage (for simple read operations)
    repo = UserRepository(session)
    user = await repo.find_by_email(\"user@example.com\")
"""

from app.repositories.audit_log import AuditLogRepository
from app.repositories.base import BaseRepository
from app.repositories.bookmark import BookmarkRepository
from app.repositories.career import CareerRepository
from app.repositories.favorite import FavoriteRepository
from app.repositories.errors import (
    ConcurrentModificationError,
    DatabaseConnectionError,
    DuplicateEntityError,
    EntityNotFoundError,
    QueryError,
    RepositoryError,
)
from app.repositories.graph import GraphRepository
from app.repositories.knowledge_edge import KnowledgeEdgeRepository
from app.repositories.knowledge_node import KnowledgeNodeRepository
from app.repositories.learning_path import LearningPathRepository, LearningSessionRepository
from app.repositories.learning_resource import LearningResourceRepository
from app.repositories.project import ProjectRepository
from app.repositories.query_helpers import (
    CursorPageResult,
    FilterCondition,
    PageResult,
    QueryBuilder,
    SortDirection,
)
from app.repositories.recommendation import RecommendationRepository
from app.repositories.search_history import SearchHistoryRepository
from app.repositories.skill import SkillRepository
from app.repositories.tag import TagRepository
from app.repositories.unit_of_work import UnitOfWork, unit_of_work
from app.repositories.user import UserRepository
from app.repositories.user_progress import UserProgressRepository

__all__ = [
    # Base
    'BaseRepository',
    # Errors
    'RepositoryError',
    'EntityNotFoundError',
    'DuplicateEntityError',
    'ConcurrentModificationError',
    'DatabaseConnectionError',
    'QueryError',
    # Query Helpers
    'PageResult',
    'CursorPageResult',
    'FilterCondition',
    'QueryBuilder',
    'SortDirection',
    # Unit of Work
    'UnitOfWork',
    'unit_of_work',
    # Feature Repositories
    'UserRepository',
    'KnowledgeNodeRepository',
    'FavoriteRepository',
    'KnowledgeEdgeRepository',
    'CareerRepository',
    'ProjectRepository',
    'SkillRepository',
    'LearningPathRepository',
    'LearningSessionRepository',
    'LearningResourceRepository',
    'UserProgressRepository',
    'BookmarkRepository',
    'FavoriteRepository',
    'RecommendationRepository',
    'TagRepository',
    'SearchHistoryRepository',
    'AuditLogRepository',
    'GraphRepository',
]
