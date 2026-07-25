"""Phase 5 audit remediation — domain taxonomy, learning goals, content status.

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-24

This migration implements the Phase 5 audit remediation plan:

1. **Domain taxonomy** (Task 4) — New ``domains`` table with slug, display_name,
   aliases[], and parent_id for hierarchy.  Replaces the free-form domain string
   with a canonical taxonomy (40 domains, 3 collision pairs resolved).

2. **Learning goals** (Task 5) — New ``learning_goals`` table separate from
   ``careers``, with ``learning_goal_nodes`` join table for the many-to-many
   relationship with ``knowledge_nodes``.  Migrate any existing ``is_learning_goal``
   records from ``careers`` metadata into the new tables.

3. **Content authoring state** (Task 6) — New columns on ``knowledge_nodes``:
   ``content_status`` (enum: stub/draft/in_review/verified/published/archived),
   ``reviewed_at``, ``reviewed_by`` (FK to users), ``quality_score``, and
   ``missing_sections`` (TEXT[]).

4. **Unlocks view** (Task 3) — New ``knowledge_node_unlocks`` view deriving
   unlocks from ``knowledge_edges`` rather than storing them.

Changes
-------
- CREATE TYPE content_status AS ENUM
- CREATE TYPE goal_type_enum AS ENUM
- CREATE TABLE domains (with self-referential FK for hierarchy)
- ALTER TABLE knowledge_nodes ADD COLUMN content_status, reviewed_at, etc.
- CREATE TABLE learning_goals
- CREATE TABLE learning_goal_nodes
- CREATE VIEW knowledge_node_unlocks
"""

from collections.abc import Sequence

from sqlalchemy import text

from alembic import op

revision: str = '0007'
down_revision: str | None = '0006'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ═══════════════════════════════════════════════════════════════════
# Helper: create / drop new enums
# ═══════════════════════════════════════════════════════════════════


def _create_content_status_enum() -> None:
    op.execute(
        text("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
                CREATE TYPE content_status AS ENUM (
                    'stub', 'draft', 'in_review', 'verified', 'published', 'archived'
                );
            END IF;
        END
        $$;
    """)
    )


def _create_goal_type_enum() -> None:
    op.execute(
        text("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_type_enum') THEN
                CREATE TYPE goal_type_enum AS ENUM (
                    'exam', 'certification', 'interview_prep', 'custom'
                );
            END IF;
        END
        $$;
    """)
    )


def _drop_goal_type_enum() -> None:
    op.execute(text('DROP TYPE IF EXISTS goal_type_enum'))


def _drop_content_status_enum() -> None:
    op.execute(text('DROP TYPE IF EXISTS content_status'))


# ═══════════════════════════════════════════════════════════════════
# UPGRADE
# ═══════════════════════════════════════════════════════════════════


