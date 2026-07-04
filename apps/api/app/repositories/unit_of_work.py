"""Unit of Work pattern — transaction management for the repository layer.

The Unit of Work (UoW) is the single point of transaction control in
the data-access layer.  Repositories must **never** commit transactions
independently; instead they operate within a UoW that commits or rolls
back the entire unit of work.

Usage::

    async with UnitOfWork(db_session) as uow:
        user = await uow.users.get_by_id(user_id)
        progress = await uow.progress.create(user_id=user.id, node_id=node.id, ...)
        # Auto-commits on success, rolls back on exception

    # Or manually:
    uow = UnitOfWork(db_session)
    try:
        await uow.__aenter__()
        user = await uow.users.get_by_id(user_id)
        await uow.commit()
    finally:
        await uow.__aexit__()
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from types import TracebackType

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.audit_log import AuditLogRepository
from app.repositories.bookmark import BookmarkRepository
from app.repositories.career import CareerRepository
from app.repositories.favorite import FavoriteRepository
from app.repositories.graph import GraphRepository
from app.repositories.knowledge_edge import KnowledgeEdgeRepository
from app.repositories.knowledge_node import KnowledgeNodeRepository
from app.repositories.learning_path import LearningPathRepository
from app.repositories.learning_resource import LearningResourceRepository
from app.repositories.project import ProjectRepository
from app.repositories.recommendation import RecommendationRepository
from app.repositories.search_history import SearchHistoryRepository
from app.repositories.skill import SkillRepository
from app.repositories.tag import TagRepository
from app.repositories.user import UserRepository
from app.repositories.user_progress import UserProgressRepository


class UnitOfWork:
    """Transaction boundary for a set of repository operations.

    Provides access to all feature repositories and manages the
    underlying database transaction.  Supports both ``async with``
    (context manager) and explicit ``commit()`` / ``rollback()``.

    Repositories are lazily instantiated on first access.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repositories: dict[str, object] = {}
        self._closed = False

    @property
    def session(self) -> AsyncSession:
        """Expose the underlying database session for complex queries.

        Prefer using repository methods whenever possible.  Access the
        session directly only for queries that span multiple repositories
        or require raw SQL.
        """
        return self._session

    # ── Repository Properties ──────────────────────────────────────

    @property
    def users(self) -> UserRepository:
        return self._get_or_create('users', UserRepository)

    @property
    def knowledge_nodes(self) -> KnowledgeNodeRepository:
        return self._get_or_create('knowledge_nodes', KnowledgeNodeRepository)

    @property
    def knowledge_edges(self) -> KnowledgeEdgeRepository:
        return self._get_or_create('knowledge_edges', KnowledgeEdgeRepository)

    @property
    def careers(self) -> CareerRepository:
        return self._get_or_create('careers', CareerRepository)

    @property
    def projects(self) -> ProjectRepository:
        return self._get_or_create('projects', ProjectRepository)

    @property
    def skills(self) -> SkillRepository:
        return self._get_or_create('skills', SkillRepository)

    @property
    def learning_paths(self) -> LearningPathRepository:
        return self._get_or_create('learning_paths', LearningPathRepository)

    @property
    def learning_resources(self) -> LearningResourceRepository:
        return self._get_or_create('learning_resources', LearningResourceRepository)

    @property
    def user_progress(self) -> UserProgressRepository:
        return self._get_or_create('user_progress', UserProgressRepository)

    @property
    def bookmarks(self) -> BookmarkRepository:
        return self._get_or_create('bookmarks', BookmarkRepository)

    @property
    def favorites(self) -> FavoriteRepository:
        return self._get_or_create('favorites', FavoriteRepository)

    @property
    def recommendations(self) -> RecommendationRepository:
        return self._get_or_create('recommendations', RecommendationRepository)

    @property
    def tags(self) -> TagRepository:
        return self._get_or_create('tags', TagRepository)

    @property
    def search_history(self) -> SearchHistoryRepository:
        return self._get_or_create('search_history', SearchHistoryRepository)

    @property
    def audit_logs(self) -> AuditLogRepository:
        return self._get_or_create('audit_logs', AuditLogRepository)

    @property
    def graph(self) -> GraphRepository:
        return self._get_or_create('graph', GraphRepository)

    # ── Transaction Management ─────────────────────────────────────

    async def commit(self) -> None:
        """Commit the current transaction."""
        if self._closed:
            raise RuntimeError('Unit of Work is already closed')
        try:
            await self._session.commit()
        except Exception:
            await self._session.rollback()
            raise

    async def rollback(self) -> None:
        """Roll back the current transaction."""
        if self._closed:
            raise RuntimeError('Unit of Work is already closed')
        await self._session.rollback()

    async def flush(self) -> None:
        """Flush pending changes to the database without committing."""
        if self._closed:
            raise RuntimeError('Unit of Work is already closed')
        await self._session.flush()

    # ── Context Manager Support ────────────────────────────────────

    async def __aenter__(self) -> 'UnitOfWork':
        """Enter the context manager — no explicit begin needed (sessions begin implicitly)."""
        self._closed = False
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        """Exit the context manager — commit on success, roll back on error."""
        self._closed = True
        if exc_type is not None:
            await self._session.rollback()
        else:
            try:
                await self._session.commit()
            except Exception:
                await self._session.rollback()
                raise

    # ── Internal ───────────────────────────────────────────────────

    def _get_or_create(self, key: str, repo_cls: type) -> object:
        """Return a cached repository instance or create a new one."""
        if key not in self._repositories:
            self._repositories[key] = repo_cls(self._session)
        return self._repositories[key]


@asynccontextmanager
async def unit_of_work(session: AsyncSession) -> AsyncGenerator[UnitOfWork, None]:
    """Convenience context manager for creating a UnitOfWork.

    Usage::

        async with unit_of_work(session) as uow:
            user = await uow.users.get_by_id(user_id)
    """
    async with UnitOfWork(session) as uow:
        yield uow
