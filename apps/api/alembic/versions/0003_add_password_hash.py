"""Add password_hash column to users table.

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-04
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = '0003'
down_revision: str | None = '0002'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'password_hash',
            sa.String(255),
            nullable=True,
            comment='Bcrypt hash of the user password',
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'password_hash')
