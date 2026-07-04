# CHANGELOG

All notable changes to SV-OS will be documented in this file.

## Version 0.10.0 — 2026-07-04

### Phase 3.2: Repository Cleanup & Deployment Preparation

#### Removed
- **`apps/web/src/lib/api.ts`**: Dead code — the simpler API client was unused in favor of the feature-rich `api-client.ts`
- **`docs/FolderStructure.md`**: Duplicate of `docs/FOLDER_STRUCTURE.md` (case-insensitive collision)
- **`apps/web/src/components/ui/`**: Empty directory (all UI components live in `packages/ui`)
- **`apps/web/src/services/`**: Empty directory with placeholder `.gitkeep`
- **`apps/web/src/types/`**: Empty directory (types are in `packages/types`)
- **`apps/web/src/hooks/.gitkeep`**: Unnecessary — hooks directory already has real files
- **`docker/`**: Empty directory with placeholder `.gitkeep`

#### Fixed
- **`apps/web/.env.local.example`**: Replaced `[BLOCKED]` placeholder with a proper environment variable template
- **`apps/web/src/lib/index.ts`**: Removed broken `api` export (file was deleted)

#### Added
- **`apps/web/README.md`**: Comprehensive README for the frontend app
- **`apps/api/README.md`**: Comprehensive README for the backend API
- **`docs/DEPLOYMENT.md`**: Full deployment guide covering Render, Vercel, Supabase, Docker, and CI/CD

#### Updated
- **`.ai/HANDOVER.md`**: Removed reference to deleted `api.ts`
- **`.ai/PROJECT_STATE.md`**: Updated to Phase 3.2 complete
- **`.ai/CHANGELOG.md`**: This entry
- **`.ai/SESSION_NOTES.md`**: Added Session 10

#### Verified
- ✅ TypeScript compilation passes (0 errors, `tsc --noEmit`)
- ✅ pnpm install succeeds
- ✅ Turborepo workspace configuration is correct (6 packages, all `@sv-os/*` namespaced)
- ✅ All package.json name fields match workspace patterns
- ✅ Frontend builds without type errors
- ✅ No broken imports from removed files
- ✅ Shared packages resolve correctly (`@sv-os/config`, `@sv-os/types`, `@sv-os/ui`, `@sv-os/eslint-config`, `@sv-os/tsconfig`)

## Version 0.9.0 — 2026-07-04

### Phase 3: Application Services + Auth + API + Frontend Integration

#### Added Code — Application Services (13 files)
- **`apps/api/app/services/auth.py`**: `AuthService` — JWT access/refresh tokens, bcrypt password hashing via passlib, register, login, refresh_tokens, change_password, get_authenticated_user, role checking. `AuthenticationError` and `AuthorizationError` exception classes.
- **`apps/api/app/services/user.py`**: `UserService` — get_profile, update_profile (display_name, avatar_url, bio, preferences), get_dashboard
- **`apps/api/app/services/knowledge_node.py`**: `KnowledgeNodeService` — get_by_slug, list_nodes (with pagination/filtering/sorting), get_popular, increment_view, get_prerequisites, get_neighbors, get_resources, get_related_careers
- **`apps/api/app/services/graph.py`**: `GraphService` — explore (neighborhood with types), find_shortest_path (BFS), get_statistics (node/edge counts by type), get_prerequisite_chain
- **`apps/api/app/services/career.py`**: `CareerService` — list_careers (with demand filtering), get_by_slug, get_roadmap (with requirements), get_nodes_for_career
- **`apps/api/app/services/project.py`**: `ProjectService` — list_projects (with difficulty filtering), get_by_slug, get_requirements
- **`apps/api/app/services/skill.py`**: `SkillService` — list_skills, get_skill_categories, get_by_id, get_relationships
- **`apps/api/app/services/learning_path.py`**: `LearningPathService` — list_paths (difficulty/duration filtering), get_by_id
- **`apps/api/app/services/progress.py`**: `ProgressService` — list_progress, get_statistics, upsert_progress (with auto-timestamp transitions), start, complete
- **`apps/api/app/services/bookmark.py`**: `BookmarkService` — list_bookmarks, toggle, is_bookmarked
- **`apps/api/app/services/favorite.py`**: `FavoriteService` — list_favorites, add_favorite, remove_favorite, is_favorited
- **`apps/api/app/services/search.py`**: `SearchService` — search (full-text with FTS + filters), get_suggestions (autocomplete), get_history, clear_history, get_trending
- **`apps/api/app/services/recommendation.py`**: `RecommendationService` (stub) — get_for_user, get_popular_nodes, dismiss, get_type_counts

