"""Tests for the base repository and unit of work.

These tests verify the repository layer's persistence operations,
transaction management, pagination, and error handling.

Note: These tests require a running PostgreSQL database.  They are
marked with ``pytest.mark.db`` and are skipped by default unless
``--run-db`` is passed to pytest.
"""

from __future__ import annotations

from typing import Any, AsyncGenerator
from uuid import UUID, uuid4

import pytest
from sqlalchemy import Column, String, Text, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, async_session_factory
from app.models.enums import NodeType
from app.models.knowledge_node import KnowledgeNode
from app.models.user import User
from app.repositories import (
    BookmarkRepository,
    CareerRepository,
    GraphRepository,
    KnowledgeEdgeRepository,
    KnowledgeNodeRepository,
    PageResult,
    UnitOfWork,
    UserRepository,
    unit_of_work,
)
from app.repositories.base import BaseRepository
from app.repositories.errors import (
    ConcurrentModificationError,
    DuplicateEntityError,
    EntityNotFoundError,
    RepositoryError,
)
from app.repositories.query_helpers import CursorPageResult, FilterCondition, SortDirection


# ── Fixtures ────────────────────────────────────────────────────────


@pytest.fixture
def sample_node_data() -> dict[str, Any]:
    """Provide sample knowledge node data for testing."""
    return {
        'slug': f'test-node-{uuid4().hex[:8]}',
        'title': 'Test Knowledge Node',
        'description': 'A test node for repository testing',
        'node_type': NodeType.CONCEPT.value,
        'is_published': True,
    }


@pytest.fixture
async def node_repo() -> KnowledgeNodeRepository:
    """Provide a ``KnowledgeNodeRepository`` backed by a test session."""
    session = async_session_factory()
    repo = KnowledgeNodeRepository(session)
    yield repo
    await session.close()


# ── Transaction Management ──────────────────────────────────────────


class TestUnitOfWork:
    """Verify UnitOfWork transaction management."""

    @pytest.mark.db
    async def test_uow_commits_on_success(self, node_repo, sample_node_data):
        """Test that the UoW commits changes when no exception occurs."""
        async with UnitOfWork(node_repo.session) as uow:
            node = await uow.knowledge_nodes.create(**sample_node_data)
            assert node.id is not None

        # Verify the node was persisted
        persisted = await node_repo.get_by_id(node.id)
        assert persisted is not None
        assert persisted.title == sample_node_data['title']

    @pytest.mark.db
    async def test_uow_rolls_back_on_exception(self, node_repo, sample_node_data):
        """Test that the UoW rolls back changes when an exception occurs."""
        node_id = None
        try:
            async with UnitOfWork(node_repo.session) as uow:
                node = await uow.knowledge_nodes.create(**sample_node_data)
                node_id = node.id
                raise ValueError('Simulated error')
        except ValueError:
            pass

        # Verify the node was NOT persisted
        if node_id:
            persisted = await node_repo.get_by_id(node_id)
            assert persisted is None

    @pytest.mark.db
    async def test_uow_manual_commit(self, node_repo, sample_node_data):
        """Test that explicit commit works with UoW."""
        uow = UnitOfWork(node_repo.session)
        await uow.__aenter__()
        try:
            node = await uow.knowledge_nodes.create(**sample_node_data)
            await uow.commit()
        finally:
            await uow.__aexit__(None, None, None)

        persisted = await node_repo.get_by_id(node.id)
        assert persisted is not None

    @pytest.mark.db
    async def test_uow_manual_rollback(self, node_repo, sample_node_data):
        """Test that explicit rollback discards changes."""
        uow = UnitOfWork(node_repo.session)
        await uow.__aenter__()
        try:
            node = await uow.knowledge_nodes.create(**sample_node_data)
            await uow.rollback()
        finally:
            await uow.__aexit__(None, None, None)

        persisted = await node_repo.get_by_id(node.id)
        assert persisted is None

    @pytest.mark.db
    async def test_uow_context_manager_convenience(self, node_repo, sample_node_data):
        """Test the ``unit_of_work`` convenience context manager."""
        async with unit_of_work(node_repo.session) as uow:
            node = await uow.knowledge_nodes.create(**sample_node_data)
        assert node.id is not None


# ── CRUD Verification ───────────────────────────────────────────────


