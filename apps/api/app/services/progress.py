"""Progress service — business logic for user progress tracking."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.knowledge_node import KnowledgeNode
from app.models.user_progress import UserProgress
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class ProgressService:
    """Business logic for user progress operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_progress(self, user_id: UUID, node_id: UUID) -> dict | None:
        """Get progress for a specific user/node pair with node details."""
        progress = await self._uow.user_progress.find_by_user_and_node(user_id, node_id)
        if not progress:
            return None
        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        return _progress_with_node(progress, node)

    async def list_user_progress(
        self,
        user_id: UUID,
        status: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """List progress records for a user with node details via JOIN."""
        result = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status=status,
            page=page,
            per_page=per_page,
        )

        # Enrich each progress record with node data using batch loading
        node_ids = [p.node_id for p in result.items if p]
        nodes = await self._uow.knowledge_nodes.get_many(node_ids)
        node_map = {n.id: n for n in nodes}

        items = [_progress_with_node(p, node_map.get(p.node_id)) for p in result.items if p]

        return {
            'items': items,
            'total': result.total,
            'page': result.page,
            'per_page': result.per_page,
            'total_pages': result.total_pages,
        }

    async def update_progress(
        self,
        user_id: UUID,
        node_id: UUID,
        status: str | None = None,
        time_spent_minutes: int | None = None,
        notes: str | None = None,
    ) -> dict:
        """Create or update progress for a user/node pair."""
        progress = await self._uow.user_progress.upsert_progress(
            user_id=user_id,
            node_id=node_id,
            status=status,
            time_spent_minutes=time_spent_minutes,
            notes=notes,
        )
        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        return _progress_with_node(progress, node)

    async def get_statistics(self, user_id: UUID) -> dict:
        """Get aggregated progress statistics for a user."""
        by_status = await self._uow.user_progress.count_by_status(user_id)
        total_time = await self._uow.user_progress.total_time_for_user(user_id)
        completed = await self._uow.user_progress.count_completed(user_id)

        # Get all node data for dashboard support
        all_nodes = await self._uow.knowledge_nodes.count()
        all_progress = await self._uow.user_progress.find_by_user(user_id=user_id)

        return {
            'by_status': by_status,
            'total_time_minutes': total_time,
            'completed_nodes': completed,
            'total_nodes': all_nodes,
            'in_progress_count': by_status.get('learning', 0),
        }


def _progress_with_node(progress, node) -> dict:
    """Build a progress dict enriched with node details."""
    result = {
        'id': str(progress.id),
        'user_id': str(progress.user_id),
        'node_id': str(progress.node_id),
        'status': progress.status.value if hasattr(progress.status, 'value') else progress.status,
        'started_at': progress.started_at.isoformat() if progress.started_at else None,
        'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
        'mastered_at': progress.mastered_at.isoformat() if progress.mastered_at else None,
        'time_spent_minutes': progress.time_spent_minutes,
        'notes': progress.notes,
        'updated_at': progress.updated_at.isoformat() if progress.updated_at else None,
    }
    if node:
        result['node_slug'] = node.slug
        result['node_title'] = node.title
        result['node_type'] = node.node_type.value if hasattr(node.node_type, 'value') else str(node.node_type)
        result['difficulty'] = node.difficulty.value if hasattr(node.difficulty, 'value') else str(node.difficulty)
        result['estimated_minutes'] = node.estimated_minutes
        result['icon'] = node.icon
        result['color'] = node.color
    else:
        result['node_slug'] = None
        result['node_title'] = None
        result['node_type'] = None
        result['difficulty'] = None
        result['estimated_minutes'] = None
        result['icon'] = None
        result['color'] = None
    return result