#### Added Code — REST API Endpoints (12 files, ~48 endpoints)
- **`apps/api/app/api/v1/endpoints/auth.py`**: 7 endpoints — register, login, refresh, me, update me, change-password, logout
- **`apps/api/app/api/v1/endpoints/nodes.py`**: 8 endpoints — list, search, popular, get by slug, prerequisites, related, resources, careers
- **`apps/api/app/api/v1/endpoints/graph.py`**: 4 endpoints — explore, path, statistics, prerequisite-chain
- **`apps/api/app/api/v1/endpoints/careers.py`**: 4 endpoints — list, get, roadmap, nodes
- **`apps/api/app/api/v1/endpoints/projects.py`**: 3 endpoints — list, get, requirements
- **`apps/api/app/api/v1/endpoints/skills.py`**: 4 endpoints — list, categories, get, relationships
- **`apps/api/app/api/v1/endpoints/learning_paths.py`**: 2 endpoints — list, get
- **`apps/api/app/api/v1/endpoints/progress.py`**: 5 endpoints — list, stats, update, start, complete
- **`apps/api/app/api/v1/endpoints/bookmarks.py`**: 3 endpoints — list, toggle, check
- **`apps/api/app/api/v1/endpoints/favorites.py`**: 4 endpoints — list, add, remove, check
- **`apps/api/app/api/v1/endpoints/search.py`**: 5 endpoints — search, suggestions, history, clear, trending
- **`apps/api/app/api/v1/endpoints/recommendations.py`**: 3 endpoints — list, popular, dismiss

#### Added Code — Authentication Infrastructure
- **`apps/api/alembic/versions/0003_add_password_hash.py`**: Migration adding password_hash column to users table
- **`apps/api/app/schemas/auth/auth.py`**: LoginRequest, SignupRequest, TokenResponse, LoginResponse, RefreshRequest, ChangePasswordRequest
- **`apps/api/app/api/deps.py`**: get_current_user_id_from_token, get_current_user_id, get_optional_user_id, get_current_user, require_admin, 3 service injectors
- **`apps/api/app/repositories/favorite.py`**: `FavoriteRepository` — find_by_user, find_by_user_and_node, count_by_user, is_favorited

#### Added Code — Frontend Auth Infrastructure (7 files)
- **`apps/web/src/lib/api-client.ts`**: Enhanced fetch API client with automatic Bearer token injection, transparent 401 → token refresh, request deduplication, ApiRequestError class
- **`apps/web/src/lib/auth-client.ts`**: Auth operations — signup, login, getProfile, updateProfile, changePassword, logout
- **`apps/web/src/hooks/use-auth.ts`**: 7 React Query hooks — useCurrentUser, useIsAuthenticated, useLogin, useSignup, useLogout, useUpdateProfile, useChangePassword, useAuthListener
- **`apps/web/src/providers/auth-provider.tsx`**: AuthContext + AuthProvider with login/signup/logout methods, user state
- **`apps/web/src/components/auth/protected-route.tsx`**: Route guard with auth check, role verification, loading/error states
- **`apps/web/src/app/(auth)/login/page.tsx`**: Login form with email/password, error handling, loading state
- **`apps/web/src/app/(auth)/signup/page.tsx`**: Signup form with email/username/password, client-side validation

#### Added Code — Testing (2 files)
- **`apps/api/tests/services/__init__.py`**: Test package
- **`apps/api/tests/services/test_auth_service.py`**: 29 test cases — password hashing (6), registration (4), login (6), JWT tokens (6), token refresh (3), password change (3), authorization (3)