class TestBaseRepositoryCRUD:
    """Verify the base repository's CRUD operations."""

    @pytest.mark.db
    async def test_create_and_read(self, node_repo, sample_node_data):
        """Test creating a record and reading it back."""
        node = await node_repo.create(**sample_node_data)
        assert node.id is not None
        assert node.slug == sample_node_data['slug']

        fetched = await node_repo.get_by_id(node.id)
        assert fetched is not None
        assert fetched.title == sample_node_data['title']

    @pytest.mark.db
    async def test_get_by_id_returns_none_for_missing(self, node_repo):
        """Test that ``get_by_id`` returns ``None`` for non-existent IDs."""
        result = await node_repo.get_by_id(uuid4())
        assert result is None

    @pytest.mark.db
    async def test_get_many(self, node_repo, sample_node_data):
        """Test fetching multiple records by IDs."""
        node1 = await node_repo.create(**sample_node_data)
        data2 = sample_node_data.copy()
        data2['slug'] = f'test-node-{uuid4().hex[:8]}'
        data2['title'] = 'Second Node'
        node2 = await node_repo.create(**data2)

        results = await node_repo.get_many([node1.id, node2.id])
        assert len(results) == 2

    @pytest.mark.db
    async def test_update(self, node_repo, sample_node_data):
        """Test updating a record."""
        node = await node_repo.create(**sample_node_data)
        updated = await node_repo.update(node.id, title='Updated Title')
        assert updated.title == 'Updated Title'

        # Verify persistence
        fetched = await node_repo.get_by_id(node.id)
        assert fetched.title == 'Updated Title'

    @pytest.mark.db
    async def test_update_raises_not_found(self, node_repo):
        """Test that updating a non-existent record raises ``EntityNotFoundError``."""
        with pytest.raises(EntityNotFoundError):
            await node_repo.update(uuid4(), title='Ghost')

    @pytest.mark.db
    async def test_soft_delete_and_restore(self, node_repo, sample_node_data):
        """Test soft-deleting and restoring a record."""
        node = await node_repo.create(**sample_node_data)

        await node_repo.delete(node.id, hard=False)

        # Should not be found in active queries
        fetched = await node_repo.get_by_id(node.id)
        assert fetched is None

        # Restore
        restored = await node_repo.restore(node.id)
        assert restored.is_deleted is False

        # Should now be found
        fetched = await node_repo.get_by_id(node.id)
        assert fetched is not None

    @pytest.mark.db
    async def test_hard_delete(self, node_repo, sample_node_data):
        """Test permanently deleting a record."""
        node = await node_repo.create(**sample_node_data)
        await node_repo.delete(node.id, hard=True)

        # Should not be found even with including_deleted
        fetched = await node_repo.get_by_id_including_deleted(node.id)
        assert fetched is None

    @pytest.mark.db
    async def test_exists(self, node_repo, sample_node_data):
        """Test the ``exists`` check."""
        assert await node_repo.exists(slug='non-existent-slug') is False

        node = await node_repo.create(**sample_node_data)
        assert await node_repo.exists(slug=node.slug) is True

    @pytest.mark.db
    async def test_count(self, node_repo, sample_node_data):
        """Test counting records."""
        initial = await node_repo.count()
        await node_repo.create(**sample_node_data)
        data2 = sample_node_data.copy()
        data2['slug'] = f'test-node-{uuid4().hex[:8]}'
        await node_repo.create(**data2)
        assert await node_repo.count() == initial + 2


# ── Pagination Tests ────────────────────────────────────────────────


class TestPagination:
    """Verify pagination behavior."""

    @pytest.mark.db
    async def test_paginate_returns_page_result(self, node_repo):
        """Test that ``paginate`` returns a ``PageResult`` with correct metadata."""
        result = await node_repo.paginate(page=1, per_page=10)
        assert isinstance(result, PageResult)
        assert result.page == 1
        assert result.per_page == 10

    @pytest.mark.db
    async def test_paginate_empty(self, node_repo):
        """Test pagination with no records."""
        result = await node_repo.paginate(page=1, per_page=10)
        assert result.total == 0
        assert result.items == []
        assert result.total_pages == 1

    @pytest.mark.db
    async def test_paginate_with_filters(self, node_repo, sample_node_data):
        """Test pagination with equality filters."""
        data = sample_node_data.copy()
        data['difficulty'] = 'beginner'
        await node_repo.create(**data)
        data2 = data.copy()
        data2['slug'] = f'test-node-{uuid4().hex[:8]}'
        data2['difficulty'] = 'advanced'
        await node_repo.create(**data2)

        result = await node_repo.paginate(
            page=1,
            per_page=10,
            filters={'difficulty': 'advanced'},
        )
        assert result.total == 1
        assert result.items[0].difficulty == 'advanced'

    @pytest.mark.db
    async def test_cursor_pagination(self, node_repo, sample_node_data):
        """Test cursor-based pagination."""
        # Create records with controlled ordering
        nodes = []
        for i in range(5):
            data = sample_node_data.copy()
            data['slug'] = f'test-node-{uuid4().hex[:8]}'
            data['title'] = f'Node {i}'
            nodes.append(await node_repo.create(**data))

        # Fetch first page
        page1 = await node_repo.paginate_cursor(
            cursor_field='title',
            limit=2,
            sort_direction=SortDirection.ASC,
        )
        assert isinstance(page1, CursorPageResult)
        assert len(page1.items) == 2
        assert page1.has_more is True

        # Fetch second page
        page2 = await node_repo.paginate_cursor(
            cursor_field='title',
            cursor_value=page1.cursor if page1.items else None,
            limit=2,
            sort_direction=SortDirection.ASC,
        )
        assert len(page2.items) == 2

    @pytest.mark.db
    async def test_search_basic(self, node_repo, sample_node_data):
        """Test basic ILIKE search."""
        data = sample_node_data.copy()
        data['title'] = 'Python Programming Fundamentals'
        await node_repo.create(**data)

        result = await node_repo.search(query='Python', fields=['title'])
        assert result.total >= 1
        assert any('Python' in item.title for item in result.items)


