# SV-OS Backend Blueprint

> **Framework**: FastAPI | **Language**: Python 3.12+ | **ORM**: SQLAlchemy 2.0+ (async)  
> **Database Driver**: asyncpg | **Status**: Stable ✅

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     API Layer                            │
│  Router → Endpoints → Pydantic Schemas → Dependencies   │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│  Business Logic → Orchestration → Validation            │
├─────────────────────────────────────────────────────────┤
│                    Engine Layer                          │
│  In-memory Computation → Algorithms → Events           │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│  Container → Cache → Registries → Audit → Bus          │
├─────────────────────────────────────────────────────────┤
│                  Repository Layer                        │
│  BaseRepository → QueryBuilder → UnitOfWork → Models   │
├─────────────────────────────────────────────────────────┤
│                     Data Layer                           │
│  SQLAlchemy ORM Models → PostgreSQL 16                  │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Repositories

### Architecture

All repositories extend `BaseRepository[ModelT]`:

```python
class BaseRepository[ModelT: Base]:
    """Generic CRUD + pagination + soft-delete + optimistic locking."""

    model: type[ModelT]  # Must be set by subclass

    # Standard operations
    async def get_by_id(self, id: UUID) -> ModelT | None
    async def get_many(self, ids: list[UUID]) -> list[ModelT]
    async def get_all(self, filters, sort, limit, offset) -> list[ModelT]
    async def create(self, **data) -> ModelT
    async def update(self, id: UUID, **data) -> ModelT
    async def delete(self, id: UUID, hard: bool = False)
    async def upsert(self, constraints, data) -> ModelT

    # Pagination
    async def paginate(self, page, per_page, filters, sort) -> PageResult
    async def paginate_cursor(self, cursor_field, cursor, limit) -> CursorPageResult

    # Soft-delete aware
    async def restore(self, id: UUID) -> ModelT
    async def exists(self, **filters) -> bool
    async def count(self, filters) -> int

    # QueryBuilder for complex queries
    def _query(self) -> QueryBuilder[ModelT]
    async def find_by(self, conditions, sorts, limit, offset) -> list[ModelT]
```

### Concrete Repositories (18+)

| Repository                   | Model              | Key Methods                                                      |
| ---------------------------- | ------------------ | ---------------------------------------------------------------- |
| `UserRepository`             | User               | `find_by_email()`, `find_by_username()`                          |
| `KnowledgeNodeRepository`    | KnowledgeNode      | `find_by_slug()`, `search_fulltext()`                            |
| `KnowledgeEdgeRepository`    | KnowledgeEdge      | `find_by_source()`, `find_by_target()`, `find_by_relationship()` |
| `CareerRepository`           | Career             | `find_by_slug()`, `find_by_demand()`                             |
| `ProjectRepository`          | Project            | `find_by_slug()`                                                 |
| `UserProgressRepository`     | UserProgress       | `find_by_user_and_node()`, `get_user_stats()`                    |
| `BookmarkRepository`         | Bookmark           | `find_by_user()`, `find_by_user_and_node()`                      |
| `FavoriteRepository`         | Favorite           | `find_by_user()`                                                 |
| `RecommendationRepository`   | Recommendation     | `find_by_user()`, `find_active()`                                |
| `LearningPathRepository`     | LearningPath       | `find_by_user()`, `find_by_goal()`                               |
| `LearningSessionRepository`  | LearningSession    | `find_active_by_user()`                                          |
| `LearningResourceRepository` | LearningResource   | `find_by_node()`                                                 |
| `SkillRepository`            | Skill              | `find_by_name()`, `find_by_category()`                           |
| `TagRepository`              | Tag                | `find_by_name()`, `find_by_node()`                               |
| `SearchHistoryRepository`    | SearchHistory      | `find_recent_by_user()`, `get_trending()`                        |
| `AuditLogRepository`         | AuditLog           | `find_by_user()`, `find_by_entity()`                             |
| `PasswordResetRepository`    | PasswordResetToken | `find_valid_token()`, `invalidate_user_tokens()`                 |
| `GraphRepository`            | (complex queries)  | `get_full_graph()`, `get_neighborhood()`                         |

### QueryBuilder

Fluent API for complex query construction:

```python
builder = QueryBuilder(KnowledgeNode)
query = (
    builder
    .active()                                    # is_deleted = False
    .filter(KnowledgeNode.node_type == 'concept')  # Type filter
    .filter(KnowledgeNode.difficulty.in_(['beginner', 'intermediate']))
    .sort('title', 'asc')
    .paginate(page=1, per_page=20)
    .build()
)
```

