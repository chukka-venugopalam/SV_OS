"""Bookmark service — business logic for bookmark operations."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.bookmark import Bookmark
from app.models.knowledge_node import KnowledgeNode
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class BookmarkService:
    """Business logic for bookmark operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def list_bookmarks(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Bookmark]:
        """List bookmarks for a user."""
        return await self._uow.bookmarks.find_by_user(
            user_id=user_id,
            page=page,
            per_page=per_page,
        )

    async def toggle_bookmark(
        self,
        user_id: UUID,
        node_id: UUID,
        notes: str | None = None,
    ) -> tuple[Bookmark, bool]:
        """Toggle a bookmark on a node for a user.

        Returns ``(bookmark, created)`` where ``created`` is True
        if the bookmark was added, False if removed.
        """
        # Verify node exists
        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        if not node:
            raise EntityNotFoundError('KnowledgeNode', node_id)

        return await self._uow.bookmarks.toggle(
            user_id=user_id,
            node_id=node_id,
            notes=notes,
        )

    async def is_bookmarked(self, user_id: UUID, node_id: UUID) -> bool:
        """Check if a user has bookmarked a node."""
        return await self._uow.bookmarks.is_bookmarked(user_id, node_id)

    async def count_bookmarks(self, user_id: UUID) -> int:
        """Count bookmarks for a user."""
        return await self._uow.bookmarks.count_by_user(user_id)