def upgrade() -> None:
    """Apply Phase 5 audit schema changes."""

    # ── Create new enum types ──────────────────────────────────────
    _create_content_status_enum()
    _create_goal_type_enum()

    # ── Domains table (Task 4) ─────────────────────────────────────
    op.execute(
        text("""
        CREATE TABLE IF NOT EXISTS domains (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug VARCHAR(200) UNIQUE NOT NULL,
            display_name VARCHAR(300) NOT NULL,
            aliases TEXT[] NOT NULL DEFAULT '{}',
            parent_id UUID REFERENCES domains(id) ON DELETE SET NULL,
            is_deleted BOOLEAN NOT NULL DEFAULT false,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    )
    op.execute(text('CREATE INDEX IF NOT EXISTS idx_domains_slug ON domains(slug)'))
    op.execute(text('CREATE INDEX IF NOT EXISTS idx_domains_parent ON domains(parent_id)'))

    # ── Content authoring columns on knowledge_nodes (Task 6) ─────
    op.execute(
        text("""
        ALTER TABLE knowledge_nodes
            ADD COLUMN IF NOT EXISTS content_status content_status NOT NULL DEFAULT 'stub',
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS quality_score NUMERIC(3,2) CHECK (
                quality_score BETWEEN 0 AND 1
            ),
            ADD COLUMN IF NOT EXISTS missing_sections TEXT[] DEFAULT '{}'
    """)
    )

    # ── Learning goals table (Task 5) ──────────────────────────────
    op.execute(
        text("""
        CREATE TABLE IF NOT EXISTS learning_goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug VARCHAR(200) UNIQUE NOT NULL,
            title VARCHAR(300) NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            goal_type goal_type_enum NOT NULL DEFAULT 'custom',
            is_deleted BOOLEAN NOT NULL DEFAULT false,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    )
    op.execute(text('CREATE INDEX IF NOT EXISTS idx_learning_goals_slug ON learning_goals(slug)'))

    # ── Learning goal nodes join table (Task 5) ────────────────────
    op.execute(
        text("""
        CREATE TABLE IF NOT EXISTS learning_goal_nodes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            goal_id UUID NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
            node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
            requirement_type VARCHAR(50) NOT NULL DEFAULT 'required'
                CHECK (requirement_type IN ('required', 'recommended', 'bonus')),
            sequence_order INTEGER NOT NULL DEFAULT 0,
            is_deleted BOOLEAN NOT NULL DEFAULT false,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_goal_node_pair UNIQUE (goal_id, node_id)
        )
    """)
    )
    op.execute(
        text('CREATE INDEX IF NOT EXISTS idx_goal_nodes_goal ON learning_goal_nodes(goal_id)')
    )
    op.execute(
        text('CREATE INDEX IF NOT EXISTS idx_goal_nodes_node ON learning_goal_nodes(node_id)')
    )

    # ── Computed unlocks view (Task 3) ─────────────────────────────
    op.execute(
        text("""
        CREATE OR REPLACE VIEW knowledge_node_unlocks AS
        SELECT source_node_id AS node_id, target_node_id AS unlocks_node_id
        FROM knowledge_edges
        WHERE relationship_type = 'prerequisite'
    """)
    )

    # ── Migrate any existing is_learning_goal metadata from careers ─
    op.execute(
        text("""
        INSERT INTO learning_goals (id, slug, title, description, goal_type)
        SELECT
            c.id,
            c.slug,
            c.title,
            c.description,
            'custom'::goal_type_enum
        FROM careers c
        WHERE c.metadata->>'is_learning_goal' = 'true'
          AND NOT EXISTS (SELECT 1 FROM learning_goals lg WHERE lg.id = c.id)
    """)
    )


# ═══════════════════════════════════════════════════════════════════
# DOWNGRADE
# ═══════════════════════════════════════════════════════════════════


def downgrade() -> None:
    """Reverse Phase 5 audit schema changes."""

    # Drop views
    op.execute(text('DROP VIEW IF EXISTS knowledge_node_unlocks'))

    # Drop learning goal tables
    op.execute(text('DROP TABLE IF EXISTS learning_goal_nodes CASCADE'))
    op.execute(text('DROP TABLE IF EXISTS learning_goals CASCADE'))

    # Remove content authoring columns from knowledge_nodes
    op.execute(text('ALTER TABLE knowledge_nodes DROP COLUMN IF EXISTS missing_sections'))
    op.execute(text('ALTER TABLE knowledge_nodes DROP COLUMN IF EXISTS quality_score'))
    op.execute(text('ALTER TABLE knowledge_nodes DROP COLUMN IF EXISTS reviewed_by'))
    op.execute(text('ALTER TABLE knowledge_nodes DROP COLUMN IF EXISTS reviewed_at'))
    op.execute(text('ALTER TABLE knowledge_nodes DROP COLUMN IF EXISTS content_status'))

    # Drop domains table
    op.execute(text('DROP TABLE IF EXISTS domains CASCADE'))

    # Drop enum types
    _drop_goal_type_enum()
    _drop_content_status_enum()
