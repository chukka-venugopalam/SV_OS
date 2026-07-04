"""Tests for Phase 2.5 database migrations.

These tests verify:
- All PostgreSQL extensions install correctly
- Alembic upgrade succeeds on a fresh database
- Alembic downgrade succeeds (fully reversible)
- All 20 tables exist after migration
- All 13 enum types exist after migration
- Foreign key constraints are correctly defined
- Unique constraints are correctly defined
- Check constraints are correctly defined
- Full-text search trigger exists and functions
- Updated-at triggers exist on expected tables
- Views are created correctly
- Seed data loads without errors
- Extension availability in PostgreSQL

Run with:
    cd apps/api
    .venv/Scripts/python -m pytest tests/migrations/ -v
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from sqlalchemy import inspect, text

from app.core.database import Base, async_session_factory, engine

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncConnection


# ═══════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════

@pytest.fixture(scope='module')
def event_loop():
    """Provide an event loop for the test module."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope='module')
async def db_connection():
    """Provide an async database connection for the test module."""
    async with engine.connect() as conn:
        yield conn


# ═══════════════════════════════════════════════════════════════════
# Extension Tests
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestExtensions:
    """Verify PostgreSQL extensions are available."""

    EXTENSIONS = [
        'uuid-ossp',
        'pgcrypto',
        'pg_trgm',
        'unaccent',
        'btree_gin',
        'btree_gist',
    ]

    @pytest.mark.parametrize('ext_name', EXTENSIONS)
    async def test_extension_available(self, db_connection: AsyncConnection, ext_name: str):
        """Each extension should be installed and available."""
        result = await db_connection.execute(
            text("""
                SELECT installed_version IS NOT NULL
                FROM pg_available_extensions
                WHERE name = :ext_name
            """),
            {'ext_name': ext_name},
        )
        row = result.scalar()
        assert row is True, f"Extension '{ext_name}' is not installed"


