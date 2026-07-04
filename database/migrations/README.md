# SV-OS — Database Migrations

## Overview

SV-OS uses **Alembic** for schema migrations. The migration files are in `apps/api/alembic/versions/` and follow a sequential numbering scheme (`0001_`, `0002_`, etc.).

## Migration Strategy

### Philosophy

Every migration must be:
1. **Fully reversible** — each `upgrade()` has a corresponding `downgrade()`
2. **Idempotent** — can be run multiple times without errors
3. **Self-documenting** — inline comments explain every schema change
4. **Backward compatible** — no breaking changes to existing data

### Migration Lifecycle

```mermaid
graph LR
    A[Schema Change] --> B[Write Migration]
    B --> C[Test Upgrade]
    C --> D[Test Downgrade]
    D --> E[Verify Data]
    E --> F[Commit]
```

## Migration Files

| # | Revision | Description | Dependencies |
|---|----------|-------------|--------------|
| 1 | `0001` | Create PostgreSQL extensions | None |
| 2 | `0002` | Initial schema (20 tables, 13 enums, indexes, triggers) | 0001 |

## Extension Documentation

| Extension | Purpose | Justification |
|-----------|---------|---------------|
| `uuid-ossp` | UUID generation | Primary keys on all 20 tables use `gen_random_uuid()` |
| `pgcrypto` | Cryptographic functions | Future encryption, password hashing, secure random |
| `pg_trgm` | Trigram text similarity | Fuzzy search on `knowledge_nodes.title` and `.description` |
| `unaccent` | Accent removal | Normalises accented characters in full-text search |
| `btree_gin` | GIN on scalar types | Composite GIN indexes for (search_vector, node_type) queries |
| `btree_gist` | GiST on scalar types | Future exclusion constraints for scheduling |

## Index Strategy

### Justified Indexes

| Table | Index | Why |
|-------|-------|-----|
| `users` | `email`, `username` | Authentication lookup, unique constraint support |
| `knowledge_nodes` | `search_vector` (GIN) | Full-text search — the most important query path |
| `knowledge_nodes` | `slug` | URL-based node lookup |
| `knowledge_nodes` | `node_type` | Filter knowledge graph by type |
| `knowledge_nodes` | `difficulty` | Filter by learning level |
| `knowledge_nodes` | `is_published` | Most queries filter for published nodes |
| `knowledge_edges` | `source_node_id` | Outgoing graph traversal |
| `knowledge_edges` | `target_node_id` | Incoming graph traversal |
| `knowledge_edges` | `(source, target)` | Graph traversal optimiser |
| `knowledge_edges` | `relationship_type` | Filter by edge type (e.g., prerequisites only) |
| `careers` | `slug` | URL-based lookup |
| `careers` | `demand_level` | Filter careers by demand |
| `projects` | `slug` | URL-based lookup |
| `projects` | `difficulty` | Filter projects by difficulty |
| `user_progress` | `user_id` | Dashboard — find all progress for a user |
| `user_progress` | `status` | Filter by progress status |
| `bookmarks` | `user_id` | Find all bookmarks for a user |
| `favorites` | `user_id` | Find all favourites for a user |
| `search_history` | `user_id`, `created_at` | Recent searches per user |
| `activity_logs` | `user_id`, `action`, `(entity_type, entity_id)` | Audit trail queries |
| `learning_resources` | `node_id`, `resource_type` | Resources for a node, filtered by type |
| `learning_sessions` | `user_id`, `node_id` | Session tracking per user/node |
| `skill_relationships` | `source_skill_id`, `target_skill_id` | Skill graph traversal |
| `node_tags` | `node_id`, `tag_id` | Find tags for a node, nodes for a tag |

### Indexes Avoided

- **Composite indexes on `(node_type, is_published)`**: Not justified because `is_published` has high selectivity (most nodes are published). A bitmap scan combining the two single-column indexes is sufficient.
- **Index on `metadata` JSONB columns**: JSONB queries use GIN indexes when needed. Adding a GIN index on every JSONB column would be premature without measured query patterns.
- **Index on `skills.category`**: Only used for filtering by broad category (low selectivity). Not justified until query profiling shows a need.

## Full-Text Search

The `knowledge_nodes.search_vector` column is a `TSVECTOR` auto-populated by a trigger:

```sql
-- Trigger function
CREATE FUNCTION update_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE OF title, description, content
    ON knowledge_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();
```

**Weighting**: Title (A) > Description (B) > Content (C)

**Language**: English (configures stemming and stop-word removal)

**Query pattern**:
```sql
SELECT title, slug, node_type,
    ts_rank(search_vector, query) AS rank
FROM knowledge_nodes, plainto_tsquery('english', :search_query) AS query
WHERE search_vector @@ query
    AND is_published = true
ORDER BY rank DESC
LIMIT 20;
```

## Running Migrations

### Development

```bash
cd apps/api
.venv/Scripts/python -m alembic upgrade head
```

### Create a New Migration

```bash
cd apps/api
.venv/Scripts/python -m alembic revision --autogenerate -m "description"
```

Always review autogenerated migrations before committing.

### Rollback

```bash
cd apps/api
.venv/Scripts/python -m alembic downgrade -1    # One step back
.venv/Scripts/python -m alembic downgrade base    # All the way back
```

### View History

```bash
cd apps/api
.venv/Scripts/python -m alembic history
```

## Seed Data

Seed files in `database/seeds/` are numbered by dependency order:

| File | Contents | Dependencies |
|------|----------|--------------|
| `01_subjects.sql` | Top-level subjects | None |
| `02_concepts.sql` | Core concepts | None |
| `03_technologies.sql` | Technologies | None |
| `04_careers.sql` | Career paths | None |
| `05_projects.sql` | Hands-on projects | None |
| `06_edges.sql` | Knowledge graph edges | 01-03 |
| `07_learning_resources.sql` | External learning materials | 01-03 |
| `08_skills.sql` | Discrete skills | None |
| `09_tags.sql` | Free-form tags | None |

### Loading Seed Data

```bash
./database/scripts/seed.sh
```

## Testing

```bash
cd apps/api
.venv/Scripts/python -m pytest tests/migrations/ -v
```

Run with `--slow` to include migration round-trip tests:
```bash
.venv/Scripts/python -m pytest tests/migrations/ -v --runslow
```

## Utilities

| Script | Purpose |
|--------|---------|
| `database/scripts/reset.sh` | Drop, recreate, migrate, and seed |
| `database/scripts/seed.sh` | Load seed data only |
| `database/scripts/backup.sh` | Full database backup (custom format) |
| `database/scripts/restore.sh` | Restore from backup |
| `database/scripts/health_check.sql` | Verify database state |
