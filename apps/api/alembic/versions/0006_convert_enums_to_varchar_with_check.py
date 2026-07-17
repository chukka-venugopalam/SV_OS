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

Verification
------------
- No data loss — native enum values are already stored as the same
  lowercase strings that VARCHAR will hold.
- All CHECK constraints mirror the valid values defined in the Python
  ``StrEnum`` classes in ``app.models.enums``.
"""

from collections.abc import Sequence

from sqlalchemy import text

from alembic import op

revision: str = '0006'
down_revision: str | None = '0005'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════


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
            f'CHECK ({column} IN ({values_sql}))'
        )
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
        """)
    )

    # Step 3: Cast VARCHAR back to the native enum
    op.execute(
        text(
            f'ALTER TABLE {table} ALTER COLUMN {column} '
            f'TYPE {enum_name} USING {column}::{enum_name}'
        )
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
    """Convert all native enum columns to VARCHAR(50) with CHECK constraints."""
    for table, column, valid_values, constraint_name in ENUM_COLUMNS:
        _alter_enum_to_varchar(table, column, valid_values, constraint_name)


# ═══════════════════════════════════════════════════════════════════
# DOWNGRADE
# ═══════════════════════════════════════════════════════════════════


def downgrade() -> None:
    """Restore native PostgreSQL enum columns (drop CHECK, recreate enum types)."""
    for entry in ENUM_RESTORE:
        _drop_check_and_restore_enum(*entry)
