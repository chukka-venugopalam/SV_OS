"""
Activity Feed Service — builds a chronological user activity feed.

Sources activity from:
- Progress updates (started, completed, mastered)
- Bookmark events (added, removed)
- Favorite events (added, removed)
- Learning path completions

All data is enriched with node titles and slugs via JOINs to
avoid N+1 queries.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Select, func, select, union, literal, text
from structlog.stdlib import get_logger

from app.repositories import UnitOfWork

logger = get_logger(__name__)


ACTIVITY_TYPE_PROGRESS_STARTED = 'progress_started'
ACTIVITY_TYPE_PROGRESS_UPDATED = 'progress_updated'
ACTIVITY_TYPE_NODE_COMPLETED = 'node_completed'
ACTIVITY_TYPE_NODE_MASTERED = 'node_mastered'
ACTIVITY_TYPE_BOOKMARK_ADDED = 'bookmark_added'
ACTIVITY_TYPE_BOOKMARK_REMOVED = 'bookmark_removed'
ACTIVITY_TYPE_FAVORITE_ADDED = 'favorite_added'
ACTIVITY_TYPE_FAVORITE_REMOVED = 'favorite_removed'
ACTIVITY_TYPE_PATH_COMPLETED = 'learning_path_completed'


class ActivityFeedService:
    """Builds a chronological activity feed for a user.

    Combines multiple data sources (progress, bookmarks, favorites)
    into a unified, paginated feed enriched with node metadata.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    async def get_feed(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Get the chronological activity feed for a user.

        Args:
            user_id: The user's UUID.
            page: Page number (1-indexed).
            per_page: Items per page.

        Returns:
            A dict with ``items``, ``total``, ``page``, ``per_page``,
            ``total_pages``.
        """
        offset = (page - 1) * per_page

        # Build raw SQL union for performance — no ORM overhead for feed queries
        query = text("""
            WITH activity_union AS (
                -- Progress started
                SELECT
                    up.id AS id,
                    'progress_started' AS activity_type,
                    kn.title AS title,
                    'Started learning' AS description,
                    kn.id AS node_id,
                    kn.slug AS node_slug,
                    up.started_at AS timestamp,
                    jsonb_build_object('status', up.status, 'time_spent', up.time_spent_minutes) AS metadata
                FROM user_progress up
                JOIN knowledge_nodes kn ON kn.id = up.node_id
                WHERE up.user_id = :user_id
                    AND up.started_at IS NOT NULL
                    AND up.is_deleted = false

                UNION ALL

                -- Progress updated (status changed, not initial start)
                SELECT
                    up.id || '_updated' AS id,
                    'progress_updated' AS activity_type,
                    kn.title AS title,
                    'Progress updated to ' || up.status AS description,
                    kn.id AS node_id,
                    kn.slug AS node_slug,
                    up.updated_at AS timestamp,
                    jsonb_build_object('status', up.status, 'time_spent', up.time_spent_minutes) AS metadata
                FROM user_progress up
                JOIN knowledge_nodes kn ON kn.id = up.node_id
                WHERE up.user_id = :user_id
                    AND up.is_deleted = false

                UNION ALL

                -- Node completed
                SELECT
                    up.id || '_completed' AS id,
                    'node_completed' AS activity_type,
                    kn.title AS title,
                    'Completed learning' AS description,
                    kn.id AS node_id,
                    kn.slug AS node_slug,
                    up.completed_at AS timestamp,
                    jsonb_build_object('status', 'completed', 'time_spent', up.time_spent_minutes) AS metadata
                FROM user_progress up
                JOIN knowledge_nodes kn ON kn.id = up.node_id
                WHERE up.user_id = :user_id
                    AND up.completed_at IS NOT NULL
                    AND up.is_deleted = false

                UNION ALL

                -- Node mastered
                SELECT
                    up.id || '_mastered' AS id,
                    'node_mastered' AS activity_type,
                    kn.title AS title,
                    'Mastered this topic' AS description,
                    kn.id AS node_id,
                    kn.slug AS node_slug,
                    up.mastered_at AS timestamp,
                    jsonb_build_object('status', 'mastered', 'time_spent', up.time_spent_minutes) AS metadata
                FROM user_progress up
                JOIN knowledge_nodes kn ON kn.id = up.node_id
                WHERE up.user_id = :user_id
                    AND up.mastered_at IS NOT NULL
                    AND up.is_deleted = false

                UNION ALL

                -- Bookmarks added
                SELECT
                    bm.id || '_bookmarked' AS id,
                    'bookmark_added' AS activity_type,
                    kn.title AS title,
                    'Bookmarked this topic' AS description,
                    kn.id AS node_id,
                    kn.slug AS node_slug,
                    bm.created_at AS timestamp,
                    '{}'::jsonb AS metadata
                FROM bookmarks bm
                JOIN knowledge_nodes kn ON kn.id = bm.node_id
                WHERE bm.user_id = :user_id
                    AND bm.is_deleted = false

                UNION ALL

                -- Favorites added
                SELECT
                    fv.id || '_favorited' AS id,
                    'favorite_added' AS activity_type,
                    kn.title AS title,
                    'Added to favorites' AS description,
                    kn.id AS node_id,
                    kn.slug AS node_slug,
                    fv.created_at AS timestamp,
                    '{}'::jsonb AS metadata
                FROM favorites fv
                JOIN knowledge_nodes kn ON kn.id = fv.node_id
                WHERE fv.user_id = :user_id
                    AND fv.is_deleted = false
            )
            SELECT * FROM activity_union
            WHERE timestamp IS NOT NULL
            ORDER BY timestamp DESC
            LIMIT :limit OFFSET :offset
        """)

        # Count query
        count_query = text("""
            SELECT COUNT(*) FROM (
                SELECT up.id FROM user_progress up
                WHERE up.user_id = :user_id AND up.is_deleted = false
                UNION ALL
                SELECT bm.id FROM bookmarks bm
                WHERE bm.user_id = :user_id AND bm.is_deleted = false
                UNION ALL
                SELECT fv.id FROM favorites fv
                WHERE fv.user_id = :user_id AND fv.is_deleted = false
            ) AS all_activities
        """)

        result = await self._uow.session.execute(
            count_query, {"user_id": user_id}
        )
        total = result.scalar() or 0

        result = await self._uow.session.execute(
            query,
            {
                "user_id": user_id,
                "limit": per_page,
                "offset": offset,
            },
        )
        rows = result.all()

        items = []
        for row in rows:
            items.append({
                "id": str(row[0]),
                "activity_type": row[1],
                "title": row[2],
                "description": row[3],
                "node_id": str(row[4]) if row[4] else None,
                "node_slug": row[5],
                "timestamp": row[6].isoformat() if row[6] else None,
                "metadata": row[7] if row[7] else {},
            })

        total_pages = max(1, (total + per_page - 1) // per_page) if total else 1

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        }
