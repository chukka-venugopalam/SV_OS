"""Tests for ActivityFeedService — chronological activity feed.

Tests verify feed construction, pagination, and edge cases
using mocked UnitOfWork.
"""

from __future__ import annotations

from datetime import UTC
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.services.activity_feed import ActivityFeedService


@pytest.fixture
def mock_uow():
    """Create a mock UnitOfWork."""
    uow = MagicMock()
    uow.session = AsyncMock()
    uow.knowledge_nodes = AsyncMock()
    return uow


@pytest.fixture
def feed_service(mock_uow):
    """Create an ActivityFeedService with a mock UoW."""
    return ActivityFeedService(mock_uow)


class TestActivityFeed:
    """Test get_feed."""

    @pytest.mark.asyncio
    async def test_empty_feed(self, feed_service, mock_uow) -> None:
        """Test returns empty feed for user with no activity."""
        mock_execute = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar.return_value = 0
        mock_result.all.return_value = []
        mock_execute.side_effect = [mock_result, mock_result]
        mock_uow.session.execute = mock_execute

        result = await feed_service.get_feed(
            user_id=uuid4(),
            page=1,
            per_page=20,
        )

        assert result['items'] == []
        assert result['total'] == 0
        assert result['page'] == 1

    @pytest.mark.asyncio
    async def test_feed_pagination(self, feed_service, mock_uow) -> None:
        """Test feed respects pagination parameters."""
        mock_execute = AsyncMock()
        mock_count = MagicMock()
        mock_count.scalar.return_value = 50
        mock_data = MagicMock()
        mock_data.all.return_value = []
        mock_execute.side_effect = [mock_count, mock_data]
        mock_uow.session.execute = mock_execute

        result = await feed_service.get_feed(
            user_id=uuid4(),
            page=2,
            per_page=10,
        )

        assert result['page'] == 2
        assert result['per_page'] == 10
        assert result['total'] == 50
        assert result['total_pages'] == 5

    @pytest.mark.asyncio
    async def test_feed_with_activity_items(self, feed_service, mock_uow) -> None:
        """Test feed returns properly formatted activity items."""
        from datetime import datetime

        mock_execute = AsyncMock()
        mock_count = MagicMock()
        mock_count.scalar.return_value = 1

        row = (
            str(uuid4()),  # id
            'progress_started',  # activity_type
            'Python Basics',  # title
            'Started learning',  # description
            str(uuid4()),  # node_id
            'python-basics',  # node_slug
            datetime.now(UTC),  # timestamp
            {'status': 'learning', 'time_spent': 0},  # metadata
        )
        mock_data = MagicMock()
        mock_data.all.return_value = [row]
        mock_execute.side_effect = [mock_count, mock_data]
        mock_uow.session.execute = mock_execute

        result = await feed_service.get_feed(
            user_id=uuid4(),
            page=1,
            per_page=20,
        )

        assert len(result['items']) == 1
        item = result['items'][0]
        assert item['activity_type'] == 'progress_started'
        assert item['title'] == 'Python Basics'
        assert item['node_slug'] == 'python-basics'
        assert 'timestamp' in item
        assert 'metadata' in item

    @pytest.mark.asyncio
    async def test_feed_returns_all_activity_types(self, feed_service, mock_uow) -> None:
        """Test feed handles various activity types."""
        from datetime import datetime

        mock_execute = AsyncMock()
        mock_count = MagicMock()
        mock_count.scalar.return_value = 3

        rows = [
            (
                str(uuid4()),
                'node_completed',
                'Node A',
                'Completed learning',
                str(uuid4()),
                'node-a',
                datetime.now(UTC),
                {},
            ),
            (
                str(uuid4()),
                'bookmark_added',
                'Node B',
                'Bookmarked this topic',
                str(uuid4()),
                'node-b',
                datetime.now(UTC),
                {},
            ),
            (
                str(uuid4()),
                'progress_updated',
                'Node C',
                'Progress updated to learning',
                str(uuid4()),
                'node-c',
                datetime.now(UTC),
                {},
            ),
        ]
        mock_data = MagicMock()
        mock_data.all.return_value = rows
        mock_execute.side_effect = [mock_count, mock_data]
        mock_uow.session.execute = mock_execute

        result = await feed_service.get_feed(user_id=uuid4(), page=1, per_page=20)

        assert len(result['items']) == 3
        types = [i['activity_type'] for i in result['items']]
        assert 'node_completed' in types
        assert 'bookmark_added' in types
        assert 'progress_updated' in types


class TestEdgeCases:
    """Test edge cases."""

    @pytest.mark.asyncio
    async def test_large_page_number(self, feed_service, mock_uow) -> None:
        """Test large page number returns empty items."""
        mock_execute = AsyncMock()
        mock_count = MagicMock()
        mock_count.scalar.return_value = 5
        mock_data = MagicMock()
        mock_data.all.return_value = []
        mock_execute.side_effect = [mock_count, mock_data]
        mock_uow.session.execute = mock_execute

        result = await feed_service.get_feed(user_id=uuid4(), page=999, per_page=20)

        assert result['items'] == []
        assert result['total'] == 5

    @pytest.mark.asyncio
    async def test_excessive_per_page(self, feed_service, mock_uow) -> None:
        """Test that per_page is passed through (validation at endpoint level)."""
        mock_execute = AsyncMock()
        mock_count = MagicMock()
        mock_count.scalar.return_value = 0
        mock_data = MagicMock()
        mock_data.all.return_value = []
        mock_execute.side_effect = [mock_count, mock_data]
        mock_uow.session.execute = mock_execute

        result = await feed_service.get_feed(user_id=uuid4(), page=1, per_page=500)

        assert result['total'] == 0
