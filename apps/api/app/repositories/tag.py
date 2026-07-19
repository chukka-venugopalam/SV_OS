"""Tag repository — persistence operations for ``Tag`` and ``NodeTag`` models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import func, select

from app.models.tag import NodeTag, Tag
from app.repositories.base import BaseRepository

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class TagRepository(BaseRepository[Tag]):
    """Repository for ``Tag`` persistence operations."""

    model = Tag

    # ── Lookup Methods ─────────────────────────────────────────────

    async def find_by_name(self, name: str) -> Tag | None:
        """Find a tag by name."""
        return await self.get_by_field('name', name)

    async def search_by_name(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Tag]:
        """Search tags by name using ILIKE."""
        return await self.search(
            query=query,
            fields=['name'],
            page=page,
            per_page=per_page,
        )

    # ── Node-Tag Associations ──────────────────────────────────────

    async def get_tags_for_node(self, node_id: UUID) -> list[Tag]:
        """Get all tags associated with a knowledge node."""
        stmt = (
            select(Tag)
            .join(NodeTag, NodeTag.tag_id == Tag.id)
            .where(
                NodeTag.node_id == node_id,
                not NodeTag.is_deleted,
                not Tag.is_deleted,
            )
            .order_by(Tag.name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_tag_to_node(self, node_id: UUID, tag_id: UUID) -> NodeTag:
        """Associate a tag with a knowledge node."""
        node_tag = NodeTag(node_id=node_id, tag_id=tag_id)
        self.session.add(node_tag)
        await self.session.flush()
        await self.session.refresh(node_tag)
        return node_tag

    async def remove_tag_from_node(self, node_id: UUID, tag_id: UUID) -> bool:
        """Remove (soft-delete) a tag-node association.

        Returns ``True`` if the association was removed.
        """
        stmt = select(NodeTag).where(
            NodeTag.node_id == node_id,
            NodeTag.tag_id == tag_id,
            not NodeTag.is_deleted,
        )
        result = await self.session.execute(stmt)
        node_tag = result.scalar_one_or_none()
        if not node_tag:
            return False
        node_tag.is_deleted = True
        await self.session.flush()
        return True

    async def get_node_tags_for_node(self, node_id: UUID) -> list[NodeTag]:
        """Get all NodeTag associations for a node."""
        stmt = select(NodeTag).where(
            NodeTag.node_id == node_id,
            not NodeTag.is_deleted,
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ── Popular Tags ───────────────────────────────────────────────

    async def find_popular(self, limit: int = 20) -> list[dict[str, Any]]:
        """Find the most-used tags ranked by node count."""
        stmt = (
            select(
                Tag.id,
                Tag.name,
                Tag.description,
                func.count(NodeTag.node_id).label('node_count'),
            )
            .join(NodeTag, NodeTag.tag_id == Tag.id)
            .where(
                not Tag.is_deleted,
                not NodeTag.is_deleted,
            )
            .group_by(Tag.id, Tag.name, Tag.description)
            .order_by(func.count(NodeTag.node_id).desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return [
            {
                'id': str(row.id),
                'name': row.name,
                'description': row.description,
                'node_count': row.node_count,
            }
            for row in result.all()
        ]
