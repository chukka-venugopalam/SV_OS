"""Knowledge Node service — business logic for knowledge graph nodes."""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.models.knowledge_node import KnowledgeNode
from app.repositories import UnitOfWork
from app.repositories.errors import DuplicateEntityError, EntityNotFoundError
from app.repositories.query_helpers import PageResult
from app.schemas.knowledge.node import (
    KnowledgeNodeCreate,
    KnowledgeNodeUpdate,
)

logger = get_logger(__name__)


class KnowledgeNodeService:
    """Business logic for knowledge node CRUD and queries."""

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    # ── Queries ────────────────────────────────────────────────────

    async def get_by_id(self, node_id: UUID) -> KnowledgeNode:
        """Get a node by ID."""
        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        if not node:
            raise EntityNotFoundError('KnowledgeNode', node_id)
        return node

    async def get_by_slug(self, slug: str) -> KnowledgeNode:
        """Get a node by slug."""
        return await self._uow.knowledge_nodes.get_by_slug(slug)

    async def list_nodes(
        self,
        page: int = 1,
        per_page: int = 20,
        node_type: str | None = None,
        difficulty: str | None = None,
        sort_by: str = 'title',
        sort_dir: str = 'asc',
    ) -> PageResult[KnowledgeNode]:
        """List published nodes with optional filtering."""
        filters = {'is_published': True}
        if node_type:
            filters['node_type'] = node_type
        if difficulty:
            filters['difficulty'] = difficulty
        return await self._uow.knowledge_nodes.paginate(
            page=page,
            per_page=per_page,
            filters=filters,
            sort_field=sort_by,
            sort_direction=sort_dir,
        )

    async def search_nodes(
        self,
        query: str,
        node_type: str | None = None,
        difficulty: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[KnowledgeNode]:
        """Full-text search across knowledge nodes."""
        return await self._uow.knowledge_nodes.search_nodes(
            query=query,
            node_type=node_type,
            difficulty=difficulty,
            page=page,
            per_page=per_page,
        )

    async def get_popular(
        self, limit: int = 10, node_type: str | None = None
    ) -> list[KnowledgeNode]:
        """Get the most-viewed published nodes."""
        return await self._uow.knowledge_nodes.find_popular(
            limit=limit,
            node_type=node_type,
        )

    # ── CRUD ───────────────────────────────────────────────────────

    async def create(self, data: KnowledgeNodeCreate) -> KnowledgeNode:
        """Create a new knowledge node."""
        if await self._uow.knowledge_nodes.slug_exists(data.slug):
            raise DuplicateEntityError('KnowledgeNode', {'slug': data.slug}) from None

        node = await self._uow.knowledge_nodes.create(**data.model_dump(exclude_none=True))
        logger.info('node_created', slug=data.slug, node_type=data.node_type)
        return node

    async def update(self, slug: str, data: KnowledgeNodeUpdate) -> KnowledgeNode:
        """Update an existing knowledge node."""
        node = await self._uow.knowledge_nodes.get_by_slug(slug)

        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            return node

        if (
            'slug' in update_data
            and update_data['slug'] != slug
            and await self._uow.knowledge_nodes.slug_exists(update_data['slug'], exclude_id=node.id)
        ):
            raise DuplicateEntityError('KnowledgeNode', {'slug': update_data['slug']})

        updated = await self._uow.knowledge_nodes.update(node.id, **update_data)
        logger.info('node_updated', slug=slug)
        return updated

    async def delete(self, slug: str) -> None:
        """Soft-delete a knowledge node."""
        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        await self._uow.knowledge_nodes.delete(node.id)
        logger.info('node_deleted', slug=slug)

    async def increment_view(self, slug: str) -> None:
        """Increment the view count for a node.

        Gets the node ID first, then atomically increments via SQL.
        The atomic update is a no-op if the node doesn't exist.
        """
        node = await self._uow.knowledge_nodes.find_by_slug(slug)
        if node:
            await self._uow.knowledge_nodes.increment_view_count(node.id)

    # ── Related Data ───────────────────────────────────────────────

    async def get_prerequisites(self, node_id: UUID) -> list[KnowledgeNode]:
        """Get prerequisite nodes for a given node."""
        return await self._uow.graph.load_prerequisites(node_id)

    async def get_dependents(self, node_id: UUID) -> list[KnowledgeNode]:
        """Get nodes that depend on this node."""
        return await self._uow.graph.load_dependents(node_id)

    async def get_neighbors(self, node_id: UUID) -> dict[str, list[KnowledgeNode]]:
        """Get all neighboring nodes (incoming and outgoing)."""
        return await self._uow.graph.load_all_neighbors(node_id)

    async def get_resources(self, node_id: UUID, page: int = 1, per_page: int = 20) -> PageResult:
        """Get learning resources for a node."""
        return await self._uow.learning_resources.find_by_node(
            node_id=node_id,
            page=page,
            per_page=per_page,
        )

    async def get_related_careers(self, node_id: UUID) -> list:
        """Get careers that require this node."""
        return await self._uow.careers.find_careers_by_node(node_id)
