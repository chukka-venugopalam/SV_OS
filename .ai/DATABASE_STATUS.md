# Database Status

## Phase 2.5 Changes

Phase 2.5 implemented the complete database persistence layer: 2 Alembic migrations, 20 database tables, 13 PostgreSQL enums, full-text search support, strategic indexes, views, and seed data.

## Migrations

| #   | Revision | Description                                                                                  | Status   |
| --- | -------- | -------------------------------------------------------------------------------------------- | -------- |
| 1   | `0001`   | Create PostgreSQL extensions (uuid-ossp, pgcrypto, pg_trgm, unaccent, btree_gin, btree_gist) | Complete |
| 2   | `0002`   | Initial schema — 20 tables, 13 enums, indexes, constraints, triggers, views                  | Complete |

## Extensions

| Extension    | Purpose                 | Justification                                                |
| ------------ | ----------------------- | ------------------------------------------------------------ |
| `uuid-ossp`  | UUID generation         | Primary keys on all 20 tables use `gen_random_uuid()`        |
| `pgcrypto`   | Cryptographic functions | Future encryption, password hashing, secure random           |
| `pg_trgm`    | Trigram text similarity | Fuzzy search on knowledge_nodes.title and .description       |
| `unaccent`   | Accent removal          | Normalises accented characters in full-text search           |
| `btree_gin`  | GIN on scalar types     | Composite GIN indexes for (search_vector, node_type) queries |
| `btree_gist` | GiST on scalar types    | Future exclusion constraints for scheduling                  |

## Tables

| #   | Table Name             | Model Class          | Columns | Purpose                                                                |
| --- | ---------------------- | -------------------- | ------- | ---------------------------------------------------------------------- |
| 1   | `users`                | `User`               | 16      | Registered platform users (learner/admin)                              |
| 2   | `knowledge_nodes`      | `KnowledgeNode`      | 19      | Central knowledge graph node — subjects, concepts, technologies, tools |
| 3   | `knowledge_edges`      | `KnowledgeEdge`      | 14      | Directed typed edge between two knowledge nodes                        |
| 4   | `careers`              | `Career`             | 17      | Professional career path                                               |
| 5   | `career_requirements`  | `CareerRequirement`  | 11      | Many-to-many: Career → KnowledgeNode with requirement strength         |
| 6   | `projects`             | `Project`            | 17      | Hands-on build exercise                                                |
| 7   | `project_requirements` | `ProjectRequirement` | 11      | Many-to-many: Project → KnowledgeNode with requirement strength        |
| 8   | `learning_resources`   | `LearningResource`   | 15      | External learning material linked to a knowledge node                  |
| 9   | `user_progress`        | `UserProgress`       | 14      | Tracks user learning status on a knowledge node                        |
| 10  | `bookmarks`            | `Bookmark`           | 10      | User-saved knowledge nodes for quick access                            |
| 11  | `favorites`            | `Favorite`           | 9       | User-favourite knowledge nodes (recommendation signals)                |
| 12  | `search_history`       | `SearchHistory`      | 10      | User search query records                                              |
| 13  | `activity_logs`        | `AuditLog`           | 13      | Immutable audit trail for system events                                |
| 14  | `learning_paths`       | `LearningPath`       | 15      | Curated ordered sequence of knowledge nodes                            |
| 15  | `learning_sessions`    | `LearningSession`    | 14      | Single study session for a user on a node                              |
| 16  | `skills`               | `Skill`              | 11      | Discrete measurable ability                                            |
| 17  | `skill_relationships`  | `SkillRelationship`  | 11      | Directed typed relationship between two skills                         |
| 18  | `recommendations`      | `Recommendation`     | 14      | Personalised content suggestion for a user                             |
| 19  | `tags`                 | `Tag`                | 8       | Free-form categorisation label                                         |
| 20  | `node_tags`            | `NodeTag`            | 8       | Many-to-many: Tag → KnowledgeNode                                      |

## Enums

| Enum Name                      | Values                                                                           | Used By                                                       |
| ------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `node_type_enum`               | subject, concept, technology, tool, career, project                              | KnowledgeNode.node_type                                       |
| `edge_type_enum`               | prerequisite, depends_on, uses, enables, part_of, related_to, leads_to, requires | KnowledgeEdge.relationship_type                               |
| `edge_direction_enum`          | forward, bidirectional, unidirectional                                           | KnowledgeEdge.direction                                       |
| `difficulty_enum`              | beginner, intermediate, advanced, expert                                         | KnowledgeNode, Project, LearningResource, Skill, LearningPath |
| `progress_enum`                | not_started, learning, completed, mastered                                       | UserProgress                                                  |
| `demand_enum`                  | declining, stable, growing, high_demand                                          | Career                                                        |
| `user_role_enum`               | learner, admin                                                                   | User                                                          |
| `resource_type_enum`           | video, article, course, book, documentation, tool, podcast, interactive          | LearningResource                                              |
| `learning_status_enum`         | active, paused, completed, abandoned                                             | LearningSession                                               |
| `visibility_enum`              | public, private, shared                                                          | (future use)                                                  |
| `recommendation_type_enum`     | career_path, learning_path, skill_gap, related_content, popular, next_step       | Recommendation                                                |
| `requirement_type_enum`        | required, recommended, bonus                                                     | CareerRequirement, ProjectRequirement                         |
| `skill_relationship_type_enum` | prerequisite, builds_upon, complement, specialization, alternative               | SkillRelationship                                             |