#### Modified Code
- **`apps/api/app/api/v1/router.py`**: All 12 endpoint routers wired with proper prefixes and tags
- **`apps/api/app/api/deps.py`**: Auth dependencies + 3 service injectors
- **`apps/api/app/repositories/__init__.py`**: Added FavoriteRepository to exports
- **`apps/api/app/repositories/unit_of_work.py`**: Added favorites property
- **`apps/api/app/services/__init__.py`**: 13 service class exports
- **`apps/web/src/providers/index.ts`**: Added AuthProvider, useAuth exports
- **`apps/web/src/hooks/index.ts`**: Added auth hook exports
- **`apps/web/src/app/layout.tsx`**: Added AuthProvider wrapper
- **`apps/api/app/models/user.py`**: Added password_hash field

#### Verified
- ✅ All 13 backend service classes import successfully
- ✅ All 12 backend endpoint modules import successfully
- ✅ Frontend TypeScript compilation passes (0 errors)
- ✅ pnpm install succeeds
- ✅ 29 auth service unit tests created
- ✅ All documentation files updated

## Version 0.6.0 — 2026-07-01

### Phase 2.5: Database Persistence Layer

#### Added Migrations
- **`apps/api/alembic/versions/0001_create_extensions.py`**: 6 PostgreSQL extensions enabled
  - uuid-ossp (UUID generation), pgcrypto (crypto functions), pg_trgm (fuzzy search)
  - unaccent (accent removal), btree_gin (GIN on scalars), btree_gist (GiST on scalars)
- **`apps/api/alembic/versions/0002_initial_schema.py`**: Complete schema for all 20 tables
  - 13 PostgreSQL enum types with correct values
  - 20 tables with all columns, constraints, and indexes
  - Full-text search vector + GIN index + trigger-based auto-population
  - Updated-at triggers on 5 mutation-heavy tables
  - 2 views (v_node_statistics, v_user_progress_summary)
  - 30 indexes across all tables, each justified for specific query patterns

#### Added Seed Data
- **`database/seeds/08_skills.sql`**: 44 skills across 7 categories (Programming Language, Web, DevOps, Database, Cloud, AI/ML, Security, Soft Skills)
- **`database/seeds/09_tags.sql`**: 30 tags across 5 categories (Difficulty, Content Type, Topic, Format, Technology)

#### Added Database Utilities
- **`database/scripts/reset.sh`**: Drop, recreate, migrate, and seed
- **`database/scripts/seed.sh`**: Load seed data in dependency order
- **`database/scripts/backup.sh`**: Custom-format PostgreSQL backup
- **`database/scripts/restore.sh`**: Restore from backup with confirmation
- **`database/scripts/health_check.sql`**: Verify extensions, enums, tables, triggers, indexes, constraints, views

#### Added Migration Tests
- **`apps/api/tests/migrations/test_migrations.py`**: 13 test suites
  - TestExtensions: All 6 extensions installed
  - TestEnumTypes: All 13 enums with correct values
  - TestTables: All 20 tables exist with correct column counts
  - TestConstraints: Foreign keys with correct cascade, unique constraints
  - TestTriggers: Search vector trigger, updated-at functions
  - TestViews: Both views exist
  - TestMigrationRoundTrip: Upgrade/downgrade round-trip (slow)

#### Added Migration Documentation
- **`database/migrations/README.md`**: Strategy, extension docs, index justification, FTS docs, seed docs, testing guide

#### Modified Code
- **`docker-compose.yml`**: Removed schema.sql init script (migrations now managed by Alembic)

#### Documentation Updated
- `.ai/DATABASE_STATUS.md`: Full rewrite with Phase 2.5 status
- `.ai/PROJECT_STATE.md`: Updated to Phase 2.5 complete
- `.ai/PROJECT_MEMORY.md`: Added migration conventions and patterns
- `.ai/ARCHITECTURE_DECISIONS.md`: Added AD-014 (migration strategy)
- `.ai/CHANGELOG.md`: This entry
- `.ai/SESSION_NOTES.md`: Added Session 6
- `.ai/HANDOVER.md`: Updated for Phase 2.5 → Phase 2.6 transition
- `docs/DEVELOPMENT.md`: Added migration instructions
- `docs/DATABASE.md`: Updated with new tables, views, indexes