---

## 2. Unit of Work

### Transaction Management

```python
class UnitOfWork:
    """Single transaction boundary for multiple repository operations."""

    # Lazy-initialized repositories (18+ properties)
    users: UserRepository
    knowledge_nodes: KnowledgeNodeRepository
    knowledge_edges: KnowledgeEdgeRepository
    careers: CareerRepository
    projects: ProjectRepository
    user_progress: UserProgressRepository
    bookmarks: BookmarkRepository
    # ... etc

    # Transaction control
    async def commit(self)     # Commit transaction
    async def rollback(self)   # Roll back transaction
    async def flush(self)      # Flush without commit
```

### Usage Patterns

**Context manager (preferred)**:

```python
async with UnitOfWork(db_session) as uow:
    user = await uow.users.create(email="...", username="...")
    await uow.user_progress.create(user_id=user.id, ...)
    # Auto-commits on success, rolls back on exception
```

**Explicit control**:

```python
uow = UnitOfWork(db_session)
try:
    user = await uow.users.get_by_id(user_id)
    await uow.commit()
finally:
    await uow.session.close()
```

---

## 3. Services

### AuthService

| Method                   | Description                      |
| ------------------------ | -------------------------------- |
| `hash_password()`        | Static — bcrypt hash             |
| `verify_password()`      | Static — bcrypt verify           |
| `create_access_token()`  | JWT with 60-min expiry           |
| `create_refresh_token()` | JWT with 7-day expiry            |
| `decode_token()`         | JWT decode + validate            |
| `register()`             | Create user (checks duplicates)  |
| `login()`                | Authenticate + return tokens     |
| `refresh_tokens()`       | Rotate token pair                |
| `change_password()`      | Verify current → set new         |
| `forgot_password()`      | Generate reset token             |
| `reset_password()`       | Validate token → update password |
| `require_role()`         | Role-based authorization         |

### Regular Services

| Service                   | Location                              | Purpose                                                 |
| ------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `UserService`             | `services/user.py`                    | Profile CRUD, preferences                               |
| `GraphService`            | `services/legacy_graph.py`            | Graph queries (neighborhood, statistics, prerequisites) |
| `GraphAnalyticsService`   | `services/graph/analytics.py`         | Graph metrics and analysis                              |
| `GraphTraversalService`   | `services/graph/traversal.py`         | Custom traversal operations                             |
| `SearchService`           | `services/search.py`                  | Database-level full-text search                         |
| `ProgressService`         | `services/progress.py`                | Progress tracking + statistics                          |
| `ProgressIntelligence`    | `services/progress_intelligence.py`   | Progress insights and predictions                       |
| `BookmarkService`         | `services/bookmark.py`                | Bookmark CRUD                                           |
| `FavoriteService`         | `services/favorite.py`                | Favorite CRUD                                           |
| `CareerService`           | `services/career.py`                  | Career path queries                                     |
| `ProjectService`          | `services/project.py`                 | Project CRUD                                            |
| `RecommendationService`   | `services/recommendation.py`          | User-facing recommendations                             |
| `RecommendationEngine_v2` | `services/recommendation_engine.py`   | AI-enhanced recommendations                             |
| `LearningPathService`     | `services/learning_path.py`           | Learning path management                                |
| `LearningPathGenerator`   | `services/learning_path_generator.py` | Path generation algorithms                              |
| `SkillService`            | `services/skill.py`                   | Skill management                                        |
| `ActivityFeedService`     | `services/activity_feed.py`           | Activity feed generation                                |

---

## 4. Engines

### EngineBase Lifecycle

```python
class EngineBase(ABC):
    """Every engine follows this lifecycle."""

    # States: UNINITIALIZED → INITIALIZING → READY → RUNNING → STOPPING → STOPPED → FAILED

    async def initialize(self)  # UNINITIALIZED → READY or FAILED
    async def start(self)       # READY → RUNNING or FAILED
    async def stop(self)        # RUNNING → STOPPED or FAILED
    async def health(self)      # Returns EngineHealth
    async def diagnostics()     # Returns full diagnostics snapshot
```

### Registered Engines (19)

