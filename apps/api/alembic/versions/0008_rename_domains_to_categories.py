"""Rename ``domains`` table to ``categories``.

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-25

This migration renames the ``domains`` table (created in migration 0007)
to ``categories`` for consistency with the project's established naming
convention (PHASE5_MASTER_CONTEXT.md §6, Task 4 resolution).

Changes
-------
- RENAME TABLE domains → categories
- RENAME CONSTRAINT pk_domains → pk_categories
- RENAME INDEX idx_domains_slug → idx_categories_slug
- RENAME INDEX idx_domains_parent → idx_categories_parent
- Drop and re-create the self-referential FK with updated constraint name
"""

from collections.abc import Sequence

from sqlalchemy import text

from alembic import op

revision: str = '0008'
down_revision: str | None = '0007'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Rename domains → categories."""

    # Drop the self-referential FK first (it references the table we're renaming)
    op.execute(text('ALTER TABLE domains DROP CONSTRAINT IF EXISTS domains_parent_id_fkey'))

    # Rename the table
    op.execute(text('ALTER TABLE IF EXISTS domains RENAME TO categories'))

    # Rename primary key constraint
    # PostgreSQL auto-generates PK constraint names as {tablename}_pkey
    op.execute(text('ALTER TABLE categories RENAME CONSTRAINT domains_pkey TO categories_pkey'))

    # Rename indexes
    op.execute(text('ALTER INDEX IF EXISTS idx_domains_slug RENAME TO idx_categories_slug'))
    op.execute(text('ALTER INDEX IF EXISTS idx_domains_parent RENAME TO idx_categories_parent'))

    # Re-create the self-referential FK with updated table name
    op.execute(
        text("""
        ALTER TABLE categories
            ADD CONSTRAINT fk_categories_parent_id_categories
            FOREIGN KEY (parent_id) REFERENCES categories(id)
            ON DELETE SET NULL
    """)
    )


def downgrade() -> None:
    """Revert: rename categories back to domains."""

    # Drop the re-created FK
    op.execute(
        text('ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_parent_id_categories')
    )

    # Rename indexes back
    op.execute(text('ALTER INDEX IF EXISTS idx_categories_slug RENAME TO idx_domains_slug'))
    op.execute(text('ALTER INDEX IF EXISTS idx_categories_parent RENAME TO idx_domains_parent'))

    # Rename primary key constraint back
    op.execute(text('ALTER TABLE categories RENAME CONSTRAINT categories_pkey TO domains_pkey'))

    # Rename the table back
    op.execute(text('ALTER TABLE IF EXISTS categories RENAME TO domains'))

    # Re-create original FK
    op.execute(
        text("""
        ALTER TABLE domains
            ADD CONSTRAINT domains_parent_id_fkey
            FOREIGN KEY (parent_id) REFERENCES domains(id)
            ON DELETE SET NULL
    """)
    )