#### Verified
- Migration 0001 (extensions) creates 6 extensions successfully
- Migration 0002 (schema) creates 20 tables, 13 enums, all constraints
- Downgrade fully reverses both migrations
- All foreign keys reference correct tables with correct cascade behavior
- All unique constraints correctly defined
- Search vector trigger exists and functions correctly
- Both views are created correctly
- Seed data loads in dependency order without errors
- No duplicate indexes (unique constraint indexes not duplicated)

## Version 0.8.0 — 2026-07-04

### Phase 2.7: Repository & Unit of Work Layer

#### Added Code — Repository Layer
- **`apps/api/app/repositories/errors.py`**: Repository exception hierarchy — `RepositoryError`, `EntityNotFoundError`, `DuplicateEntityError`, `ConcurrentModificationError`, `DatabaseConnectionError`, `QueryError`
- **`apps/api/app/repositories/query_helpers.py`**: `QueryBuilder[T]` fluent API, `PageResult[T]`, `CursorPageResult[T]`, `FilterCondition` with 10 operators, `SortDirection` constants
- **`apps/api/app/repositories/unit_of_work.py`**: `UnitOfWork` class with 16 repository accessors (context manager + manual commit/rollback), `unit_of_work()` convenience function
- **`apps/api/app/repositories/base.py`**: Enhanced `BaseRepository[T]` with `get_by_id`, `get_many`, `get_by_field`, `exists`, `exists_by_id`, `create`, `create_many`, `update`, `upsert`, `delete` (soft/hard), `delete_many`, `restore`, `count`, `count_all`, `paginate`, `paginate_cursor`, `search` (ILIKE), `search_fulltext` (TSVECTOR), `load_related` (batch loading)

#### Added Code — Feature Repositories (15 files)
- **`user.py`**: `UserRepository` — email/username lookup, profile update, login recording, role-based queries, email/username uniqueness checks
- **`knowledge_node.py`**: `KnowledgeNodeRepository` — slug lookup, type/difficulty filtering, edge/resource counts, popular/trending, full-text search with filters, slug existence check
- **`knowledge_edge.py`**: `KnowledgeEdgeRepository` — source/target lookups, edge-between queries, batch edge loading, bulk soft-delete
- **`career.py`**: `CareerRepository` — slug lookup, demand-level filtering, requirement CRUD, demand statistics
- **`project.py`**: `ProjectRepository` — slug lookup, difficulty filtering, requirement CRUD
- **`skill.py`**: `SkillRepository` — name/category/difficulty lookup, category listing, relationship CRUD, skill graph queries
- **`learning_path.py`**: `LearningPathRepository` + `LearningSessionRepository` — difficulty filtering, node order extraction, user session queries, active session counting, total time tracking
- **`learning_resource.py`**: `LearningResourceRepository` — node/resource-type/free/difficulty filtering, batch node resource loading
- **`user_progress.py`**: `UserProgressRepository` — user/node queries, status-based filtering, upsert with auto-timestamp transitions, status statistics, completion counting
- **`bookmark.py`**: `BookmarkRepository` — user/node queries, toggle (create/delete), bookmark counting
- **`recommendation.py`**: `RecommendationRepository` — user/type queries, dismissal, type statistics
- **`tag.py`**: `TagRepository` — name lookup, search, node-tag association management, popular tag ranking
- **`search_history.py`**: `SearchHistoryRepository` — user/trending queries, autocomplete, clear for user
- **`audit_log.py`**: `AuditLogRepository` — immutable logging, user/action/entity/date filtering, action statistics
- **`graph.py`**: `GraphRepository` — neighbor loading (incoming/outgoing), prerequisite/dependent loading, edge type statistics, bulk edge loading for node sets

#### Added Code — Test Scaffolding
- **`apps/api/tests/repositories/test_repository_base.py`**: Fixtures for UoW transaction rollback, CRUD verification, pagination, cursor pagination, search, error handling, graph queries, feature repository smoke tests

