"""Bookmark repository — persistence operations for the ``Bookmark`` model."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select

from app.models.bookmark import Bookmark
from app.repositories.base import BaseRepository
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult, SortDirection


class BookmarkRepository(BaseRepository[Bookmark]):
    """Repository for ``Bookmark`` persistence operations."""

    model = Bookmark

    # ── User-Centric Queries ───────────────────────────────────────

    async def find_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Bookmark]:
        """Find all bookmarks for a user with pagination."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'user_id': user_id},
            sort_field='created_at',
            sort_direction='desc',
        )

    async def find_by_user_and_node(
        self,
        user_id: UUID,
        node_id: UUID,
    ) -> Bookmark | None:
        """Find a specific bookmark by user and node."""
        stmt = (
            select(Bookmark)
            .where(
                Bookmark.user_id == user_id,
                Bookmark.node_id == node_id,
                Bookmark.is_deleted == False,  # noqa: E712
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    # ── Toggle Operations ──────────────────────────────────────────

    async def toggle(
        self,
        user_id: UUID,
        node_id: UUID,
        notes: str | None = None,
    ) -> tuple[Bookmark, bool]:
        """Toggle a bookmark for a user on a node.

        If the bookmark exists, removes (soft-deletes) it.
        If it does not exist, creates it.

        Returns a tuple of ``(bookmark, created)`` where ``created``
        is ``True`` if the bookmark was newly created.
        """
        existing = await self.find_by_user_and_node(user_id, node_id)
        if existing:
            await self.delete(existing.id)
            return existing, False

        bookmark = await self.create(
            user_id=user_id,
            node_id=node_id,
            notes=notes,
        )
        return bookmark, True

    # ── Counting ───────────────────────────────────────────────────

    async def count_by_user(self, user_id: UUID) -> int:
        """Count how many bookmarks a user has."""
        return await self.count(filters={'user_id': user_id})

    async def is_bookmarked(self, user_id: UUID, node_id: UUID) -> bool:
        """Check whether a user has bookmarked a specific node."""
        return await self.exists(user_id=user_id, node_id=node_id)
