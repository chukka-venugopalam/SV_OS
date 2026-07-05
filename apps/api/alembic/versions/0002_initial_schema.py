"""Create initial database schema.

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-01

This migration creates the complete SV-OS database schema:

**13 PostgreSQL Enums**
- node_type_enum, edge_type_enum, edge_direction_enum
- difficulty_enum, progress_enum, demand_enum, user_role_enum
- resource_type_enum, learning_status_enum, visibility_enum
- recommendation_type_enum, requirement_type_enum
- skill_relationship_type_enum

**20 Tables (in dependency order)**
1. users
2. knowledge_nodes
3. knowledge_edges
4. tags
5. node_tags
6. skills
7. skill_relationships
8. careers
9. career_requirements
10. projects
11. project_requirements
12. learning_resources
13. learning_paths
14. learning_sessions
15. user_progress
16. bookmarks
17. favorites
18. search_history
19. activity_logs (audit_log)
20. recommendations

**Index Strategy**
See inline comments for justification of each index.

**Full-Text Search**
- search_vector TSVECTOR column on knowledge_nodes
- GIN index for fast full-text queries
- Trigger-based auto-population using setweight()

**Updated-At Triggers**
- Automatic updated_at timestamp refresh on mutation-heavy tables
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ═══════════════════════════════════════════════════════════════════
# ENUM TYPES
# ═══════════════════════════════════════════════════════════════════

def _create_enums() -> None:
    """Create all PostgreSQL enum types."""

    # node_type_enum — Discriminator for knowledge node categories.
    # Values: subject, concept, technology, tool, career, project
    op.execute("""
        CREATE TYPE node_type_enum AS ENUM (
            'subject', 'concept', 'technology', 'tool',
            'career', 'project'
        )
    """)

    # edge_type_enum — Semantic type of a directed knowledge graph edge.
    # Values: prerequisite, depends_on, uses, enables, part_of,
    #         related_to, leads_to, requires
    op.execute("""
        CREATE TYPE edge_type_enum AS ENUM (
            'prerequisite', 'depends_on', 'uses', 'enables',
            'part_of', 'related_to', 'leads_to', 'requires'
        )
    """)

    # edge_direction_enum — Directionality of a graph edge.
    # forward: source → target (directed)
    # bidirectional: source ↔ target (mutual)
    # unidirectional: target → source (reverse)
    op.execute("""
        CREATE TYPE edge_direction_enum AS ENUM (
            'forward', 'bidirectional', 'unidirectional'
        )
    """)

    # difficulty_enum — Educational difficulty / complexity level.
    # Used by knowledge_nodes, projects, learning_resources, skills,
    # and learning_paths.
    op.execute("""
        CREATE TYPE difficulty_enum AS ENUM (
            'beginner', 'intermediate', 'advanced', 'expert'
        )
    """)

    # progress_enum — User learning progress lifecycle.
    # Flow: not_started → learning → completed → mastered
    op.execute("""
        CREATE TYPE progress_enum AS ENUM (
            'not_started', 'learning', 'completed', 'mastered'
        )
    """)

    # demand_enum — Market demand trend for a career.
    op.execute("""
        CREATE TYPE demand_enum AS ENUM (
            'declining', 'stable', 'growing', 'high_demand'
        )
    """)

    # user_role_enum — Authorization role assigned to a user.
    op.execute("""
        CREATE TYPE user_role_enum AS ENUM (
            'learner', 'admin'
        )
    """)

    # resource_type_enum — Category of an external learning resource.
    op.execute("""
        CREATE TYPE resource_type_enum AS ENUM (
            'video', 'article', 'course', 'book',
            'documentation', 'tool', 'podcast', 'interactive'
        )
    """)

    # learning_status_enum — Status of a learning session.
    # Used by learning_sessions table.
    op.execute("""
        CREATE TYPE learning_status_enum AS ENUM (
            'active', 'paused', 'completed', 'abandoned'
        )
    """)

    # visibility_enum — Visibility scope for user-generated content.
    # Reserved for future use (sharing features).
    op.execute("""
        CREATE TYPE visibility_enum AS ENUM (
            'public', 'private', 'shared'
        )
    """)

    # recommendation_type_enum — Category of a recommendation.
    op.execute("""
        CREATE TYPE recommendation_type_enum AS ENUM (
            'career_path', 'learning_path', 'skill_gap',
            'related_content', 'popular', 'next_step'
        )
    """)

    # requirement_type_enum — How strongly a node is required for a
    # career or project. Used by career_requirements and
    # project_requirements.
    op.execute("""
        CREATE TYPE requirement_type_enum AS ENUM (
            'required', 'recommended', 'bonus'
        )
    """)

    # skill_relationship_type_enum — Semantic relationship between
    # two skills.
    op.execute("""
        CREATE TYPE skill_relationship_type_enum AS ENUM (
            'prerequisite', 'builds_upon', 'complement',
            'specialization', 'alternative'
        )
    """)


def _drop_enums() -> None:
    """Drop all enum types in reverse dependency order."""
    op.execute('DROP TYPE IF EXISTS skill_relationship_type_enum')
    op.execute('DROP TYPE IF EXISTS requirement_type_enum')
    op.execute('DROP TYPE IF EXISTS recommendation_type_enum')
    op.execute('DROP TYPE IF EXISTS visibility_enum')
    op.execute('DROP TYPE IF EXISTS learning_status_enum')
    op.execute('DROP TYPE IF EXISTS resource_type_enum')
    op.execute('DROP TYPE IF EXISTS user_role_enum')
    op.execute('DROP TYPE IF EXISTS demand_enum')
    op.execute('DROP TYPE IF EXISTS progress_enum')
    op.execute('DROP TYPE IF EXISTS difficulty_enum')
    op.execute('DROP TYPE IF EXISTS edge_direction_enum')
    op.execute('DROP TYPE IF EXISTS edge_type_enum')
    op.execute('DROP TYPE IF EXISTS node_type_enum')


# ═══════════════════════════════════════════════════════════════════
# TABLES
# ═══════════════════════════════════════════════════════════════════

def _create_users() -> None:
    """1. users — Registered platform users (learner/admin)."""
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('email', sa.String(255), unique=True, nullable=False,
                  comment='Verified email address (unique)'),
        sa.Column('username', sa.String(100), unique=True, nullable=False,
                  comment='Public username (unique)'),
        sa.Column('display_name', sa.String(200), nullable=True,
                  comment='Display name shown in the UI'),
        sa.Column('avatar_url', sa.Text, nullable=True,
                  comment='URL of the user profile picture'),
        sa.Column('bio', sa.Text, nullable=True,
                  comment='Short biography text'),
        sa.Column('role', postgresql.ENUM('learner', 'admin',
                  name='user_role_enum', create_type=False),
                  nullable=False, server_default=sa.text("'learner'"),
                  comment='Authorization role'),
        sa.Column('preferences', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='User preferences stored as JSONB'),
        sa.Column('is_active', sa.Boolean, nullable=False,
                  server_default=sa.text('true'),
                  comment='Whether the account is active'),
        sa.Column('last_login_at', sa.DateTime(timezone=True),
                  nullable=True,
                  comment='Timestamp of the most recent login'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    # No separate indexes on email/username — the unique constraint
    # on each column already creates a unique index in PostgreSQL.
    pass


def _create_knowledge_nodes() -> None:
    """2. knowledge_nodes — Central knowledge graph entity.

    Every piece of knowledge (subject, concept, technology, tool) is
    stored here and typed via the node_type discriminator.
    """
    op.create_table(
        'knowledge_nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('slug', sa.String(200), unique=True, nullable=False,
                  comment='URL-safe unique identifier'),
        sa.Column('title', sa.String(300), nullable=False,
                  comment='Human-readable title of the node'),
        sa.Column('description', sa.Text, nullable=False,
                  comment='Short description / abstract of the node'),
        sa.Column('content', sa.Text, nullable=True,
                  comment='Full rich-text / Markdown content body'),
        sa.Column('node_type', postgresql.ENUM('subject', 'concept',
                  'technology', 'tool', 'career', 'project',
                  name='node_type_enum', create_type=False),
                  nullable=False,
                  comment='Discriminator — subject, concept, technology, tool'),
        sa.Column('difficulty', postgresql.ENUM('beginner',
                  'intermediate', 'advanced', 'expert',
                  name='difficulty_enum', create_type=False),
                  nullable=False, server_default=sa.text("'beginner'"),
                  comment='Educational difficulty level'),
        sa.Column('estimated_minutes', sa.Integer, nullable=False,
                  server_default=sa.text('30'),
                  comment='Estimated time to learn in minutes'),
        sa.Column('icon', sa.String(50), nullable=True,
                  comment='Icon identifier (Lucide / custom icon name)'),
        sa.Column('color', sa.String(7), nullable=True,
                  comment='Hex colour code for UI display'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Arbitrary metadata JSON blob for extensibility'),
        sa.Column('search_vector', postgresql.TSVECTOR, nullable=True,
                  comment='Full-text search vector (auto-populated by trigger)'),
        sa.Column('view_count', sa.Integer, nullable=False,
                  server_default=sa.text('0'),
                  comment='Total page-view counter'),
        sa.Column('is_published', sa.Boolean, nullable=False,
                  server_default=sa.text('true'),
                  comment='Whether the node is publicly visible'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('knowledge_nodes') as batch_op:
        # GIN index on search_vector — enables fast full-text search
        # queries. This is the most important index for the search
        # feature.
        batch_op.create_index('ix_knowledge_nodes_search_vector',
                              ['search_vector'],
                              postgresql_using='gin')
        # No separate index on slug — the unique constraint on slug
        # already creates a unique index in PostgreSQL.
        # Index on node_type — filters knowledge graph by type
        # (subjects, concepts, technologies).
        batch_op.create_index('ix_knowledge_nodes_node_type', ['node_type'])
        # Index on difficulty — filters by learning level.
        batch_op.create_index('ix_knowledge_nodes_difficulty', ['difficulty'])
        # Index on is_published — most queries filter for published
        # nodes only.
        batch_op.create_index('ix_knowledge_nodes_is_published',
                              ['is_published'])
        # Index on created_at — supports "recently added" queries
        # and dashboard widgets.
        batch_op.create_index('ix_knowledge_nodes_created_at',
                              ['created_at'],
                              postgresql_ops={'created_at': 'DESC'})


def _create_knowledge_edges() -> None:
    """3. knowledge_edges — Directed typed edges in the knowledge graph."""
    op.create_table(
        'knowledge_edges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('source_node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Source / parent node ID'),
        sa.Column('target_node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Target / child node ID'),
        sa.Column('relationship_type', postgresql.ENUM('prerequisite',
                  'depends_on', 'uses', 'enables', 'part_of',
                  'related_to', 'leads_to', 'requires',
                  name='edge_type_enum', create_type=False),
                  nullable=False,
                  comment='Semantic type of the relationship'),
        sa.Column('direction', postgresql.ENUM('forward', 'bidirectional',
                  'unidirectional', name='edge_direction_enum',
                  create_type=False),
                  nullable=False, server_default=sa.text("'forward'"),
                  comment='Directionality of the edge'),
        sa.Column('description', sa.Text, nullable=False,
                  server_default=sa.text("''"),
                  comment='Human-readable description of the relationship'),
        sa.Column('weight', sa.Float, nullable=False,
                  server_default=sa.text('1.0'),
                  comment='Numeric weight for ranking traversals'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Arbitrary metadata JSON blob'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        # Unique constraint: prevent duplicate edges with same
        # source, target, and type.
        sa.UniqueConstraint('source_node_id', 'target_node_id',
                            'relationship_type',
                            name='uq_knowledge_edges_source_target_type'),
        # Check constraint: prevent self-loops (source == target).
        sa.CheckConstraint('source_node_id != target_node_id',
                           name='ck_knowledge_edges_no_self_loop'),
    )
    with op.batch_alter_table('knowledge_edges') as batch_op:
        # Index on source_node_id — fast outgoing edge traversal
        # (find all edges FROM a node).
        batch_op.create_index('ix_knowledge_edges_source_node_id',
                              ['source_node_id'])
        # Index on target_node_id — fast incoming edge traversal
        # (find all edges TO a node).
        batch_op.create_index('ix_knowledge_edges_target_node_id',
                              ['target_node_id'])
        # Composite index on source+target — optimises graph
        # traversal queries that filter both sides simultaneously
        # (e.g. "is there an edge between X and Y?").
        batch_op.create_index('ix_knowledge_edges_source_target',
                              ['source_node_id', 'target_node_id'])
        # Index on relationship_type — filters edges by type
        # (e.g. all prerequisite edges).
        batch_op.create_index('ix_knowledge_edges_relationship_type',
                              ['relationship_type'])


def _create_tags() -> None:
    """4. tags — Free-form categorisation labels."""
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('name', sa.String(100), unique=True, nullable=False,
                  comment='Unique tag name (lowercase, hyphenated)'),
        sa.Column('description', sa.Text, nullable=True,
                  comment='Optional description of the tag intent'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )


def _create_node_tags() -> None:
    """5. node_tags — Many-to-many join: Tag → KnowledgeNode."""
    op.create_table(
        'node_tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Knowledge node ID'),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('tags.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Tag ID'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        sa.UniqueConstraint('node_id', 'tag_id',
                            name='uq_node_tags_node_tag'),
    )
    with op.batch_alter_table('node_tags') as batch_op:
        # Index on node_id — find all tags for a node.
        batch_op.create_index('ix_node_tags_node_id', ['node_id'])
        # Index on tag_id — find all nodes with a given tag.
        batch_op.create_index('ix_node_tags_tag_id', ['tag_id'])


def _create_skills() -> None:
    """6. skills — Discrete measurable abilities."""
    op.create_table(
        'skills',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('name', sa.String(200), unique=True, nullable=False,
                  comment='Unique skill name'),
        sa.Column('description', sa.Text, nullable=True,
                  comment='Short description of the skill'),
        sa.Column('category', sa.String(100), nullable=True,
                  comment='Skill category (e.g. "Programming Language")'),
        sa.Column('difficulty', postgresql.ENUM('beginner', 'intermediate',
                  'advanced', 'expert', name='difficulty_enum',
                  create_type=False),
                  nullable=False, server_default=sa.text("'beginner'"),
                  comment='Typical difficulty level'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Arbitrary metadata JSON blob'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )


def _create_skill_relationships() -> None:
    """7. skill_relationships — Directed typed relationship between skills."""
    op.create_table(
        'skill_relationships',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('source_skill_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('skills.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Source / prerequisite skill ID'),
        sa.Column('target_skill_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('skills.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Target / dependent skill ID'),
        sa.Column('relationship_type',
                  postgresql.ENUM('prerequisite', 'builds_upon',
                  'complement', 'specialization', 'alternative',
                  name='skill_relationship_type_enum', create_type=False),
                  nullable=False,
                  comment='Semantic type of the skill relationship'),
        sa.Column('weight', sa.Float, nullable=True,
                  comment='Optional strength / relevance weight'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        sa.UniqueConstraint('source_skill_id', 'target_skill_id',
                            'relationship_type',
                            name='uq_skill_relationships_source_target_type'),
    )
    with op.batch_alter_table('skill_relationships') as batch_op:
        # Index for outgoing skill relationship traversal.
        batch_op.create_index('ix_skill_relationships_source_skill_id',
                              ['source_skill_id'])
        # Index for incoming skill relationship traversal.
        batch_op.create_index('ix_skill_relationships_target_skill_id',
                              ['target_skill_id'])


def _create_careers() -> None:
    """8. careers — Professional career paths."""
    op.create_table(
        'careers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('slug', sa.String(200), unique=True, nullable=False,
                  comment='URL-safe unique identifier'),
        sa.Column('title', sa.String(300), nullable=False,
                  comment='Human-readable career title'),
        sa.Column('description', sa.Text, nullable=False,
                  comment='Detailed description of the career path'),
        sa.Column('average_salary', sa.String(100), nullable=True,
                  comment='Display string for average salary'),
        sa.Column('demand_level', postgresql.ENUM('declining', 'stable',
                  'growing', 'high_demand', name='demand_enum',
                  create_type=False),
                  nullable=False, server_default=sa.text("'growing'"),
                  comment='Market demand trend'),
        sa.Column('required_experience', sa.String(50), nullable=True,
                  comment='Years or level of experience needed'),
        sa.Column('icon', sa.String(50), nullable=True,
                  comment='Icon identifier for UI display'),
        sa.Column('color', sa.String(7), nullable=True,
                  comment='Hex colour for UI display'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Arbitrary metadata JSON blob'),
        sa.Column('is_published', sa.Boolean, nullable=False,
                  server_default=sa.text('true'),
                  comment='Whether the career is publicly visible'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('careers') as batch_op:
        # No separate index on slug — the unique constraint on slug
        # already creates a unique index in PostgreSQL.
        # Index for filtering careers by demand level.
        batch_op.create_index('ix_careers_demand_level', ['demand_level'])


def _create_career_requirements() -> None:
    """9. career_requirements — Many-to-many: Career → KnowledgeNode."""
    op.create_table(
        'career_requirements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('career_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('careers.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Parent career ID'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Required knowledge node ID'),
        sa.Column('requirement_type',
                  postgresql.ENUM('required', 'recommended', 'bonus',
                  name='requirement_type_enum', create_type=False),
                  nullable=False,
                  comment='How strongly the node is required'),
        sa.Column('order_index', sa.Integer, nullable=False,
                  server_default=sa.text('0'),
                  comment='Display ordering within the career roadmap'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        sa.UniqueConstraint('career_id', 'node_id', 'requirement_type',
                            name='uq_career_requirements_career_node_type'),
    )
    with op.batch_alter_table('career_requirements') as batch_op:
        # Index for finding all requirements of a career.
        batch_op.create_index('ix_career_requirements_career_id', ['career_id'])
        # Index for finding all careers that require a node.
        batch_op.create_index('ix_career_requirements_node_id', ['node_id'])


def _create_projects() -> None:
    """10. projects — Hands-on build exercises."""
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('slug', sa.String(200), unique=True, nullable=False,
                  comment='URL-safe unique identifier'),
        sa.Column('title', sa.String(300), nullable=False,
                  comment='Human-readable project title'),
        sa.Column('description', sa.Text, nullable=False,
                  comment='Project description and goals'),
        sa.Column('difficulty', postgresql.ENUM('beginner', 'intermediate',
                  'advanced', 'expert', name='difficulty_enum',
                  create_type=False),
                  nullable=False, server_default=sa.text("'intermediate'"),
                  comment='Project difficulty level'),
        sa.Column('estimated_hours', sa.Integer, nullable=False,
                  server_default=sa.text('10'),
                  comment='Estimated time to complete the project'),
        sa.Column('tech_stack', postgresql.ARRAY(sa.String),
                  nullable=False, server_default=sa.text("'{}'"),
                  comment='Technologies / tools used in the project'),
        sa.Column('icon', sa.String(50), nullable=True,
                  comment='Icon identifier for UI display'),
        sa.Column('color', sa.String(7), nullable=True,
                  comment='Hex colour for UI display'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Arbitrary metadata JSON blob'),
        sa.Column('is_published', sa.Boolean, nullable=False,
                  server_default=sa.text('true'),
                  comment='Whether the project is publicly visible'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('projects') as batch_op:
        # No separate index on slug — the unique constraint on slug
        # already creates a unique index in PostgreSQL.
        # Index for filtering projects by difficulty.
        batch_op.create_index('ix_projects_difficulty', ['difficulty'])


def _create_project_requirements() -> None:
    """11. project_requirements — Many-to-many: Project → KnowledgeNode."""
    op.create_table(
        'project_requirements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('project_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('projects.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Parent project ID'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Required knowledge node ID'),
        sa.Column('requirement_type',
                  postgresql.ENUM('required', 'recommended', 'bonus',
                  name='requirement_type_enum', create_type=False),
                  nullable=False,
                  comment='How strongly the node is required'),
        sa.Column('order_index', sa.Integer, nullable=False,
                  server_default=sa.text('0'),
                  comment='Display ordering within the project'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        sa.UniqueConstraint('project_id', 'node_id', 'requirement_type',
                            name='uq_project_requirements_project_node_type'),
    )
    with op.batch_alter_table('project_requirements') as batch_op:
        # Index for finding all requirements of a project.
        batch_op.create_index('ix_project_requirements_project_id',
                              ['project_id'])
        # Index for finding all projects that require a node.
        batch_op.create_index('ix_project_requirements_node_id', ['node_id'])


def _create_learning_resources() -> None:
    """12. learning_resources — External learning materials linked to a node."""
    op.create_table(
        'learning_resources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Knowledge node this resource belongs to'),
        sa.Column('title', sa.String(300), nullable=False,
                  comment='Resource title'),
        sa.Column('url', sa.Text, nullable=False,
                  comment='URL to access the resource'),
        sa.Column('resource_type',
                  postgresql.ENUM('video', 'article', 'course', 'book',
                  'documentation', 'tool', 'podcast', 'interactive',
                  name='resource_type_enum', create_type=False),
                  nullable=False,
                  comment='Category of the resource'),
        sa.Column('platform', sa.String(100), nullable=True,
                  comment='Platform name (e.g. "YouTube", "Coursera")'),
        sa.Column('is_free', sa.Boolean, nullable=False,
                  server_default=sa.text('true'),
                  comment='Whether the resource is freely accessible'),
        sa.Column('duration_minutes', sa.Integer, nullable=True,
                  comment='Estimated time to consume the resource'),
        sa.Column('difficulty', postgresql.ENUM('beginner', 'intermediate',
                  'advanced', 'expert', name='difficulty_enum',
                  create_type=False),
                  nullable=False, server_default=sa.text("'beginner'"),
                  comment='Difficulty level of this specific resource'),
        sa.Column('language', sa.String(10), nullable=False,
                  server_default=sa.text("'en'"),
                  comment='ISO language code'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('learning_resources') as batch_op:
        # Index for finding all resources attached to a node.
        batch_op.create_index('ix_learning_resources_node_id', ['node_id'])
        # Index for filtering resources by type (e.g. only videos).
        batch_op.create_index('ix_learning_resources_resource_type',
                              ['resource_type'])


def _create_learning_paths() -> None:
    """13. learning_paths — Curated ordered sequence of knowledge nodes."""
    op.create_table(
        'learning_paths',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('title', sa.String(300), nullable=False,
                  comment='Human-readable path title'),
        sa.Column('description', sa.Text, nullable=True,
                  comment='Short description of the learning path'),
        sa.Column('difficulty', postgresql.ENUM('beginner', 'intermediate',
                  'advanced', 'expert', name='difficulty_enum',
                  create_type=False),
                  nullable=False, server_default=sa.text("'beginner'"),
                  comment='Overall difficulty of the path'),
        sa.Column('estimated_hours', sa.Integer, nullable=True,
                  comment='Estimated total time to complete the path'),
        sa.Column('icon', sa.String(50), nullable=True,
                  comment='Icon identifier for UI display'),
        sa.Column('color', sa.String(7), nullable=True,
                  comment='Hex colour for UI display'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Arbitrary metadata JSON blob'),
        sa.Column('node_order', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'[]'::jsonb"),
                  comment='Ordered array of node IDs [{node_id: UUID, order: int, optional: bool}]'),
        sa.Column('is_published', sa.Boolean, nullable=False,
                  server_default=sa.text('true'),
                  comment='Whether the path is publicly visible'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('learning_paths') as batch_op:
        # Index on is_published — most queries filter for published
        # learning paths only.
        batch_op.create_index('ix_learning_paths_is_published',
                              ['is_published'])


def _create_learning_sessions() -> None:
    """14. learning_sessions — Single study session for a user on a node."""
    op.create_table(
        'learning_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='User who studied'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Knowledge node studied'),
        sa.Column('status',
                  postgresql.ENUM('active', 'paused', 'completed',
                  'abandoned', name='learning_status_enum',
                  create_type=False),
                  nullable=False, server_default=sa.text("'active'"),
                  comment='Current status of the session'),
        sa.Column('started_at', sa.DateTime(timezone=True),
                  nullable=True,
                  comment='When the session started'),
        sa.Column('ended_at', sa.DateTime(timezone=True),
                  nullable=True,
                  comment='When the session ended'),
        sa.Column('duration_minutes', sa.Integer, nullable=True,
                  comment='Total active minutes in this session'),
        sa.Column('notes', sa.Text, nullable=True,
                  comment='User notes taken during the session'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('learning_sessions') as batch_op:
        # Index for finding all sessions for a user.
        batch_op.create_index('ix_learning_sessions_user_id', ['user_id'])
        # Index for finding all sessions on a node.
        batch_op.create_index('ix_learning_sessions_node_id', ['node_id'])


def _create_user_progress() -> None:
    """15. user_progress — Tracks user learning status on a knowledge node."""
    op.create_table(
        'user_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='User who made the progress'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Knowledge node being progressed'),
        sa.Column('status',
                  postgresql.ENUM('not_started', 'learning', 'completed',
                  'mastered', name='progress_enum', create_type=False),
                  nullable=False, server_default=sa.text("'not_started'"),
                  comment='Current progress status'),
        sa.Column('started_at', sa.DateTime(timezone=True),
                  nullable=True,
                  comment='When the user started learning this node'),
        sa.Column('completed_at', sa.DateTime(timezone=True),
                  nullable=True,
                  comment='When the user completed this node'),
        sa.Column('mastered_at', sa.DateTime(timezone=True),
                  nullable=True,
                  comment='When the user mastered this node'),
        sa.Column('time_spent_minutes', sa.Integer, nullable=False,
                  server_default=sa.text('0'),
                  comment='Total time spent on this node (minutes)'),
        sa.Column('notes', sa.Text, nullable=True,
                  comment='Personal notes taken by the user'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        sa.UniqueConstraint('user_id', 'node_id',
                            name='uq_user_progress_user_node'),
    )
    with op.batch_alter_table('user_progress') as batch_op:
        # Index for finding all progress records for a user (dashboard).
        batch_op.create_index('ix_user_progress_user_id', ['user_id'])
        # Index for finding all progress on a node (analytics).
        batch_op.create_index('ix_user_progress_node_id', ['node_id'])
        # Index for filtering by status (e.g. "in progress" items).
        batch_op.create_index('ix_user_progress_status', ['status'])


def _create_bookmarks() -> None:
    """16. bookmarks — User-saved knowledge nodes for quick access."""
    op.create_table(
        'bookmarks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='User who created the bookmark'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Bookmarked knowledge node'),
        sa.Column('notes', sa.Text, nullable=True,
                  comment='Optional personal note attached to the bookmark'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        sa.UniqueConstraint('user_id', 'node_id',
                            name='uq_bookmarks_user_node'),
    )
    with op.batch_alter_table('bookmarks') as batch_op:
        # Index for finding all bookmarks for a user.
        batch_op.create_index('ix_bookmarks_user_id', ['user_id'])


def _create_favorites() -> None:
    """17. favorites — User-favourite knowledge nodes (recommendation signals)."""
    op.create_table(
        'favorites',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='User who favourited the node'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Favourited knowledge node'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
        sa.UniqueConstraint('user_id', 'node_id',
                            name='uq_favorites_user_node'),
    )
    with op.batch_alter_table('favorites') as batch_op:
        # Index for finding all favourites for a user.
        batch_op.create_index('ix_favorites_user_id', ['user_id'])


def _create_search_history() -> None:
    """18. search_history — User search query records."""
    op.create_table(
        'search_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='User who performed the search'),
        sa.Column('query', sa.Text, nullable=False,
                  comment='Raw search query text'),
        sa.Column('filters', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Filters applied during the search'),
        sa.Column('results_count', sa.Integer, nullable=False,
                  server_default=sa.text('0'),
                  comment='Number of results returned'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('search_history') as batch_op:
        # Index for finding search history for a user.
        batch_op.create_index('ix_search_history_user_id', ['user_id'])
        # Index for trending searches (most recent first).
        batch_op.create_index('ix_search_history_created_at', ['created_at'],
                              postgresql_ops={'created_at': 'DESC'})


def _create_activity_logs() -> None:
    """19. activity_logs (audit_log) — Immutable audit trail."""
    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'),
                  nullable=True,
                  comment='User who performed the action (NULL for anonymous)'),
        sa.Column('action', sa.String(100), nullable=False,
                  comment='Action identifier (e.g. "user.login")'),
        sa.Column('entity_type', sa.String(50), nullable=True,
                  comment='Type of entity affected'),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True),
                  nullable=True,
                  comment='UUID of the entity affected'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Arbitrary event metadata'),
        sa.Column('ip_address', postgresql.INET, nullable=True,
                  comment='Client IP address'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('activity_logs') as batch_op:
        # Index for finding all actions by a user.
        batch_op.create_index('ix_activity_logs_user_id', ['user_id'])
        # Index for filtering by action type (e.g. all login events).
        batch_op.create_index('ix_activity_logs_action', ['action'])
        # Index for entity lookup (find all actions on an entity).
        batch_op.create_index('ix_activity_logs_entity',
                              ['entity_type', 'entity_id'])
        # Index for time-ordered audit queries.
        batch_op.create_index('ix_activity_logs_created_at', ['created_at'],
                              postgresql_ops={'created_at': 'DESC'})


def _create_recommendations() -> None:
    """20. recommendations — Personalised content suggestions."""
    op.create_table(
        'recommendations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()'),
                  comment='Primary key, auto-generated UUID v4'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Target user ID'),
        sa.Column('node_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('knowledge_nodes.id', ondelete='CASCADE'),
                  nullable=False,
                  comment='Recommended knowledge node ID'),
        sa.Column('recommendation_type',
                  postgresql.ENUM('career_path', 'learning_path',
                  'skill_gap', 'related_content', 'popular', 'next_step',
                  name='recommendation_type_enum', create_type=False),
                  nullable=False,
                  comment='Category of the recommendation'),
        sa.Column('score', sa.Float, nullable=True,
                  comment='Relevance score (higher = more relevant)'),
        sa.Column('reason', sa.Text, nullable=True,
                  comment='Human-readable explanation'),
        sa.Column('metadata', postgresql.JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb"),
                  comment='Engine metadata'),
        sa.Column('is_dismissed', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Whether the user dismissed this recommendation'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was created'),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, server_default=sa.func.now(),
                  comment='Timestamp when the record was last updated'),
        sa.Column('is_deleted', sa.Boolean, nullable=False,
                  server_default=sa.text('false'),
                  comment='Soft-delete flag'),
        sa.Column('version', sa.Integer, nullable=False,
                  server_default=sa.text('1'),
                  comment='Optimistic-locking version counter'),
    )
    with op.batch_alter_table('recommendations') as batch_op:
        # Index for finding all recommendations for a user.
        batch_op.create_index('ix_recommendations_user_id', ['user_id'])
        # Index for finding all recommendations for a node.
        batch_op.create_index('ix_recommendations_node_id', ['node_id'])
        # Index for filtering recommendations by type.
        batch_op.create_index('ix_recommendations_recommendation_type',
                              ['recommendation_type'])


# ═══════════════════════════════════════════════════════════════════
# TRIGGERS & FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def _create_search_trigger() -> None:
    """Create the full-text search trigger on knowledge_nodes.

    This trigger auto-populates the search_vector TSVECTOR column
    whenever title, description, or content is inserted or updated.

    Weighting:
        A (highest) — title
        B (medium)  — description
        C (lowest)  — content

    Language: english (configures stemming and stop-word removal).
    """
    op.execute("""
        CREATE OR REPLACE FUNCTION update_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)

    op.execute("""
        CREATE TRIGGER trigger_update_search_vector
            BEFORE INSERT OR UPDATE OF title, description, content
            ON knowledge_nodes
            FOR EACH ROW
            EXECUTE FUNCTION update_search_vector()
    """)