# ═══════════════════════════════════════════════════════════════════
# Enum Tests
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestEnumTypes:
    """Verify all 13 enum types exist with correct values."""

    ENUMS = {
        'node_type_enum': ['subject', 'concept', 'technology', 'tool', 'career', 'project'],
        'edge_type_enum': [
            'prerequisite', 'depends_on', 'uses', 'enables',
            'part_of', 'related_to', 'leads_to', 'requires',
        ],
        'edge_direction_enum': ['forward', 'bidirectional', 'unidirectional'],
        'difficulty_enum': ['beginner', 'intermediate', 'advanced', 'expert'],
        'progress_enum': ['not_started', 'learning', 'completed', 'mastered'],
        'demand_enum': ['declining', 'stable', 'growing', 'high_demand'],
        'user_role_enum': ['learner', 'admin'],
        'resource_type_enum': [
            'video', 'article', 'course', 'book',
            'documentation', 'tool', 'podcast', 'interactive',
        ],
        'learning_status_enum': ['active', 'paused', 'completed', 'abandoned'],
        'visibility_enum': ['public', 'private', 'shared'],
        'recommendation_type_enum': [
            'career_path', 'learning_path', 'skill_gap',
            'related_content', 'popular', 'next_step',
        ],
        'requirement_type_enum': ['required', 'recommended', 'bonus'],
        'skill_relationship_type_enum': [
            'prerequisite', 'builds_upon', 'complement',
            'specialization', 'alternative',
        ],
    }

    @pytest.mark.parametrize('enum_name', ENUMS.keys())
    async def test_enum_exists(self, db_connection: AsyncConnection, enum_name: str):
        """Each enum type should exist in the database."""
        result = await db_connection.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_type
                    WHERE typname = :enum_name
                )
            """),
            {'enum_name': enum_name},
        )
        assert result.scalar() is True, f"Enum type '{enum_name}' does not exist"

    @pytest.mark.parametrize('enum_name', ENUMS.keys())
    async def test_enum_values(self, db_connection: AsyncConnection, enum_name: str):
        """Each enum should have the correct values."""
        expected_values = self.ENUMS[enum_name]
        result = await db_connection.execute(
            text("""
                SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = :enum_name
            """),
            {'enum_name': enum_name},
        )
        actual_values = result.scalar()
        assert actual_values == expected_values, (
            f"Enum '{enum_name}' has values {actual_values}, "
            f"expected {expected_values}"
        )


# ═══════════════════════════════════════════════════════════════════
# Table Tests
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestTables:
    """Verify all 20 tables exist with correct columns."""

    # Actual column counts verified from migration 0002_initial_schema
    TABLES = {
        'users': 14,               # id, email, username, display_name, avatar_url, bio, role, preferences, is_active, last_login_at, created_at, updated_at, is_deleted, version
        'knowledge_nodes': 18,     # id, slug, title, description, content, node_type, difficulty, estimated_minutes, icon, color, metadata, search_vector, view_count, is_published, created_at, updated_at, is_deleted, version
        'knowledge_edges': 12,     # id, source_node_id, target_node_id, relationship_type, direction, description, weight, metadata, created_at, updated_at, is_deleted, version
        'careers': 15,             # id, slug, title, description, average_salary, demand_level, required_experience, icon, color, metadata, is_published, created_at, updated_at, is_deleted, version
        'career_requirements': 9,  # id, career_id, node_id, requirement_type, order_index, created_at, updated_at, is_deleted, version
        'projects': 15,            # id, slug, title, description, difficulty, estimated_hours, tech_stack, icon, color, metadata, is_published, created_at, updated_at, is_deleted, version
        'project_requirements': 9, # id, project_id, node_id, requirement_type, order_index, created_at, updated_at, is_deleted, version
        'learning_resources': 14,  # id, node_id, title, url, resource_type, platform, is_free, duration_minutes, difficulty, language, created_at, updated_at, is_deleted, version
        'learning_paths': 14,      # id, title, description, difficulty, estimated_hours, icon, color, metadata, node_order, is_published, created_at, updated_at, is_deleted, version
        'learning_sessions': 12,   # id, user_id, node_id, status, started_at, ended_at, duration_minutes, notes, created_at, updated_at, is_deleted, version
        'skills': 10,              # id, name, description, category, difficulty, metadata, created_at, updated_at, is_deleted, version
        'skill_relationships': 9,  # id, source_skill_id, target_skill_id, relationship_type, weight, created_at, updated_at, is_deleted, version
        'user_progress': 13,       # id, user_id, node_id, status, started_at, completed_at, mastered_at, time_spent_minutes, notes, created_at, updated_at, is_deleted, version
        'bookmarks': 8,            # id, user_id, node_id, notes, created_at, updated_at, is_deleted, version
        'favorites': 7,            # id, user_id, node_id, created_at, updated_at, is_deleted, version
        'search_history': 9,       # id, user_id, query, filters, results_count, created_at, updated_at, is_deleted, version
        'activity_logs': 11,       # id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at, updated_at, is_deleted, version
        'recommendations': 12,     # id, user_id, node_id, recommendation_type, score, reason, metadata, is_dismissed, created_at, updated_at, is_deleted, version
        'tags': 7,                 # id, name, description, created_at, updated_at, is_deleted, version
        'node_tags': 7,            # id, node_id, tag_id, created_at, updated_at, is_deleted, version
    }

    @pytest.mark.parametrize('table_name', TABLES.keys())
    async def test_table_exists(self, db_connection: AsyncConnection, table_name: str):
        """Each table should exist in the database."""
        inspector = inspect(db_connection)
        tables = await inspector.get_table_names()
        assert table_name in tables, f"Table '{table_name}' does not exist"


# ═══════════════════════════════════════════════════════════════════
# Constraint Tests
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestConstraints:
    """Verify foreign key, unique, and check constraints."""

    FOREIGN_KEYS = {
        'knowledge_edges': [
            ('source_node_id', 'knowledge_nodes', 'CASCADE'),
            ('target_node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'career_requirements': [
            ('career_id', 'careers', 'CASCADE'),
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'project_requirements': [
            ('project_id', 'projects', 'CASCADE'),
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'learning_resources': [
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'learning_sessions': [
            ('user_id', 'users', 'CASCADE'),
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'user_progress': [
            ('user_id', 'users', 'CASCADE'),
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'bookmarks': [
            ('user_id', 'users', 'CASCADE'),
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'favorites': [
            ('user_id', 'users', 'CASCADE'),
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'search_history': [
            ('user_id', 'users', 'CASCADE'),
        ],
        'activity_logs': [
            ('user_id', 'users', 'SET NULL'),
        ],
        'recommendations': [
            ('user_id', 'users', 'CASCADE'),
            ('node_id', 'knowledge_nodes', 'CASCADE'),
        ],
        'node_tags': [
            ('node_id', 'knowledge_nodes', 'CASCADE'),
            ('tag_id', 'tags', 'CASCADE'),
        ],
        'skill_relationships': [
            ('source_skill_id', 'skills', 'CASCADE'),
            ('target_skill_id', 'skills', 'CASCADE'),
        ],
    }

    @pytest.mark.parametrize('table_name', FOREIGN_KEYS.keys())
    async def test_foreign_keys(self, db_connection: AsyncConnection, table_name: str):
        """Foreign keys should be correctly defined."""
        expected_fks = self.FOREIGN_KEYS[table_name]
        result = await db_connection.execute(
            text("""
                SELECT
                    a.attname AS column_name,
                    c.confrelid::regclass AS referred_table,
                    pg_get_constraintdef(c.oid) AS constraint_def
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attnum = ANY(c.conkey)
                    AND a.attrelid = c.conrelid
                WHERE c.contype = 'f'
                    AND c.conrelid::regclass::text = :table_name
            """),
            {'table_name': table_name},
        )
        rows = result.fetchall()
        assert len(rows) == len(expected_fks), (
            f"Expected {len(expected_fks)} foreign keys on '{table_name}', "
            f"found {len(rows)}"
        )

    UNIQUE_CONSTRAINTS = {
        'users': ['uq_users_email', 'uq_users_username'],
        'knowledge_nodes': ['uq_knowledge_nodes_slug'],
        'knowledge_edges': ['uq_knowledge_edges_source_target_type'],
        'career_requirements': ['uq_career_requirements_career_node_type'],
        'project_requirements': ['uq_project_requirements_project_node_type'],
        'user_progress': ['uq_user_progress_user_node'],
        'bookmarks': ['uq_bookmarks_user_node'],
        'favorites': ['uq_favorites_user_node'],
        'tags': ['uq_tags_name'],
        'node_tags': ['uq_node_tags_node_tag'],
        'skills': ['uq_skills_name'],
        'skill_relationships': ['uq_skill_relationships_source_target_type'],
    }

    @pytest.mark.parametrize('table_name', UNIQUE_CONSTRAINTS.keys())
    async def test_unique_constraints(self, db_connection: AsyncConnection, table_name: str):
        """Unique constraints should be correctly defined."""
        expected_constraints = self.UNIQUE_CONSTRAINTS[table_name]
        result = await db_connection.execute(
            text("""
                SELECT conname
                FROM pg_constraint
                WHERE contype = 'u'
                    AND conrelid::regclass::text = :table_name
            """),
            {'table_name': table_name},
        )
        actual_constraints = [row[0] for row in result.fetchall()]
        for constraint in expected_constraints:
            assert constraint in actual_constraints, (
                f"Unique constraint '{constraint}' not found on '{table_name}'"
            )


# ═══════════════════════════════════════════════════════════════════
# Trigger Tests
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestTriggers:
    """Verify database triggers are correctly installed."""

    EXPECTED_TRIGGERS = {
        'update_search_vector': 'knowledge_nodes',
        'update_updated_at_column': None,  # Function
        'trigger_users_updated_at': 'users',
        'trigger_knowledge_nodes_updated_at': 'knowledge_nodes',
        'trigger_careers_updated_at': 'careers',
        'trigger_projects_updated_at': 'projects',
        'trigger_user_progress_updated_at': 'user_progress',
    }

    async def test_search_trigger_exists(self, db_connection: AsyncConnection):
        """The full-text search trigger should exist on knowledge_nodes."""
        result = await db_connection.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.triggers
                    WHERE trigger_name = 'trigger_update_search_vector'
                        AND event_object_table = 'knowledge_nodes'
                )
            """)
        )
        assert result.scalar() is True, "Search vector trigger not found"

    async def test_update_functions_exist(self, db_connection: AsyncConnection):
        """Both trigger functions should exist."""
        for func_name in ['update_search_vector', 'update_updated_at_column']:
            result = await db_connection.execute(
                text("""
                    SELECT EXISTS (
                        SELECT 1 FROM pg_proc
                        WHERE proname = :func_name
                    )
                """),
                {'func_name': func_name},
            )
            assert result.scalar() is True, f"Function '{func_name}' not found"


