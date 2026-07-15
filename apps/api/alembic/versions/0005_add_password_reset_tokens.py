"""Add password_reset_tokens table for password reset flow.

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from alembic import op

revision: str = '0005'
down_revision: str | None = '0004'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'password_reset_tokens',
        sa.Column(
            'id',
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()'),
        ),
        sa.Column(
            'user_id',
            PG_UUID(as_uuid=True),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column(
            'token_hash',
            sa.String(255),
            unique=True,
            nullable=False,
        ),
        sa.Column(
            'expires_at',
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            'is_used',
            sa.Boolean,
            nullable=False,
            server_default=sa.text('false'),
        ),
        sa.Column(
            'is_deleted',
            sa.Boolean,
            nullable=False,
            server_default=sa.text('false'),
        ),
        sa.Column(
            'version',
            sa.Integer,
            nullable=False,
            server_default=sa.text('1'),
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
    )
    op.create_index(
        'ix_password_reset_token_hash',
        'password_reset_tokens',
        ['token_hash'],
    )


def downgrade() -> None:
    op.drop_table('password_reset_tokens')