#### Modified Code
- **`apps/api/app/repositories/__init__.py`**: 28 exported symbols (all repository classes + errors + query helpers + UoW)
- **`apps/api/app/repositories/base.py`**: Enhanced with soft-delete, paginate, cursor, search, batch loading, optimistic locking
- **`apps/api/app/api/deps.py`**: Added `get_uow()` (UnitOfWork), 16 individual repository injectors, updated `get_base_repository`

#### Architecture Decisions
| Decision | Detail |
|----------|--------|
| AD-015 | Repository pattern with Unit of Work transaction management |
| | Repositories never commit — only flush |
| | Soft-delete applied to all queries by default |
| | Error translation layer prevents SQLAlchemy leakage |
| | QueryBuilder provides composable, type-safe query construction |

#### Verified
- ✅ All 21 repository classes import successfully
- ✅ All 16 dependency injection functions compile
- ✅ No SQLAlchemy session usage outside repositories
- ✅ UnitOfWork manages all transactions
- ✅ Repository-level exceptions (no SQLAlchemy leakage)
- ✅ Feature-specific repositories with generic reuse
- ✅ GraphRepository handles persistence queries only (no algorithms)
- ✅ All documentation files updated

## Version 0.7.0 — 2026-07-01

### Phase 2.6: API Contract Layer (Pydantic DTOs)

#### Added Code — New Schema Modules
- **`apps/api/app/schemas/skill/`**: 9 DTOs — SkillSummary, SkillDetail, SkillLink, SkillCreate, SkillUpdate, SkillRelationshipSchema, SkillRelationshipCreate, SkillGraph, SkillCategoryCount
- **`apps/api/app/schemas/tag/`**: 7 DTOs — TagSummary, TagDetail, TagCreate, TagUpdate, NodeTagInfo, NodeTagCreate, TagList
- **`apps/api/app/schemas/recommendation/`**: 5 DTOs — RecommendationSummary, RecommendationDetail, RecommendationDismiss, RecommendationTypeCount, RecommendationList
- **`apps/api/app/schemas/audit/`**: 4 DTOs — AuditLogEntry, AuditLogDetail, AuditLogFilter, AuditLogList

#### Modified Code
- **`apps/api/app/schemas/response.py`**: Removed duplicate `ErrorDetail` and `PaginatedData` classes (now imported from common/), added `build_success_response()`/`build_error_response()` with backward-compatible aliases
- **`apps/api/app/schemas/common/pagination.py`**: Added `SortDirection = Literal['asc', 'desc']` type alias
- **`apps/api/app/schemas/__init__.py`**: Added 25 new exports (Skill, Tag, Recommendation, Audit DTOs), removed `ResponsePaginatedData` re-export

#### Key Design Decisions
- **No ORM leakage**: All 127 DTOs are pure Pydantic BaseModel classes — no SQLAlchemy model exposure
- **Multiple representations**: Each entity type has Card, Summary, Detail, Create, and Update DTOs
- **Pydantic v2 strict validation**: Field validators, regex patterns (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), constrained types
- **Consistent envelope**: Every endpoint uses `APIResponse` with success/message/data/errors/timestamp/request_id
- **Proper serialization**: UUID (as string), datetime (ISO 8601), enums (string values)
- **127 total exports** across 10 feature modules + response envelope

#### Documentation Updated
- `.ai/PROJECT_STATE.md`: Updated to Phase 2.6 complete
- `.ai/API_STATUS.md`: Full schema contract table added
- `.ai/CHANGELOG.md`: This entry
- `.ai/SESSION_NOTES.md`: Added Session 7
- `.ai/HANDOVER.md`: Updated for Phase 2.6 → Phase 2.7 transition

#### Verified
- All schemas import successfully (127 exports)
- No circular imports
- No duplicate class names
- No ORM model references in DTOs
- Consistent naming conventions across all modules
- Pydantic v2 Field descriptors with proper validation

## Version 0.6.0 — 2026-07-01

### Phase 2.4: Database Domain Models

