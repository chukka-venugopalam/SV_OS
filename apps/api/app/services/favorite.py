"""Favorite service — business logic for favorites operations."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.favorite import Favorite
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.repositories.query_helpers import PageResult

logger = get_logger(__name__)


class FavoriteService:
    """Business logic for favorite operations."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def list_favorites(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Favorite]:
        """List favorites for a user with pagination."""
        return await self._uow.favorites.paginate(
            page=page,
            per_page=per_page,
            filters={'user_id': user_id},
            sort_field='created_at',
            sort_direction='desc',
        )

    async def add_favorite(self, user_id: UUID, node_id: UUID) -> Favorite:
        """Add a favorite (like) for a knowledge node.

        Raises ``EntityNotFoundError`` if the node does not exist.
        """
        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        if not node:
            raise EntityNotFoundError('KnowledgeNode', node_id)

        favorite = await self._uow.favorites.create(
            user_id=user_id,
            node_id=node_id,
        )
        logger.info('favorite_added', user_id=str(user_id), node_id=str(node_id))
        return favorite

    async def remove_favorite(self, user_id: UUID, node_id: UUID) -> bool:
        """Remove a favorite from a knowledge node.

        Returns ``True`` if the favorite was removed.
        """
        favorite = await self._uow.favorites.find_by_user_and_node(user_id, node_id)
        if not favorite:
            return False
        await self._uow.favorites.delete(favorite.id)
        logger.info('favorite_removed', user_id=str(user_id), node_id=str(node_id))
        return True

    async def is_favorited(self, user_id: UUID, node_id: UUID) -> bool:
        """Check if a user has favorited a node."""
        return await self._uow.favorites.exists(user_id=user_id, node_id=node_id)