| Engine                   | File                       | Purpose                   | Key Operations                                                                                                                       |
| ------------------------ | -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **EventEngine**          | `event_engine.py`          | Event bus backbone        | publish, subscribe                                                                                                                   |
| **GraphEngine**          | `graph_engine.py`          | In-memory graph runtime   | add/get/remove node/edge, indexes, snapshots, statistics, integrity checks                                                           |
| **KnowledgeEngine**      | `knowledge_engine.py`      | Knowledge management      | content indexing, tag management                                                                                                     |
| **DependencyEngine**     | `dependency_engine.py`     | Dependency resolution     | prerequisite analysis, dependency trees                                                                                              |
| **TraversalEngine**      | `traversal_engine.py`      | Graph algorithms          | BFS, DFS, shortest_path, topological_sort, cycle_detection, connected_components, subgraph, dependency_chain, ancestors, descendants |
| **QueryEngine**          | `query_engine.py`          | Query processing          | Composite queries across graph + knowledge                                                                                           |
| **StateEngine**          | `state_engine.py`          | Learner state             | confidence tracking, learner_state                                                                                                   |
| **RecommendationEngine** | `recommendation_engine.py` | Next-step recommendations | 8 priority rules, daily/weekly digests, by-goal, by-career                                                                           |
| **LearningPathEngine**   | `learning_path_engine.py`  | Path generation           | 8 strategies (dependency, shortest, career, skill, custom, semester, daily, weekly)                                                  |
| **AssessmentEngine**     | `assessment_engine.py`     | Learner assessment        | skill assessment, knowledge checks                                                                                                   |
| **CareerEngine**         | `career_engine.py`         | Career management         | career path analysis, requirement mapping                                                                                            |
| **VersioningEngine**     | `versioning_engine.py`     | Graph versioning          | snapshots, restore, version history                                                                                                  |
| **ExportEngine**         | `export_engine.py`         | Data export               | graph export, format conversion                                                                                                      |
| **ImportEngine**         | `import_engine.py`         | Knowledge import          | validation, dedup, graph generation                                                                                                  |
| **SchedulerEngine**      | `scheduling_engine.py`     | Task scheduling           | review scheduling, spaced repetition                                                                                                 |
| **RevisionEngine**       | `revision_engine.py`       | Spaced repetition         | SM-2 algorithm, review intervals                                                                                                     |
| **AnalyticsEngine**      | `analytics_engine.py`      | Platform analytics        | usage metrics, graph evolution                                                                                                       |
| **PluginEngine**         | `plugin_engine.py`         | Plugin system             | plugin loading, lifecycle                                                                                                            |
| **ValidationEngine**     | `validation_engine.py`     | Data validation           | node/edge validation, integrity                                                                                                      |

---

## 5. Models (SQLAlchemy ORM)

### Base Mixin

```python
class AppBaseMixin:
    """Every domain model inherits this."""
    id: UUID                 # PK (auto-generated)
    created_at: datetime     # Creation timestamp
    updated_at: datetime     # Last update timestamp
    is_deleted: bool         # Soft delete flag
    version: int             # Optimistic locking counter
```

### Model Classes

| Model                | Table                   | Key Fields                                                              |
| -------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `User`               | `users`                 | email, username, password_hash, role, preferences(JSONB)                |
| `KnowledgeNode`      | `knowledge_nodes`       | slug, title, description, content, node_type, difficulty, search_vector |
| `KnowledgeEdge`      | `knowledge_edges`       | source_node_id, target_node_id, relationship_type, direction, weight    |
| `Career`             | `careers`               | slug, title, demand_level, average_salary                               |
| `Project`            | `projects`              | slug, title, difficulty, tech_stack(TEXT[])                             |
| `LearningResource`   | `learning_resources`    | node_id, url, resource_type, platform, is_free                          |
| `UserProgress`       | `user_progress`         | user_id, node_id, status, time_spent_minutes                            |
| `Bookmark`           | `bookmarks`             | user_id, node_id, notes                                                 |
| `Favorite`           | `favorites`             | user_id, node_id                                                        |
| `ActivityLog`        | `activity_logs`         | user_id, action, entity_type, entity_id, metadata                       |
| `PasswordResetToken` | `password_reset_tokens` | user_id, token_hash, expires_at, is_used                                |

---

## 6. Schemas (Pydantic)

### Directory Structure

```
schemas/
├── auth/             # LoginRequest, SignupRequest, LoginResponse, TokenResponse
├── user/             # ProfileUpdate, UserProfile, UserSettings
├── graph/            # NodeResponse, EdgeResponse, GraphStatistics
├── career/           # CareerResponse, CareerRequirement, CareerRoadmap
├── learning/         # PathRequest, PathResponse, ProgressUpdate
├── project/          # ProjectResponse, ProjectRequirement
├── search/           # SearchRequest, SearchResult, SearchHistory
├── recommendation/   # RecommendationResponse
├── skill/            # SkillResponse
├── tag/              # TagResponse
├── chat/             # ChatRequest, ChatResponse
├── common/           # Pagination, Health, ErrorResponse, Metadata
└── response.py       # success_response() helper
```