#### Added Code
- **`apps/api/app/models/enums.py`**: 14 reusable enum types (NodeType, EdgeType, EdgeDirection, Difficulty, ProgressStatus, DemandLevel, UserRole, ResourceType, Visibility, LearningStatus, RecommendationType, RequirementType, SkillRelationshipType)
- **`apps/api/app/models/base.py`**: `AppBaseMixin` — shared mixin providing UUID PK, created_at, updated_at, is_deleted (soft-delete), version (optimistic locking)
- **`apps/api/app/models/user.py`**: `User` model — email, username, display_name, avatar, bio, role, preferences JSONB, is_active, last_login_at. 8 relationship back-references.
- **`apps/api/app/models/knowledge_node.py`**: `KnowledgeNode` model — slug, title, description, content, node_type, difficulty, estimated_minutes, icon, color, extra_metadata JSONB, search_vector TSVECTOR, view_count, is_published. 9 relationship back-references.
- **`apps/api/app/models/knowledge_edge.py`**: `KnowledgeEdge` model — source_node_id, target_node_id, relationship_type, direction, description, weight, extra_metadata JSONB. Self-loop check constraint.
- **`apps/api/app/models/career.py`**: `Career` model + `CareerRequirement` junction model with requirement_type (required/recommended/bonus).
- **`apps/api/app/models/project.py`**: `Project` model + `ProjectRequirement` junction model with tech_stack ARRAY column.
- **`apps/api/app/models/learning_resource.py`**: `LearningResource` model — node_id, title, url, resource_type, platform, is_free, duration_minutes, difficulty, language.
- **`apps/api/app/models/learning_path.py`**: `LearningPath` model + `LearningSession` model for tracking study sessions.
- **`apps/api/app/models/skill.py`**: `Skill` model + `SkillRelationship` model for directed skill graph.
- **`apps/api/app/models/user_progress.py`**: `UserProgress` model tracking status lifecycle (not_started → learning → completed → mastered).
- **`apps/api/app/models/recommendation.py`**: `Recommendation` model — user_id, node_id, recommendation_type, score, reason, is_dismissed.
- **`apps/api/app/models/bookmark.py`**: `Bookmark` model — user_id, node_id, notes with unique constraint.
- **`apps/api/app/models/favorite.py`**: `Favorite` model — user_id, node_id with unique constraint.
- **`apps/api/app/models/tag.py`**: `Tag` model + `NodeTag` junction model for many-to-many tagging.
- **`apps/api/app/models/search_history.py`**: `SearchHistory` model — query, filters JSONB, results_count.
- **`apps/api/app/models/audit_log.py`**: `AuditLog` model — action, entity_type, entity_id, extra_metadata JSONB, ip_address INET.

#### Modified Code
- **`apps/api/app/core/database.py`**: Added naming convention for constraints/indexes on `Base.metadata`.
- **`apps/api/alembic/env.py`**: Added `from app.models import *` to load all models for Alembic autogenerate.

#### Documentation Updated
- `.ai/DATABASE_STATUS.md`: Rewritten with 20 tables, 14 enums, naming convention, uniqueness constraints
- `.ai/PROJECT_STATE.md`: Updated to Phase 2.4 complete, added checklist
- `.ai/PROJECT_MEMORY.md`: Added domain model conventions and key file locations
- `.ai/ARCHITECTURE_DECISIONS.md`: Added AD-012 (flat models) and AD-013 (shared mixin)
- `.ai/DEPENDENCY_MAP.md`: Added full model dependency tree
- `.ai/CHANGELOG.md`: This entry
- `.ai/SESSION_NOTES.md`: Added Session 5
- `.ai/HANDOVER.md`: Updated for Phase 2.4 → Phase 2.5 transition

#### Verified
- All 20 SQLAlchemy model classes import without errors
- All tables register correctly on `Base.metadata` with proper columns
- No circular imports (TYPE_CHECKING pattern used throughout)
- No reserved name conflicts (metadata → extra_metadata fix applied)
- All unique constraints, foreign keys, and indexes correctly defined
- All relationship back_populates consistent
- Naming convention applied to Base

## Version 0.4.0 — 2026-06-30
... [unchanged] ...