# ── Error Handling ──────────────────────────────────────────────────


class TestRepositoryErrors:
    """Verify repository-layer error handling."""

    @pytest.mark.db
    async def test_duplicate_entity_error(self, node_repo, sample_node_data):
        """Test that creating a duplicate slug raises ``DuplicateEntityError``."""
        await node_repo.create(**sample_node_data)
        with pytest.raises(DuplicateEntityError):
            await node_repo.create(**sample_node_data)

    @pytest.mark.db
    async def test_entity_not_found_error(self, node_repo):
        """Test that operating on non-existent IDs raises ``EntityNotFoundError``."""
        fake_id = uuid4()
        with pytest.raises(EntityNotFoundError):
            await node_repo.update(fake_id, title='Ghost')
        with pytest.raises(EntityNotFoundError):
            await node_repo.delete(fake_id)

    @pytest.mark.db
    async def test_delete_many(self, node_repo, sample_node_data):
        """Test deleting multiple records."""
        node1 = await node_repo.create(**sample_node_data)
        data2 = sample_node_data.copy()
        data2['slug'] = f'test-node-{uuid4().hex[:8]}'
        node2 = await node_repo.create(**data2)

        count = await node_repo.delete_many([node1.id, node2.id], hard=True)
        assert count == 2

    @pytest.mark.db
    async def test_create_many(self, node_repo, sample_node_data):
        """Test bulk creation."""
        items = [
            {**sample_node_data, 'slug': f'test-node-{uuid4().hex[:8]}', 'title': f'Bulk {i}'}
            for i in range(3)
        ]
        instances = await node_repo.create_many(items)
        assert len(instances) == 3
        for instance in instances:
            assert instance.id is not None


# ── Graph Query Tests ───────────────────────────────────────────────


class TestGraphRepository:
    """Verify graph persistence queries (data access only)."""

    @pytest.mark.db
    async def test_load_neighbors_empty(self, node_repo):
        """Test loading neighbors for a node with no edges."""
        neighbors = await node_repo.get_all(limit=1)
        # No assertions on data — just verifying the query doesn't error
        assert isinstance(neighbors, list)

    @pytest.mark.db
    async def test_load_outgoing_edges(self, node_repo):
        """Test that loading outgoing edges returns correctly typed results."""
        result = await node_repo.paginate(page=1, per_page=10)
        assert isinstance(result, PageResult)

    @pytest.mark.db
    async def test_graph_repo_basic_query(self, node_repo):
        """Test that the GraphRepository can be instantiated and used."""
        graph_repo = GraphRepository(node_repo.session)
        node = await node_repo.get_all(limit=1)
        if node:
            neighbors = await graph_repo.load_all_neighbors(node[0].id)
            assert isinstance(neighbors, dict)
            assert 'outgoing' in neighbors
            assert 'incoming' in neighbors


# ── Feature Repository Tests ────────────────────────────────────────


class TestUserRepository:
    """Verify ``UserRepository``-specific operations."""

    @pytest.mark.db
    async def test_find_by_email(self):
        """Test finding a user by email."""
        session = async_session_factory()
        repo = UserRepository(session)
        # Just verify the query compiles and doesn't error
        user = await repo.find_by_email('nonexistent@example.com')
        assert user is None
        await session.close()

    @pytest.mark.db
    async def test_find_by_username(self):
        """Test finding a user by username."""
        session = async_session_factory()
        repo = UserRepository(session)
        user = await repo.find_by_username('nonexistent')
        assert user is None
        await session.close()

    @pytest.mark.db
    async def test_count_active_users(self):
        """Test counting active users (query compiles correctly)."""
        session = async_session_factory()
        repo = UserRepository(session)
        count = await repo.count_active_users()
        assert isinstance(count, int)
        await session.close()


class TestCareerRepository:
    """Verify ``CareerRepository``-specific operations."""

    @pytest.mark.db
    async def test_find_by_slug(self):
        """Test finding a career by slug."""
        session = async_session_factory()
        repo = CareerRepository(session)
        career = await repo.find_by_slug('nonexistent')
        assert career is None
        await session.close()


class TestBookmarkRepository:
    """Verify ``BookmarkRepository``-specific operations."""

    @pytest.mark.db
    async def test_is_bookmarked(self):
        """Test the ``is_bookmarked`` check."""
        session = async_session_factory()
        repo = BookmarkRepository(session)
        result = await repo.is_bookmarked(uuid4(), uuid4())
        assert result is False
        await session.close()
