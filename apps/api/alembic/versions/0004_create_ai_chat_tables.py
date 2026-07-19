"""Create AI chat, memory, and history tables.

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-08
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from alembic import op

revision: str = '0004'
down_revision: str | None = '0003'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── chat_sessions ──────────────────────────────────────────────
    op.create_table(
        'chat_sessions',
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
            'title',
            sa.String(300),
            nullable=False,
            server_default=sa.text("'New Conversation'"),
        ),
        sa.Column('session_type', sa.String(50), nullable=False, server_default=sa.text("'chat'")),
        sa.Column('metadata', JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('message_count', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('is_archived', sa.Boolean, nullable=False, server_default=sa.text('false')),
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
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('version', sa.Integer, nullable=False, server_default=sa.text('1')),
    )
    op.create_index('ix_chat_sessions_user_type', 'chat_sessions', ['user_id', 'session_type'])

    # ── chat_messages ──────────────────────────────────────────────
    op.create_table(
        'chat_messages',
        sa.Column(
            'id',
            PG_UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()'),
        ),
        sa.Column(
            'session_id',
            PG_UUID(as_uuid=True),
            sa.ForeignKey('chat_sessions.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('content_type', sa.String(50), nullable=False, server_default=sa.text("'text'")),
        sa.Column('metadata', JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('token_count', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('model_used', sa.String(100), nullable=True),
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
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('version', sa.Integer, nullable=False, server_default=sa.text('1')),
    )
    op.create_index('ix_chat_messages_session', 'chat_messages', ['session_id', 'created_at'])

    # ── ai_memories ────────────────────────────────────────────────
    op.create_table(
        'ai_memories',
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
        sa.Column('memory_type', sa.String(50), nullable=False, index=True),
        sa.Column('key', sa.String(200), nullable=False),
        sa.Column('value', sa.Text, nullable=False),
        sa.Column('confidence', sa.Float, nullable=False, server_default=sa.text('1.0')),
        sa.Column('metadata', JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
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
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('version', sa.Integer, nullable=False, server_default=sa.text('1')),
    )
    op.create_index('ix_ai_memories_user_type', 'ai_memories', ['user_id', 'memory_type'])

    # ── ai_preferences ─────────────────────────────────────────────
    op.create_table(
        'ai_preferences',
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
            unique=True,
            index=True,
        ),
        sa.Column('preferred_model', sa.String(100), nullable=True),
        sa.Column(
            'explanation_style',
            sa.String(50),
            nullable=False,
            server_default=sa.text("'balanced'"),
        ),
        sa.Column('temperature', sa.Float, nullable=False, server_default=sa.text('0.7')),
        sa.Column('max_tokens', sa.Integer, nullable=False, server_default=sa.text('2048')),
        sa.Column(
            'auto_generate_titles',
            sa.Boolean,
            nullable=False,
            server_default=sa.text('true'),
        ),
        sa.Column('include_citations', sa.Boolean, nullable=False, server_default=sa.text('true')),
        sa.Column('metadata', JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
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
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('version', sa.Integer, nullable=False, server_default=sa.text('1')),
    )

    # ── quiz_history ───────────────────────────────────────────────
    op.create_table(
        'quiz_history',
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
        sa.Column('quiz_type', sa.String(50), nullable=False),
        sa.Column('topic', sa.String(300), nullable=False),
        sa.Column(
            'difficulty',
            sa.String(20),
            nullable=False,
            server_default=sa.text("'intermediate'"),
        ),
        sa.Column('questions', JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('score', sa.Float, nullable=True),
        sa.Column('total_questions', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('correct_count', sa.Integer, nullable=True),
        sa.Column('metadata', JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
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
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('version', sa.Integer, nullable=False, server_default=sa.text('1')),
    )

    # ── planner_history ────────────────────────────────────────────
    op.create_table(
        'planner_history',
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
        sa.Column('plan_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('goal', sa.String(500), nullable=True),
        sa.Column('plan_content', JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('estimated_hours', sa.Float, nullable=False, server_default=sa.text('0.0')),
        sa.Column('is_completed', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('metadata', JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
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
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('version', sa.Integer, nullable=False, server_default=sa.text('1')),
    )


def downgrade() -> None:
    op.drop_table('planner_history')
    op.drop_table('quiz_history')
    op.drop_table('ai_preferences')
    op.drop_table('ai_memories')
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