def _create_updated_at_triggers() -> None:
    """Create updated_at auto-refresh triggers on mutation-heavy tables.

    The updated_at column is automatically set to NOW() on every
    row UPDATE for tables where temporal tracking is important.
    """
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)

    tables_with_updated_at = [
        'users', 'knowledge_nodes', 'careers', 'projects',
        'user_progress',
    ]

    for table in tables_with_updated_at:
        op.execute(f"""
            CREATE TRIGGER trigger_{table}_updated_at
                BEFORE UPDATE ON {table}
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        """)


# ═══════════════════════════════════════════════════════════════════
# VIEWS
# ═══════════════════════════════════════════════════════════════════

def _create_views() -> None:
    """Create materialised views for common query patterns.

    Views denormalise frequently-joined data to simplify queries
    and improve read performance for dashboards and overview pages.
    """
    op.execute("""
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
    """)

    op.execute("""
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
    """)


# ═══════════════════════════════════════════════════════════════════
# UPGRADE
# ═══════════════════════════════════════════════════════════════════

def upgrade() -> None:
    # ── Enums ─────────────────────────────────────────────────────
    _create_enums()

    # ── Tables (in dependency order) ──────────────────────────────
    _create_users()
    _create_knowledge_nodes()
    _create_knowledge_edges()
    _create_tags()
    _create_node_tags()
    _create_skills()
    _create_skill_relationships()
    _create_careers()
    _create_career_requirements()
    _create_projects()
    _create_project_requirements()
    _create_learning_resources()
    _create_learning_paths()
    _create_learning_sessions()
    _create_user_progress()
    _create_bookmarks()
    _create_favorites()
    _create_search_history()
    _create_activity_logs()
    _create_recommendations()

    # ── Triggers & Functions ──────────────────────────────────────
    _create_search_trigger()
    _create_updated_at_triggers()

    # ── Views ─────────────────────────────────────────────────────
    _create_views()


