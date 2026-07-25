"""Repository for LearningGoal and LearningGoalNode persistence."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from app.models.learning_goal import LearningGoal, LearningGoalNode
from app.repositories.base import BaseRepository
from app.repositories.errors import EntityNotFoundError

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class LearningGoalRepository(BaseRepository[LearningGoal]):
    """Repository for ``LearningGoal`` persistence operations."""

    model = LearningGoal

    # ── Lookup Methods ─────────────────────────────────────────────

    async def find_by_slug(self, slug: str) -> LearningGoal | None:
        """Find a learning goal by its URL-safe slug."""
        return await self.get_by_field('slug', slug)

    async def get_by_slug(self, slug: str) -> LearningGoal:
        """Find by slug or raise ``EntityNotFoundError``."""
        goal = await self.find_by_slug(slug)
        if not goal:
            msg = 'LearningGoal'
            raise EntityNotFoundError(msg, slug)
        return goal

    async def find_published(
        self,
        page: int = 1,
        per_page: int = 20,
        goal_type: str | None = None,
    ) -> PageResult[LearningGoal]:
        """Find learning goals with optional goal-type filter."""
        filters: dict[str, Any] = {}
        if goal_type:
            filters['goal_type'] = goal_type
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field='title',
        )

    # ── Node Management ────────────────────────────────────────────

    async def get_nodes(self, goal_id: UUID) -> list[LearningGoalNode]:
        """Get all knowledge-node links for a learning goal, ordered by sequence."""
        stmt = (
            select(LearningGoalNode)
            .where(LearningGoalNode.goal_id == goal_id)
            .where(LearningGoalNode.is_deleted.isnot(True))
            .order_by(LearningGoalNode.sequence_order)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_node(
        self,
        goal_id: UUID,
        node_id: UUID,
        requirement_type: str = 'required',
        sequence_order: int = 0,
    ) -> LearningGoalNode:
        """Add a knowledge-node link to a learning goal."""
        link = LearningGoalNode(
            goal_id=goal_id,
            node_id=node_id,
            requirement_type=requirement_type,
            sequence_order=sequence_order,
        )
        self.session.add(link)
        await self.session.flush()
        await self.session.refresh(link)
        return link

    async def remove_node(
        self,
        goal_id: UUID,
        node_id: UUID,
    ) -> bool:
        """Remove (soft-delete) a node link from a learning goal."""
        stmt = select(LearningGoalNode).where(
            LearningGoalNode.goal_id == goal_id,
            LearningGoalNode.node_id == node_id,
        )
        result = await self.session.execute(stmt)
        link = result.scalar_one_or_none()
        if not link:
            return False
        link.is_deleted = True
        await self.session.flush()
        return True

    # ── Related Queries ───────────────────────────────────────────

    async def get_nodes_for_goal(self, goal_id: UUID) -> list[dict[str, Any]]:
        """Get all knowledge nodes for a learning goal, with metadata."""
        from app.models.knowledge_node import KnowledgeNode

        stmt = (
            select(KnowledgeNode, LearningGoalNode)
            .join(
                LearningGoalNode,
                LearningGoalNode.node_id == KnowledgeNode.id,
            )
            .where(
                LearningGoalNode.goal_id == goal_id,
                LearningGoalNode.is_deleted.isnot(True),
                KnowledgeNode.is_deleted.isnot(True),
            )
            .order_by(LearningGoalNode.sequence_order)
        )
        result = await self.session.execute(stmt)
        return [
            {
                'node': node,
                'requirement_type': link.requirement_type,
                'sequence_order': link.sequence_order,
            }
            for node, link in result.all()
        ]