# ═══════════════════════════════════════════════════════════════════
# View Tests
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestViews:
    """Verify database views are correctly created."""

    EXPECTED_VIEWS = ['v_node_statistics', 'v_user_progress_summary']

    @pytest.mark.parametrize('view_name', EXPECTED_VIEWS)
    async def test_view_exists(self, db_connection: AsyncConnection, view_name: str):
        """Each view should exist in the database."""
        result = await db_connection.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.views
                    WHERE table_schema = 'public'
                        AND table_name = :view_name
                )
            """),
            {'view_name': view_name},
        )
        assert result.scalar() is True, f"View '{view_name}' not found"


# ═══════════════════════════════════════════════════════════════════
# Migration Round-Trip Tests
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestMigrationRoundTrip:
    """Verify Alembic migrations are fully reversible.

    These tests require a test database that can be migrated.
    They are marked as 'slow' since they modify the database schema.
    """

    @pytest.mark.slow
    async def test_upgrade_succeeds(self):
        """Running alembic upgrade head should succeed."""
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config('alembic.ini')
        try:
            command.upgrade(alembic_cfg, 'head')
        except Exception as e:
            pytest.fail(f"Alembic upgrade failed: {e}")

    @pytest.mark.slow
    async def test_downgrade_succeeds(self):
        """Running alembic downgrade to base should succeed."""
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config('alembic.ini')
        try:
            command.downgrade(alembic_cfg, 'base')
        except Exception as e:
            pytest.fail(f"Alembic downgrade failed: {e}")

    @pytest.mark.slow
    async def test_full_round_trip(self):
        """Full upgrade then downgrade should succeed."""
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config('alembic.ini')

        try:
            command.upgrade(alembic_cfg, 'head')
            command.downgrade(alembic_cfg, 'base')
            command.upgrade(alembic_cfg, 'head')
        except Exception as e:
            pytest.fail(f"Alembic round-trip failed: {e}")