# ═══════════════════════════════════════════════════════════════════
# DOWNGRADE
# ═══════════════════════════════════════════════════════════════════

def downgrade() -> None:
    # ── Views ─────────────────────────────────────────────────────
    op.execute('DROP VIEW IF EXISTS v_user_progress_summary')
    op.execute('DROP VIEW IF EXISTS v_node_statistics')

    # ── Triggers & Functions ──────────────────────────────────────
    tables_with_updated_at = [
        'users', 'knowledge_nodes', 'careers', 'projects',
        'user_progress',
    ]
    for table in tables_with_updated_at:
        op.execute(f'DROP TRIGGER IF EXISTS trigger_{table}_updated_at ON {table}')
    op.execute('DROP TRIGGER IF EXISTS trigger_update_search_vector ON knowledge_nodes')
    op.execute('DROP FUNCTION IF EXISTS update_search_vector()')
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column()')

    # ── Tables (reverse dependency order) ─────────────────────────
    op.drop_table('recommendations')
    op.drop_table('activity_logs')
    op.drop_table('search_history')
    op.drop_table('favorites')
    op.drop_table('bookmarks')
    op.drop_table('user_progress')
    op.drop_table('learning_sessions')
    op.drop_table('learning_paths')
    op.drop_table('learning_resources')
    op.drop_table('project_requirements')
    op.drop_table('projects')
    op.drop_table('career_requirements')
    op.drop_table('careers')
    op.drop_table('skill_relationships')
    op.drop_table('skills')
    op.drop_table('node_tags')
    op.drop_table('tags')
    op.drop_table('knowledge_edges')
    op.drop_table('knowledge_nodes')
    op.drop_table('users')

    # ── Enums (reverse dependency order) ──────────────────────────
    _drop_enums()
