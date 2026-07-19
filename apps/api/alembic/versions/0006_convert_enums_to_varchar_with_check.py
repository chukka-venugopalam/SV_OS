"""Convert PostgreSQL native enum columns to VARCHAR(50) with CHECK constraints.

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-17

This migration is required to support the new ``PgEnumType`` implementation
which uses ``TypeDecorator`` with ``String`` instead of the old ``PgEnum``
which extended ``SAEnum`` with ``native_enum=True``.

The new ``TypeDecorator``-based approach guarantees that
``process_result_value`` is called on EVERY read path (SELECT, refresh,
post-flush RETURNING), eliminating the unreliable ``after_load`` event
listener that only fired for initial loads.

Changes
-------
For each native PostgreSQL enum column:
1. ALTER COLUMN ... TYPE VARCHAR(50) — native enum values are already
   stored as lowercase strings, so no data transformation is needed.
2. ADD CONSTRAINT ... CHECK (column IN (...)) — preserves data integrity.

This affects all 13 PostgreSQL enum types and their 17 column usages.

View Handling
-------------
PostgreSQL refuses to ``ALTER COLUMN ... TYPE`` on columns referenced by
views or rules.  The following views depend on enum columns:

- ``v_node_statistics`` — depends on ``knowledge_nodes.node_type``
  and ``knowledge_nodes.difficulty``
- ``v_user_progress_summary`` — depends on ``user_progress.status``

The migration therefore:
1. Drops dependent views before altering columns.
2. Performs all enum-to-VARCHAR conversions.
3. Adds all CHECK constraints.
4. Recreates the views exactly as they were.

Verification
------------
- No data loss — native enum values are already stored as the same
  lowercase strings that VARCHAR will hold.
- All CHECK constraints mirror the valid values defined in the Python
  ``StrEnum`` classes in ``app.models.enums``.
- Views are fully preserved (same SQL definitions as the initial schema).
"""

from collections.abc import Sequence

from sqlalchemy import text

from alembic import op

revision: str = '0006'
down_revision: str | None = '0005'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ═══════════════════════════════════════════════════════════════════
# VIEW DEFINITIONS
# ═══════════════════════════════════════════════════════════════════
# These must be dropped before altering enum column types and
# recreated afterward.


V_NODE_STATISTICS_SQL = """
CREATE OR REPLACE VIEW v_node_statistics AS
SELECT
    n.id,
    n.slug,
    n.title,
    n.node_type,
    n.difficulty,
    n.estimated_minutes,
    n.view_count,
    COUNT(DISTINCT e_in.target_node_id) AS prerequisite_count,
    COUNT(DISTINCT e_out.source_node_id) AS unlock_count,
    COUNT(DISTINCT lr.id) AS resource_count
FROM knowledge_nodes n
LEFT JOIN knowledge_edges e_in
    ON e_in.source_node_id = n.id
    AND e_in.relationship_type = 'prerequisite'
LEFT JOIN knowledge_edges e_out
    ON e_out.target_node_id = n.id
    AND e_out.relationship_type = 'prerequisite'
LEFT JOIN learning_resources lr ON lr.node_id = n.id
WHERE n.is_published = true
    AND n.is_deleted = false
GROUP BY n.id, n.slug, n.title, n.node_type,
         n.difficulty, n.estimated_minutes, n.view_count
"""

V_USER_PROGRESS_SUMMARY_SQL = """
CREATE OR REPLACE VIEW v_user_progress_summary AS
SELECT
    up.user_id,
    COUNT(*) AS total_nodes,
    COUNT(*) FILTER (WHERE up.status = 'not_started') AS not_started_count,
    COUNT(*) FILTER (WHERE up.status = 'learning') AS learning_count,
    COUNT(*) FILTER (WHERE up.status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE up.status = 'mastered') AS mastered_count,
    SUM(up.time_spent_minutes) AS total_time_minutes
FROM user_progress up
WHERE up.is_deleted = false
GROUP BY up.user_id
"""

ALL_VIEW_NAMES = ['v_node_statistics', 'v_user_progress_summary']
ALL_VIEW_SQL = [V_NODE_STATISTICS_SQL, V_USER_PROGRESS_SUMMARY_SQL]


# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════


