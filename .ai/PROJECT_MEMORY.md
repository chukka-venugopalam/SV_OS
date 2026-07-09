# Project Memory — SV-OS

_Long-term knowledge that persists across sessions and AI models._

---

## Project Identity

... [unchanged — see existing file] ...

## Naming Conventions

... [unchanged — see existing file] ...

### Domain Model Conventions (Phase 2.4)

- **Python attribute `extra_metadata`** maps to database column `metadata` (avoids conflict with `DeclarativeBase.metadata`)
- **Table names**: snake_case plural (`knowledge_nodes`, `user_progress`, `activity_logs`)
- **Model class names**: PascalCase singular (`KnowledgeNode`, `UserProgress`, `AuditLog`)
- **FK column names**: `<target_table>_id` (e.g. `user_id`, `node_id`, `source_skill_id`)
- **Unique constraint names**: `uq_<table>_<column>` convention
- **All models** inherit from both `AppBaseMixin` (columns) and `Base` (DeclarativeBase registration)

### Migration Conventions (Phase 2.5)

- **Revision IDs**: Sequential numeric (`0001`, `0002`, etc.)
- **Every migration must be reversible**: Each `upgrade()` has a matching `downgrade()`
- **Extensions go in separate migration**: `0001_create_extensions.py` — independent of schema
- **Self-documenting**: Every `CREATE TABLE`, index, and extension has an inline comment
- **Explicit constraint names**: All constraints have explicit `name=` parameters overriding the naming convention for clarity
- **No redundant indexes**: When a column has `unique=True`, no separate `create_index()` — PostgreSQL creates the index automatically
- **`is_published` index**: Every table with `is_published` gets an index (used by most queries for filtering)
- **FK ondelete**: CASCADE for required children, SET NULL for optional (audit_logs)

### Seed Data Conventions (Phase 2.5)

- **Numbered prefix**: `01_`, `02_`, etc. — loaded in sorted order to respect FK dependencies
- **Load order**: subjects → concepts → technologies → careers → projects → edges → resources → skills → tags
- **User data excluded**: No users, progress, or recommendations seeded (generated at runtime)
- **Reference data only**: Only foundational reference data (node types, difficulty levels, skills, tags)

### Repository Conventions (Phase 2.7)

- **BaseRepository[T]**: Generic CRUD — all feature repositories inherit from it with `model = ModelClass`
- **No session.commit()**: Repositories call `session.flush()` only; UnitOfWork owns the transaction
- **No SQLAlchemy exceptions**: All errors translated to `RepositoryError` subclasses
- **Soft-delete by default**: All queries filter `is_deleted = False` unless `include_deleted=True`
- **QueryBuilder[T]**: Fluent API for composing SELECT queries with filters, sorting, pagination
- **Feature repos add domain queries**: Slug lookups, type filtering, status transitions, etc.
- **GraphRepository is read-only**: Only persistence queries — no graph algorithms (those go in a GraphService)
- **UoW provides all repos**: `uow.users`, `uow.knowledge_nodes`, `uow.graph`, etc.

## Architecture Constants

... [unchanged — see existing file] ...

## Monorepo Structure

... [unchanged — see existing file] ...

## Key File Locations

### Backend Domain Models (Phase 2.4)

... [unchanged — see existing file] ...

### Database Persistence (Phase 2.5)

- **Migration 0001**: `apps/api/alembic/versions/0001_create_extensions.py` — 6 PostgreSQL extensions
- **Migration 0002**: `apps/api/alembic/versions/0002_initial_schema.py` — 20 tables, 13 enums, indexes, triggers, views
- **Seed data**: `database/seeds/` — 9 seed files covering all foundational reference data
- **Utility scripts**: `database/scripts/` — reset, seed, backup, restore, health check
- **Migration tests**: `apps/api/tests/migrations/test_migrations.py` — 13 test suites
- **Migration docs**: `database/migrations/README.md` — strategy, index justification, FTS docs

## Common Patterns

... [unchanged — see existing file] ...

### Domain Model Patterns

... [unchanged — see existing file] ...

### Migration Patterns

- **Extensions first**: Always create extensions in migration 0001 so subsequent migrations can depend on them
- **Tables in dependency order**: Parent tables before child tables (no FK to a table that doesn't exist yet)
- **Triggers after tables**: Triggers and functions created after all tables exist
- **Views last**: Views depend on tables and are created last
- **Downgrade reverses upgrade**: Views dropped first, then triggers/functions, then tables (reverse order), then enums, then extensions

## Not To Do

... [unchanged — see existing file] ...

## Testing Strategy

... [unchanged — see existing file] ...