## Shared Base (`AppBaseMixin`)

Every model inherits from `AppBaseMixin` which provides:

- `id` — UUID primary key (auto-generated via `gen_random_uuid()`)
- `created_at` — Auto-set creation timestamp (server-side `NOW()`)
- `updated_at` — Auto-updated modification timestamp
- `is_deleted` — Soft-delete flag
- `version` — Optimistic-locking counter

## Naming Convention

All constraints use a consistent naming convention:

- Index: `ix_<table>_<column>`
- Unique: `uq_<table>_<column>`
- Check: `ck_<table>_<constraint_name>`
- FK: `fk_<table>_<column>_<referred_table>`
- PK: `pk_<table>`

## Uniqueness Constraints

| Table                  | Columns                                             | Condition        |
| ---------------------- | --------------------------------------------------- | ---------------- |
| `users`                | email                                               | —                |
| `users`                | username                                            | —                |
| `knowledge_nodes`      | slug                                                | —                |
| `knowledge_edges`      | source_node_id, target_node_id, relationship_type   | source != target |
| `careers`              | slug                                                | —                |
| `projects`             | slug                                                | —                |
| `career_requirements`  | career_id, node_id, requirement_type                | —                |
| `project_requirements` | project_id, node_id, requirement_type               | —                |
| `user_progress`        | user_id, node_id                                    | —                |
| `bookmarks`            | user_id, node_id                                    | —                |
| `favorites`            | user_id, node_id                                    | —                |
| `tags`                 | name                                                | —                |
| `node_tags`            | node_id, tag_id                                     | —                |
| `skills`               | name                                                | —                |
| `skill_relationships`  | source_skill_id, target_skill_id, relationship_type | —                |

## Full-Text Search

`knowledge_nodes.search_vector` is a `TSVECTOR` column auto-populated by a trigger from `title` (weight A), `description` (weight B), and `content` (weight C). A GIN index enables fast full-text search queries.

## Index Strategy

Total indexes: 30 across all 20 tables. Every index is justified for specific query patterns.

### Key Indexes

- **GIN index** on `knowledge_nodes.search_vector` — full-text search
- **Composite index** on `knowledge_edges(source_node_id, target_node_id)` — graph traversal
- **Indexes** on all foreign key columns — JOIN performance
- **Indexes** on filter columns (node_type, difficulty, status, etc.) — filtered queries

### Indexes Avoided

- JSONB GIN indexes on metadata — premature without query profiling
- Composite (node_type, is_published) — bitmap scan is sufficient

## Views

| View                      | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `v_node_statistics`       | Node with prerequisite count, unlock count, and resource count |
| `v_user_progress_summary` | User progress aggregated counts and total time                 |

## Seed Data

| Dataset            | Records | Purpose                                           |
| ------------------ | ------- | ------------------------------------------------- |
| Subjects           | 12      | Top-level academic subjects                       |
| Concepts           | 30      | Core CS concepts                                  |
| Technologies       | 17      | Programming languages, frameworks, tools          |
| Careers            | 9       | Professional career paths                         |
| Projects           | 10      | Hands-on build exercises                          |
| Edges              | ~70     | Knowledge graph relationships                     |
| Learning Resources | 28      | External learning materials                       |
| Skills             | 44      | Discrete measurable abilities across 6 categories |
| Tags               | 30      | Free-form categorisation labels                   |

## Database Utilities

| Script                              | Purpose                                             |
| ----------------------------------- | --------------------------------------------------- |
| `database/scripts/reset.sh`         | Drop, recreate, migrate, and seed                   |
| `database/scripts/seed.sh`          | Load seed data in dependency order                  |
| `database/scripts/backup.sh`        | Custom-format PostgreSQL backup                     |
| `database/scripts/restore.sh`       | Restore from backup with confirmation               |
| `database/scripts/health_check.sql` | Verify extensions, enums, tables, triggers, indexes |

## Migration Tests

| Test Suite               | Coverage                                   |
| ------------------------ | ------------------------------------------ |
| `TestExtensions`         | All 6 extensions installed                 |
| `TestEnumTypes`          | All 13 enums with correct values           |
| `TestTables`             | All 20 tables exist                        |
| `TestConstraints`        | Foreign keys, unique constraints verified  |
| `TestTriggers`           | Search vector trigger, updated_at triggers |
| `TestViews`              | Both views exist                           |
| `TestMigrationRoundTrip` | Upgrade/downgrade round-trip (slow)        |

## Key Design Decisions

1. **Alembic over raw SQL**: All schema changes go through Alembic migrations, not raw SQL scripts.
2. **Extensions as migration 0001**: Extensions are created in the first migration so subsequent migrations can depend on them.
3. **Triggers for FTS**: `search_vector` is populated by a `BEFORE INSERT OR UPDATE` trigger rather than a generated column to handle the weighting logic.
4. **Updated-at triggers only on mutation-heavy tables**: users, knowledge_nodes, careers, projects, user_progress.
5. **Soft-delete everywhere**: Every model supports soft-delete via `is_deleted` column for data recovery and auditing.
6. **No `deleted_at` column**: Soft-delete uses a boolean flag only. Timestamp tracking can be added per-table if needed.