def _drop_views() -> None:
    """Drop all views that depend on enum columns being altered.

    Idempotent: uses ``DROP VIEW IF EXISTS`` so it is safe on a
    fresh database where views do not yet exist.
    """
    for view_name in ALL_VIEW_NAMES:
        op.execute(text(f'DROP VIEW IF EXISTS {view_name}'))


def _recreate_views() -> None:
    """Recreate all views that were dropped.

    Uses ``CREATE OR REPLACE VIEW`` so it is idempotent.
    """
    for view_sql in ALL_VIEW_SQL:
        op.execute(text(view_sql))


def _alter_enum_to_varchar(
    table: str,
    column: str,
    check_values: list[str],
    constraint_name: str,
) -> None:
    """Convert a native PostgreSQL enum column to VARCHAR(50) with a CHECK constraint.

    Args:
        table: Table name.
        column: Column name.
        check_values: List of valid string values for the CHECK constraint.
        constraint_name: Name for the CHECK constraint.

    """
    # Step 1: Cast the native enum column to VARCHAR(50).
    # Native enum values are stored as strings, so this is a safe cast.
    op.execute(text(f'ALTER TABLE {table} ALTER COLUMN {column} TYPE VARCHAR(50)'))

    # Step 2: Add a CHECK constraint to preserve data integrity.
    values_sql = ', '.join(repr(v) for v in check_values)
    op.execute(
        text(
            f'ALTER TABLE {table} ADD CONSTRAINT {constraint_name} '
            f'CHECK ({column} IN ({values_sql}))',
        ),
    )