### Response Pattern

```python
def success_response(data: Any = None, message: str = "Success") -> dict:
    return {
        "success": True,
        "message": message,
        "data": data,
        "errors": None,
        "timestamp": datetime.now(UTC).isoformat(),
        "request_id": get_current_request_id(),
    }
```

---

## 7. Dependency Injection (FastAPI Dependencies)

```python
# apps/api/app/api/deps.py

async def get_db_session() -> AsyncGenerator[AsyncSession, None]
    """Provide database session."""

async def get_uow(db: AsyncSession = Depends(get_db_session)) -> UnitOfWork
    """Provide UnitOfWork with auto-close."""

async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> UUID
    """Extract and validate JWT → return user_id."""
```

---

## 8. Transactions

### Rules

1. **Repositories never commit** — `session.flush()` only
2. **UnitOfWork owns commit/rollback** — atomic transaction boundary
3. **FastAPI lifespan** owns engine initialization/startup
4. **Context manager** is the preferred pattern (`async with UnitOfWork(session) as uow`)
5. **Nested units of work** not supported — use explicit sessions for parallel operations

---

## 9. Events

### Event Bus Architecture

```python
class EventBus:
    """In-process async pub/sub with idempotency."""

    def subscribe(event_name: str, handler: EventHandler)  # Register handler
    async def publish(event_name, payload, correlation_id, idempotency_key)  # Emit event
    def subscriber_count() -> int  # Total handlers
    def clear()  # Reset all subscribers
```

### Event Envelope

```python
@dataclass
class EventEnvelope:
    name: str                    # e.g., "platform.started"
    payload: dict[str, Any]      # Event data
    metadata: EventMetadata      # event_id, correlation_id, causation_id, source, timestamp, idempotency_key
```

### Published Events

| Event                         | When                     | Payload                                 |
| ----------------------------- | ------------------------ | --------------------------------------- |
| `platform.started`            | App startup complete     | environment, app, engines, engine_count |
| `recommendation.generated.v1` | Recommendations computed | user_id, count, recommendation_ids      |
| `engine.initialized`          | Engine initialized       | engine_name, state, healthy             |
| `engine.started`              | Engine started           | engine_name, state, healthy             |

---

## 10. Caching

### Cache Backend

```python
class CacheBackend(ABC):
    """Pluggable cache interface."""
    async def get(key: str) -> Any | None
    async def set(key: str, value: Any, ttl: int)
    async def delete(key: str)
    async def clear()
```

### Implementations

| Backend           | Class           | Status                       |
| ----------------- | --------------- | ---------------------------- |
| **InMemoryCache** | `InMemoryCache` | ✅ Implemented (default)     |
| **RedisCache**    | (planned)       | ⬜ Planned for production    |
| **GraphCache**    | `GraphCache`    | ✅ Wraps graph data with TTL |

### Cache TTLs

| Data Type       | TTL    | Reason                       |
| --------------- | ------ | ---------------------------- |
| Graph metadata  | 5 min  | Relatively static            |
| Search results  | 2 min  | Freshness matters            |
| User profile    | 10 min | Rarely changes               |
| Recommendations | 15 min | Priority rules deterministic |

---

## 11. Future AI Modules

| Module                    | Status     | Description                                  |
| ------------------------- | ---------- | -------------------------------------------- |
| **EmbeddingService**      | ✅         | Pluggable providers (OpenAI, Gemini, Ollama) |
| **RAGEngine**             | ✅         | Retrieval-augmented generation pipeline      |
| **SemanticSearchService** | ✅         | Vector similarity search                     |
| **HybridSearchService**   | ✅         | FTS + semantic combined                      |
| **ContextEngine**         | ✅         | Context-aware AI responses                   |
| **ChatService**           | ✅         | Chat session management                      |
| **RankingService**        | ✅         | Result relevance scoring                     |
| **AISecurityService**     | ✅         | Prompt injection protection                  |
| **AI Observability**      | ✅         | Usage monitoring                             |
| **Vector storage**        | 🟡 Planned | Persistent vector DB (pgvector)              |
| **Personalized AI**       | ⬜ Planned | Per-user learning models                     |
| **Content generation**    | ⬜ Planned | AI-assisted learning content                 |

---

_Cross-reference: [ARCHITECTURE.md](./ARCHITECTURE.md), [DATABASE_BLUEPRINT.md](./DATABASE_BLUEPRINT.md), [API_BLUEPRINT.md](./API_BLUEPRINT.md)_