def _drop_check_and_restore_enum(
    table: str,
    column: str,
    enum_name: str,
    enum_values: list[str],
    constraint_name: str,
    default_sql: str | None = None,
) -> None:
    """Reverse _alter_enum_to_varchar — drop CHECK and restore native enum.

    Args:
        table: Table name.
        column: Column name.
        enum_name: PostgreSQL enum type name.
        enum_values: List of valid enum values.
        constraint_name: Name of the CHECK constraint to drop.
        default_sql: Optional DEFAULT clause to set after type change.

    """
    # Step 1: Drop the CHECK constraint
    op.execute(text(f'ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {constraint_name}'))

    # Step 2: Recreate the enum type (if it was dropped)
    values_sql = ', '.join(repr(v) for v in enum_values)
    op.execute(
        text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{enum_name}') THEN
                    CREATE TYPE {enum_name} AS ENUM ({values_sql});
                END IF;
            END
            $$;
        """),
    )

    # Step 3: Cast VARCHAR back to the native enum
    op.execute(
        text(
            f'ALTER TABLE {table} ALTER COLUMN {column} '
            f'TYPE {enum_name} USING {column}::{enum_name}',
        ),
    )

    # Step 4: Restore default if provided
    if default_sql:
        op.execute(text(f'ALTER TABLE {table} ALTER COLUMN {column} SET {default_sql}'))


# ═══════════════════════════════════════════════════════════════════
# ENUM COLUMN DEFINITIONS
# ═══════════════════════════════════════════════════════════════════

# (table, column, valid_values, constraint_name)
ENUM_COLUMNS: list[tuple[str, str, list[str], str]] = [
    # user_role_enum
    ('users', 'role', ['learner', 'admin'], 'ck_users_role'),
    # node_type_enum
    (
        'knowledge_nodes',
        'node_type',
        [
            'subject',
            'concept',
            'technology',
            'tool',
            'career',
            'project',
        ],
        'ck_knowledge_nodes_node_type',
    ),
    # difficulty_enum (used across 6 tables)
    (
        'knowledge_nodes',
        'difficulty',
        [
            'beginner',
            'intermediate',
            'advanced',
            'expert',
        ],
        'ck_knowledge_nodes_difficulty',
    ),
    (
        'skills',
        'difficulty',
        [
            'beginner',
            'intermediate',
            'advanced',
            'expert',
        ],
        'ck_skills_difficulty',
    ),
    (
        'projects',
        'difficulty',
        [
            'beginner',
            'intermediate',
            'advanced',
            'expert',
        ],
        'ck_projects_difficulty',
    ),
    (
        'learning_paths',
        'difficulty',
        [
            'beginner',
            'intermediate',
            'advanced',
            'expert',
        ],
        'ck_learning_paths_difficulty',
    ),
    (
        'learning_resources',
        'difficulty',
        [
            'beginner',
            'intermediate',
            'advanced',
            'expert',
        ],
        'ck_learning_resources_difficulty',
    ),
    # edge_type_enum
    (
        'knowledge_edges',
        'relationship_type',
        [
            'prerequisite',
            'depends_on',
            'uses',
            'enables',
            'part_of',
            'related_to',
            'leads_to',
            'requires',
        ],
        'ck_knowledge_edges_relationship_type',
    ),
    # edge_direction_enum
    (
        'knowledge_edges',
        'direction',
        [
            'forward',
            'bidirectional',
            'unidirectional',
        ],
        'ck_knowledge_edges_direction',
    ),
    # progress_enum
    (
        'user_progress',
        'status',
        [
            'not_started',
            'learning',
            'completed',
            'mastered',
        ],
        'ck_user_progress_status',
    ),
    # demand_enum
    (
        'careers',
        'demand_level',
        [
            'declining',
            'stable',
            'growing',
            'high_demand',
        ],
        'ck_careers_demand_level',
    ),
    # resource_type_enum
    (
        'learning_resources',
        'resource_type',
        [
            'video',
            'article',
            'course',
            'book',
            'documentation',
            'tool',
            'podcast',
            'interactive',
        ],
        'ck_learning_resources_resource_type',
    ),
    # learning_status_enum
    (
        'learning_sessions',
        'status',
        [
            'active',
            'paused',
            'completed',
            'abandoned',
        ],
        'ck_learning_sessions_status',
    ),
    # recommendation_type_enum
    (
        'recommendations',
        'recommendation_type',
        [
            'career_path',
            'learning_path',
            'skill_gap',
            'related_content',
            'popular',
            'next_step',
        ],
        'ck_recommendations_recommendation_type',
    ),
    # requirement_type_enum (used across 2 tables)
    (
        'career_requirements',
        'requirement_type',
        [
            'required',
            'recommended',
            'bonus',
        ],
        'ck_career_requirements_requirement_type',
    ),
    (
        'project_requirements',
        'requirement_type',
        [
            'required',
            'recommended',
            'bonus',
        ],
        'ck_project_requirements_requirement_type',
    ),
    # skill_relationship_type_enum
    (
        'skill_relationships',
        'relationship_type',
        [
            'prerequisite',
            'builds_upon',
            'complement',
            'specialization',
            'alternative',
        ],
        'ck_skill_relationships_relationship_type',
    ),
]

# Reverse migration data: (table, column, enum_name, enum_values, constraint_name, default_sql)
ENUM_RESTORE: list[tuple[str, str, str, list[str], str, str | None]] = [
    # user_role_enum
    ('users', 'role', 'user_role_enum', ['learner', 'admin'], 'ck_users_role', "DEFAULT 'learner'"),
    # node_type_enum
    (
        'knowledge_nodes',
        'node_type',
        'node_type_enum',
        ['subject', 'concept', 'technology', 'tool', 'career', 'project'],
        'ck_knowledge_nodes_node_type',
        None,
    ),
    # difficulty_enum
    (
        'knowledge_nodes',
        'difficulty',
        'difficulty_enum',
        ['beginner', 'intermediate', 'advanced', 'expert'],
        'ck_knowledge_nodes_difficulty',
        "DEFAULT 'beginner'",
    ),
    (
        'skills',
        'difficulty',
        'difficulty_enum',
        ['beginner', 'intermediate', 'advanced', 'expert'],
        'ck_skills_difficulty',
        "DEFAULT 'beginner'",
    ),
    (
        'projects',
        'difficulty',
        'difficulty_enum',
        ['beginner', 'intermediate', 'advanced', 'expert'],
        'ck_projects_difficulty',
        "DEFAULT 'intermediate'",
    ),
    (
        'learning_paths',
        'difficulty',
        'difficulty_enum',
        ['beginner', 'intermediate', 'advanced', 'expert'],
        'ck_learning_paths_difficulty',
        "DEFAULT 'beginner'",
    ),
    (
        'learning_resources',
        'difficulty',
        'difficulty_enum',
        ['beginner', 'intermediate', 'advanced', 'expert'],
        'ck_learning_resources_difficulty',
        "DEFAULT 'beginner'",
    ),
    # edge_type_enum
    (
        'knowledge_edges',
        'relationship_type',
        'edge_type_enum',
        [
            'prerequisite',
            'depends_on',
            'uses',
            'enables',
            'part_of',
            'related_to',
            'leads_to',
            'requires',
        ],
        'ck_knowledge_edges_relationship_type',
        None,
    ),
    # edge_direction_enum
    (
        'knowledge_edges',
        'direction',
        'edge_direction_enum',
        ['forward', 'bidirectional', 'unidirectional'],
        'ck_knowledge_edges_direction',
        "DEFAULT 'forward'",
    ),
    # progress_enum
    (
        'user_progress',
        'status',
        'progress_enum',
        ['not_started', 'learning', 'completed', 'mastered'],
        'ck_user_progress_status',
        "DEFAULT 'not_started'",
    ),
    # demand_enum
    (
        'careers',
        'demand_level',
        'demand_enum',
        ['declining', 'stable', 'growing', 'high_demand'],
        'ck_careers_demand_level',
        "DEFAULT 'growing'",
    ),
    # resource_type_enum
    (
        'learning_resources',
        'resource_type',
        'resource_type_enum',
        ['video', 'article', 'course', 'book', 'documentation', 'tool', 'podcast', 'interactive'],
        'ck_learning_resources_resource_type',
        None,
    ),
    # learning_status_enum
    (
        'learning_sessions',
        'status',
        'learning_status_enum',
        ['active', 'paused', 'completed', 'abandoned'],
        'ck_learning_sessions_status',
        "DEFAULT 'active'",
    ),
    # recommendation_type_enum
    (
        'recommendations',
        'recommendation_type',
        'recommendation_type_enum',
        ['career_path', 'learning_path', 'skill_gap', 'related_content', 'popular', 'next_step'],
        'ck_recommendations_recommendation_type',
        None,
    ),
    # requirement_type_enum
    (
        'career_requirements',
        'requirement_type',
        'requirement_type_enum',
        ['required', 'recommended', 'bonus'],
        'ck_career_requirements_requirement_type',
        None,
    ),
    (
        'project_requirements',
        'requirement_type',
        'requirement_type_enum',
        ['required', 'recommended', 'bonus'],
        'ck_project_requirements_requirement_type',
        None,
    ),
    # skill_relationship_type_enum
    (
        'skill_relationships',
        'relationship_type',
        'skill_relationship_type_enum',
        ['prerequisite', 'builds_upon', 'complement', 'specialization', 'alternative'],
        'ck_skill_relationships_relationship_type',
        None,
    ),
]


# ═══════════════════════════════════════════════════════════════════
# UPGRADE
# ═══════════════════════════════════════════════════════════════════


def upgrade() -> None:
    """Convert all native enum columns to VARCHAR(50) with CHECK constraints.

    Order of operations:
    1. Drop views that depend on enum columns (idempotent).
    2. Alter each enum column to VARCHAR(50).
    3. Add CHECK constraints.
    4. Recreate views exactly as they were.
    """
    # Step 1: Drop dependent views before altering column types.
    # PostgreSQL refuses ALTER COLUMN ... TYPE on columns referenced
    # by views or rules.
    _drop_views()

    # Step 2: Convert all enum columns to VARCHAR(50) and add CHECK constraints.
    for table, column, valid_values, constraint_name in ENUM_COLUMNS:
        _alter_enum_to_varchar(table, column, valid_values, constraint_name)

    # Step 3: Recreate views that were dropped.
    _recreate_views()


# ═══════════════════════════════════════════════════════════════════
# DOWNGRADE
# ═══════════════════════════════════════════════════════════════════


def downgrade() -> None:
    """Restore native PostgreSQL enum columns (drop CHECK, recreate enum types).

    Order of operations:
    1. Drop views (they depend on VARCHAR columns that will be converted).
    2. Drop CHECK constraints and restore native enum types.
    3. Recreate views.
    """
    # Step 1: Drop views (they reference the columns we are converting).
    _drop_views()

    # Step 2: Restore native enum types.
    for entry in ENUM_RESTORE:
        _drop_check_and_restore_enum(*entry)

    # Step 3: Recreate views now that native enum columns are restored.
    _recreate_views()
