# SV-OS Implementation Specification

## Document Status

- Version: 1.0
- Status: Implementation specification for engineering delivery
- Purpose: Remove implementation ambiguity while preserving the approved architecture
- Constraint: No architectural redesign. No new systems unless required to fill a critical omission.

---

# Part 1 — Repository Specification

## 1.1 Monorepo Structure

```text
SV-OS/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   ├── tests/
│   │   ├── alembic/
│   │   ├── scripts/
│   │   └── pyproject.toml
│   └── web/
│       ├── src/
│       ├── public/
│       ├── tests/
│       └── package.json
├── packages/
│   ├── ui/
│   ├── types/
│   ├── config/
│   ├── eslint-config/
│   └── tsconfig/
├── database/
│   ├── migrations/
│   ├── schema/
│   ├── seeds/
│   └── scripts/
├── docs/
├── scripts/
├── infrastructure/
│   ├── docker/
│   ├── k8s/
│   └── observability/
└── README.md
```

## 1.2 Package Boundaries

### apps/api

Ownership:

- Backend runtime
- Engines
- Capabilities
- API handlers
- Persistence adapters
- Event handling
- Background jobs

### apps/web

Ownership:

- UI surfaces
- Feature modules
- State management clients
- Route-level integration
- Plugin UI registration

### packages/ui

Ownership:

- Reusable UI primitives
- Shared design system components
- No domain logic

### packages/types

Ownership:

- Shared DTOs
- Shared request/response contracts
- Shared domain enums

### packages/config

Ownership:

- Shared config constants
- Feature flags
- Environment schema definitions

## 1.3 Module Ownership

### Backend module ownership

- api/: API route definitions and request parsing only
- capabilities/: orchestration workflows only
- engines/: domain logic and engine implementations
- domain/: domain entities, value objects, policies, invariants
- persistence/: repository implementations and SQL mapping
- events/: event contracts, bus registration, delivery logic
- infrastructure/: auth, telemetry, background jobs, external adapters
- config/: configuration and environment validation
- utils/: formatting, pagination, serialization helpers

### Frontend module ownership

- app/: route entry points
- features/: feature-level compositions
- components/: presentational and interactive building blocks
- hooks/: reusable effect and data-fetch logic
- providers/: global app context providers
- stores/: client-side state management
- services/: API client adapters and data mapping
- lib/: route helpers, cache helpers, plugin registration

## 1.4 Dependency Rules

- API layer may call capability services only.
- Capability layer may call engines and domain services only.
- Engines may depend on domain models and infrastructure adapters only.
- Persistence and infrastructure must not be imported by the domain layer.
- Frontend feature modules may call services and hooks only.
- UI packages must not contain business rules.

---

# Part 2 — File Specifications

## 2.1 Backend File Specifications

### apps/api/app/main.py

Purpose:

- Create and configure the FastAPI application instance.

Responsibilities:

- Register routers
- Attach middleware
- Initialize startup hooks
- Expose health endpoints

Public interfaces:

- create_app()

Dependencies:

- config
- api routers
- middleware
- startup lifecycle

Events consumed:

- None

Events published:

- None

Error handling:

- Fail fast on invalid configuration
- Return consistent error response envelopes

Performance expectations:

- App initialization should remain bounded and predictable.

Test requirements:

- Startup and route registration tests

### apps/api/app/api/deps.py

Purpose:

- Provide request-scoped dependencies for API handlers.

Responsibilities:

- Resolve auth context
- Resolve request metadata
- Resolve capability services

Public interfaces:

- get_request_context()
- get_current_user()
- get_capability_context()

Dependencies:

- config
- infrastructure.auth
- capability services

Events consumed:

- None

Events published:

- None

Error handling:

- Raise authentication and authorization errors consistently.

Performance expectations:

- Dependency resolution must be lightweight.

Test requirements:

- Dependency injection tests

### apps/api/app/api/v1/router.py

Purpose:

- Register versioned API routes.

Responsibilities:

- Include capability endpoints
- Include health endpoints
- Include admin endpoints

Public interfaces:

- build_router()

Dependencies:

- endpoint modules

Events consumed:

- None

Events published:

- None

Error handling:

- Route registration errors should fail fast.

Performance expectations:

- No runtime cost beyond registration.

Test requirements:

- Router registration tests

### apps/api/app/capabilities/<capability>/service.py

Purpose:

- Implement a top-level capability workflow.

Responsibilities:

- Orchestrate engine calls
- Enforce capability-level policy
- Emit domain events for state-changing workflows

Public interfaces:

- execute(request) -> response

Dependencies:

- engine interfaces
- domain models
- event publisher

Events consumed:

- Domain events only when needed for read-after-write context

Events published:

- Capability-specific domain events

Error handling:

- Translate engine failures to capability errors
- Preserve correlation metadata

Performance expectations:

- Must meet capability SLA defined in the API spec.

Test requirements:

- Unit tests for execution flow
- Integration tests for engine orchestration

### apps/api/app/engines/<engine>/interface.py

Purpose:

- Define the engine contract.

Responsibilities:

- Establish public methods
- Document expected behavior and lifecycle

Public interfaces:

- Engine interface class

Dependencies:

- None beyond domain types

Events consumed:

- Engine-specific subscribed events

Events published:

- Engine-specific emitted events

Error handling:

- Raise typed domain errors and engine-specific exceptions.

Performance expectations:

- Interface overhead must be negligible.

Test requirements:

- Contract tests

### apps/api/app/engines/<engine>/implementation.py

Purpose:

- Implement the engine behavior.

Responsibilities:

- Execute workflows
- Manage internal services
- Handle retries and state transitions

Public interfaces:

- Engine implementation class

Dependencies:

- domain models
- persistence ports
- event publisher
- config

Events consumed:

- Defined per engine

Events published:

- Defined per engine

Error handling:

- Handle input validation failures, dependency failures, and retries.

Performance expectations:

- Must meet engine-level latency targets.

Test requirements:

- Engine unit tests
- Integration tests

### apps/api/app/engines/<engine>/dto.py

Purpose:

- Define request and response DTOs for engine operations.

Responsibilities:

- Serialize and deserialize engine-level data
- Preserve version-safe contracts

Public interfaces:

- DTO classes

Dependencies:

- packages/types

Events consumed:

- None

Events published:

- None

Error handling:

- Validation errors should be explicit and typed.

Performance expectations:

- DTO creation should be lightweight.

Test requirements:

- Serialization and validation tests

### apps/api/app/engines/<engine>/commands.py

Purpose:

- Define commands for write-oriented engine operations.

Responsibilities:

- Encapsulate mutation intent
- Carry validation payloads and metadata

Public interfaces:

- Command classes

Dependencies:

- domain models
- dto

Events consumed:

- None

Events published:

- None

Error handling:

- Invalid command payloads should fail early.

Performance expectations:

- Minimal overhead.

Test requirements:

- Command validation tests

### apps/api/app/engines/<engine>/queries.py

Purpose:

- Define queries for read-oriented engine operations.

Responsibilities:

- Encapsulate read requests
- Carry filters and selection criteria

Public interfaces:

- Query classes

Dependencies:

- dto

Events consumed:

- None

Events published:

- None

Error handling:

- Invalid query filters should be rejected.

Performance expectations:

- Lightweight and deterministic.

Test requirements:

- Query mapping tests

### apps/api/app/engines/<engine>/events.py

Purpose:

- Define engine-specific events and event payload schemas.

Responsibilities:

- Name and document emitted events
- Provide payload models

Public interfaces:

- Event classes

Dependencies:

- packages/types

Events consumed:

- None

Events published:

- Engine-specific event classes

Error handling:

- Event serialization failures should be logged and retried.

Performance expectations:

- Event payload size should remain bounded.

Test requirements:

- Event schema tests

### apps/api/app/persistence/repositories/<entity>.py

Purpose:

- Implement persistence access for a domain entity or aggregate.

Responsibilities:

- Translate between domain objects and database rows
- Expose repository methods

Public interfaces:

- Repository class methods

Dependencies:

- domain models
- persistence models
- config

Events consumed:

- None

Events published:

- None

Error handling:

- Convert persistence failures into domain-safe exceptions.

Performance expectations:

- Must support indexed read paths and bulk operations where applicable.

Test requirements:

- Repository unit tests
- Integration tests with DB fixtures

### apps/api/app/events/contracts/<event>.py

Purpose:

- Define event schemas and versioned payloads.

Responsibilities:

- Standardize event structure
- Preserve backward compatibility

Public interfaces:

- Event schema classes

Dependencies:

- packages/types

Events consumed:

- None

Events published:

- Defined event schemas

Error handling:

- Reject invalid payloads during dispatch.

Performance expectations:

- Lightweight serialization only.

Test requirements:

- Contract tests

### apps/api/app/infrastructure/auth/*.py

Purpose:

- Implement authentication and authorization adapters.

Responsibilities:

- Parse identity context
- Enforce access rules
- Return user and role metadata

Public interfaces:

- authenticate_request()
- authorize_action()

Dependencies:

- config
- persistence

Events consumed:

- None

Events published:

- None

Error handling:

- Return explicit unauthorized or forbidden errors.

Performance expectations:

- Must avoid blocking on I/O where possible.

Test requirements:

- Authorization tests

### apps/api/app/infrastructure/background_jobs/*.py

Purpose:

- Schedule and run asynchronous work.

Responsibilities:

- Manage import jobs and long-running tasks
- Report progress and status

Public interfaces:

- enqueue_job()
- get_job_status()

Dependencies:

- persistence
- events

Events consumed:

- ImportStarted, ImportCompleted, ImportFailed

Events published:

- ImportStarted, ImportCompleted, ImportFailed

Error handling:

- Mark failed jobs and preserve logs.

Performance expectations:

- Long-running operations should be non-blocking.

Test requirements:

- Background job tests

## 2.2 Frontend File Specifications

### apps/web/src/app/<route>/page.tsx

Purpose:

- Define route entrypoint for feature pages.

Responsibilities:

- Compose page-level sections
- Apply permissions and layout wrappers

Public interfaces:

- Page component export

Dependencies:

- feature modules
- layout components

Events consumed:

- None

Events published:

- None

Error handling:

- Render error boundaries and fallback states.

Performance expectations:

- Route components should remain lightweight and composition-focused.

Test requirements:

- Route render tests

### apps/web/src/features/<feature>/index.ts

Purpose:

- Export feature module entrypoints.

Responsibilities:

- Expose feature components and hooks

Public interfaces:

- Feature exports

Dependencies:

- components
- hooks
- services

Events consumed:

- None

Events published:

- None

Error handling:

- Surface feature-level fallback states.

Performance expectations:

- Should not perform heavy work on import.

Test requirements:

- Feature module export tests

### apps/web/src/services/<service>.ts

Purpose:

- Adapt frontend API calls to capability contracts.

Responsibilities:

- Map frontend inputs to API requests
- Normalize API responses

Public interfaces:

- service methods

Dependencies:

- lib/api
- packages/types

Events consumed:

- None

Events published:

- None

Error handling:

- Translate HTTP failures to user-facing errors.

Performance expectations:

- Use cached data where applicable.

Test requirements:

- Service unit tests

### apps/web/src/hooks/use<feature>.ts

Purpose:

- Provide reusable data-fetch hooks.

Responsibilities:

- Manage loading, error, and caching behavior

Public interfaces:

- Hook exports

Dependencies:

- services
- query client

Events consumed:

- None

Events published:

- None

Error handling:

- Return stable error state and refetch semantics.

Performance expectations:

- Avoid unnecessary re-fetches.

Test requirements:

- Hook behavior tests

### apps/web/src/stores/<store>.ts

Purpose:

- Manage client-side UI state.

Responsibilities:

- Track viewport, selection, filters, and transient UI state

Public interfaces:

- store actions and selectors

Dependencies:

- None or local helpers

Events consumed:

- None

Events published:

- None

Error handling:

- Keep store state valid and recoverable.

Performance expectations:

- Must remain responsive for interactive UI.

Test requirements:

- Store unit tests

---

# Part 3 — Engine Implementation Specifications

## 3.1 Common Engine Structure

Each engine module must contain:

- interface.py
- implementation.py
- dto.py
- commands.py (where write operations exist)
- queries.py (where read operations exist)
- events.py (where events are emitted or consumed)
- services/ for internal helpers
- config.py
- tests/

## 3.2 Graph Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- queries.py
- commands.py
- events.py
- services/adjacency.py
- services/cache.py
- services/snapshot.py
- config.py

Public API:

- get_node
- get_nodes
- get_edge
- get_neighbors
- get_subgraph
- node_exists
- edge_exists
- count
- refresh

Internal workflow:

1. Load nodes and edges from persistence on initialization.
2. Maintain in-memory adjacency structures.
3. Apply events for graph mutation.
4. Refresh from persistence on graph reload events.

Lifecycle:

- initialize() loads graph snapshot
- health() reports readiness
- shutdown() flushes or releases state

Configuration:

- cache size
- eager load toggle
- max subgraph depth

Cache strategy:

- In-memory graph cache for hot lookups
- Snapshot cache invalidated on graph mutation events

Event subscriptions:

- NodeCreated
- NodeUpdated
- NodeDeleted
- EdgeCreated
- EdgeDeleted
- GraphReloaded

Event publications:

- NodeCreated
- NodeUpdated
- NodeDeleted
- EdgeCreated
- EdgeDeleted
- GraphReloaded

Failure handling:

- Reject invalid mutations
- Rebuild from snapshot if cache becomes inconsistent

Extension points:

- pluggable graph backends
- alternate adjacency strategies

## 3.3 Knowledge Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- queries.py
- commands.py
- events.py
- services/content.py
- services/metadata.py
- config.py

Public API:

- get_content
- get_content_blocks
- get_categories
- get_nodes_by_category
- get_tags
- get_resources
- get_skills_for_node
- get_assessments_for_node

Internal workflow:

1. Resolve node content from persistence.
2. Normalize content into typed blocks.
3. Populate cache for repeated access.
4. Reconcile updates from content events.

Lifecycle:

- initialize() loads metadata and cache indexes
- health() checks read availability
- shutdown() flushes ephemeral cache

Configuration:

- content cache size
- block indexing policy

Cache strategy:

- Node-level LRU cache
- Invalidation on content updates

Event subscriptions:

- NodeCreated
- NodeUpdated
- NodeContentUpdated

Event publications:

- NodeContentUpdated
- ContentBlockAdded
- ContentBlockRemoved

Failure handling:

- Return empty or typed empty results for missing content
- Log malformed content structures

Extension points:

- Custom content block providers

## 3.4 Traversal Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/traversal.py
- services/queue.py
- config.py

Public API:

- bfs
- dfs
- shortest_path
- multi_source_bfs
- reachable_nodes
- detect_cycles
- find_connected_components

Internal workflow:

1. Read graph snapshot or adjacency data.
2. Apply traversal algorithm with depth limits.
3. Return deterministic results.

Lifecycle:

- Stateless runtime engine
- No long-lived mutable state except optional cache

Configuration:

- max depth
- max nodes per traversal
- edge type filters

Cache strategy:

- Optional traversal result cache keyed by query fingerprint

Event subscriptions:

- None

Event publications:

- None

Failure handling:

- Return empty or not-found result for unreachable targets
- Respect depth and node count budgets

Extension points:

- Additional traversal algorithms

## 3.5 Event Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- bus.py
- services/delivery.py
- services/idempotency.py
- services/dead_letter.py
- config.py

Public API:

- publish
- subscribe
- replay
- get_history
- retry_dead_letter

Internal workflow:

1. Validate event envelope.
2. Persist event in event store.
3. Deliver to subscribers.
4. Retry on failure and collect dead letters.

Lifecycle:

- initialize() sets up event store and subscriber registry
- health() reports event bus status
- shutdown() flushes or stops delivery

Configuration:

- retry count
- backoff policy
- dead-letter retention

Cache strategy:

- In-memory subscription registry and recent delivery cache

Event subscriptions:

- None

Event publications:

- EventPublished
- EventDelivered
- EventFailed

Failure handling:

- Retry with backoff
- Dead-letter after max retries
- Skip duplicates based on event_id

Extension points:

- Alternate transport adapters

## 3.6 State Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- commands.py
- queries.py
- events.py
- services/state_machine.py
- services/velocity.py
- services/streak.py
- config.py

Public API:

- get_learner_state
- get_node_state
- transition
- set_confidence
- get_velocity
- get_streak

Internal workflow:

1. Read learner state from persistence.
2. Validate transition rules.
3. Apply state update.
4. Emit transition events.

Lifecycle:

- initialize() loads state policy metadata
- health() checks state persistence

Configuration:

- state retention policy
- transition thresholds

Cache strategy:

- Learner state cache with invalidation on transitions

Event subscriptions:

- AssessmentSubmitted
- SimulatorCompleted
- PathGenerated
- ConfidenceUpdated

Event publications:

- StateTransitioned
- ConfidenceUpdated
- LearningMilestoneReached

Failure handling:

- Reject invalid transitions
- Reconcile state from event history if required

Extension points:

- Additional transition policies

## 3.7 Dependency Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/prerequisites.py
- services/blockers.py
- config.py

Public API:

- get_prerequisites
- get_dependents
- get_unlocks
- find_blockers
- is_ready

Internal workflow:

1. Read dependency graph relations.
2. Compute ancestor or descendant chain.
3. Evaluate readiness using learner state.

Lifecycle:

- Stateless and query-driven

Configuration:

- max depth
- cache TTL

Cache strategy:

- Dependency chain cache per node

Event subscriptions:

- None

Event publications:

- None

Failure handling:

- Return empty blocker sets when data is incomplete

Extension points:

- Additional dependency reasoning strategies

## 3.8 Validation Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/integrity.py
- services/health.py
- services/incremental.py
- config.py

Public API:

- validate_node
- validate_edge
- validate_full_graph
- validate_import
- compute_health_score

Internal workflow:

1. Validate node and edge payloads.
2. Apply incremental checks for mutations.
3. Produce validation report and issues.
4. Emit warnings or failure events if needed.

Lifecycle:

- initialize() loads validation rules
- background validation runs when enabled

Configuration:

- strictness profile
- validation thresholds

Cache strategy:

- Validation cache with short TTL

Event subscriptions:

- EdgeCreated
- EdgeDeleted
- NodeCreated
- GraphImported

Event publications:

- ValidationWarning
- ValidationFailed
- HealthScoreComputed

Failure handling:

- Return typed issues and fail import pipelines when necessary

Extension points:

- Rule plugins and custom validators

## 3.9 Search Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/indexer.py
- services/ranking.py
- config.py

Public API:

- search
- suggest
- search_by_type
- search_by_category
- get_trending

Internal workflow:

1. Parse and normalize query.
2. Query indexed content and metadata.
3. Apply ranking and filters.
4. Return paged results.

Lifecycle:

- initialize() builds index metadata
- refresh() updates index from source content

Configuration:

- index refresh interval
- max result count

Cache strategy:

- Search result cache with short TTL
- Trending cache with longer TTL

Event subscriptions:

- NodeCreated
- NodeContentUpdated
- NodeDeleted

Event publications:

- SearchRecorded

Failure handling:

- Fall back to deterministic ranking if index is stale

Extension points:

- Alternate ranking plugins

## 3.10 Recommendation Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/readiness.py
- services/review.py
- services/explanation.py
- config.py

Public API:

- get_next_concept
- get_next_n_concepts
- get_review_candidates
- get_daily_plan

Internal workflow:

1. Read learner state and current goal context.
2. Evaluate candidate nodes by readiness and dependency alignment.
3. Rank results deterministically.
4. Produce explanation payloads.

Lifecycle:

- Stateless over the request context

Configuration:

- recommendation weights
- review cadence policy

Cache strategy:

- Short-lived recommendation cache keyed by learner state version

Event subscriptions:

- StateTransitioned
- ConfidenceUpdated
- AssessmentSubmitted

Event publications:

- RecommendationGenerated

Failure handling:

- Return empty recommendations if the input context is insufficient

Extension points:

- Additional scoring strategies

## 3.11 Learning Path Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/path_builder.py
- services/optimizer.py
- services/milestones.py
- config.py

Public API:

- generate_path
- generate_career_path
- optimize_path
- replan_path
- estimate_completion

Internal workflow:

1. Resolve learning goals from learner state and target.
2. Generate path steps using dependency graph.
3. Optimize and split into milestones.
4. Emit path events.

Lifecycle:

- Stateless request engine with cached plan snapshots

Configuration:

- max path length
- optimization strategy definitions

Cache strategy:

- Path snapshot cache keyed by learner goal and version

Event subscriptions:

- CareerGoalUpdated
- StateTransitioned

Event publications:

- PathGenerated
- PathReplanned

Failure handling:

- Return a partial or empty path if a goal cannot be satisfied

Extension points:

- Alternate planners and optimization strategies

## 3.12 Career Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/comparison.py
- services/gap.py
- config.py

Public API:

- get_career
- compare_careers
- get_career_gap
- recommend_career

Internal workflow:

1. Load career definitions and requirements.
2. Compare requirements with learner state.
3. Return ordered career insights.

Lifecycle:

- Read-heavy and mostly stateless

Configuration:

- career taxonomy metadata

Cache strategy:

- Career definition cache and comparison cache

Event subscriptions:

- None

Event publications:

- CareerGoalUpdated
- CareerComparisonRequested

Failure handling:

- Return empty comparison if career definitions are incomplete

Extension points:

- Additional career ranking policies

## 3.13 Assessment Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/scoring.py
- services/rubric.py
- config.py

Public API:

- get_assessment
- submit_assessment
- grade_assessment

Internal workflow:

1. Load assessment metadata.
2. Validate answers and submission context.
3. Apply scoring policy.
4. Emit result event.

Lifecycle:

- Request-driven with persistence-backed result storage

Configuration:

- scoring thresholds
- rubric mappings

Cache strategy:

- Assessment definition cache

Event subscriptions:

- None

Event publications:

- AssessmentSubmitted
- AssessmentGraded

Failure handling:

- Reject malformed submissions and missing rubrics

Extension points:

- Alternative assessment types and scoring rules

## 3.14 Simulator Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/scenario.py
- services/outcomes.py
- config.py

Public API:

- run_simulator
- get_simulator_result

Internal workflow:

1. Load scenario definition.
2. Execute scenario logic.
3. Collect outcome and score.
4. Emit simulator completion event.

Lifecycle:

- Request-driven and plugin-backed

Configuration:

- simulator registry
- timeout policy

Cache strategy:

- Scenario metadata cache

Event subscriptions:

- None

Event publications:

- SimulatorCompleted

Failure handling:

- Return explicit failure state for invalid or timed-out simulator runs

Extension points:

- Simulator plugin adapters

## 3.15 Import Engine

Internal module structure:

- interface.py
- implementation.py
- dto.py
- services/parser.py
- services/validator.py
- services/transformer.py
- services/builder.py
- services/rollback.py
- config.py

Public API:

- start_import
- dry_run_import
- commit_import
- rollback_import

Internal workflow:

1. Parse input payload.
2. Validate structure and semantics.
3. Transform into graph updates.
4. Build graph changes and create version snapshot.
5. Commit or rollback based on validation outcome.

Lifecycle:

- Long-running job lifecycle with progress reporting

Configuration:

- batch size
- rollback mode
- dry-run policy

Cache strategy:

- Import job state cache only

Event subscriptions:

- None

Event publications:

- ImportStarted
- ImportCompleted
- ImportFailed
- ImportRolledBack

Failure handling:

- Halt invalid import jobs and emit failure events
- Support rollback and version reversion

Extension points:

- Importer plugins and source adapters

---

# Part 4 — Domain Model Specifications

## 4.1 KnowledgeNode

Fields:

- id
- slug
- title
- node_type
- difficulty
- description
- metadata
- created_at
- updated_at

Validation rules:

- slug must be unique
- title must be non-empty
- node_type must be known
- difficulty must be in the approved range

Invariants:

- Every node must have a stable identity
- Every node must belong to a valid node type

Serialization:

- JSON-safe representation with stable field ordering

Relationships:

- incoming/outgoing edges
- attached content blocks
- linked skills, assessments, resources

Versioning considerations:

- Node changes should be versioned and evented

## 4.2 KnowledgeEdge

Fields:

- source_id
- target_id
- edge_type
- metadata
- version

Validation rules:

- Source and target must exist
- Edge type must be known
- Duplicate edges should be rejected

Invariants:

- Edge direction matters
- Edge uniqueness is based on source, target, and type

Serialization:

- Normalize to a deterministic edge payload

Relationships:

- Connects graph nodes

Versioning considerations:

- Edge changes should be versioned and validated

## 4.3 Career

Fields:

- id
- slug
- title
- seniority_levels
- requirements
- metadata

Validation rules:

- Career slug must be unique
- Requirements must reference valid nodes

Invariants:

- Career progression must be consistent

Serialization:

- Stable career contract payload

Relationships:

- Maps to nodes across levels

Versioning considerations:

- Career updates should be event-driven and replayable

## 4.4 Skill

Fields:

- id
- slug
- title
- description
- category

Validation rules:

- Title and slug must be present
- Category must be known

Invariants:

- Skills represent cross-cutting competencies

Serialization:

- Deterministic JSON representation

Relationships:

- Mapped to nodes

Versioning considerations:

- Skill mapping updates should be versioned

## 4.5 ContentBlock

Fields:

- id
- node_id
- block_type
- body
- metadata

Validation rules:

- block_type must be known
- node_id must reference a node

Invariants:

- Content blocks must remain attached to a node

Serialization:

- Stable and schema-aware

Relationships:

- Attached to node content

Versioning considerations:

- Block updates should be evented and auditable

## 4.6 Assessment

Fields:

- id
- node_id
- rubric
- scoring_policy
- metadata

Validation rules:

- Rubric must be valid
- Scoring policy must be known

Invariants:

- Assessment must be linked to a valid node or domain object

Serialization:

- Deterministic payload version

Relationships:

- Assessed through learner submissions

Versioning considerations:

- Assessment definition changes should be versioned

## 4.7 LearningState

Fields:

- learner_id
- node_id
- state
- confidence
- last_transition_at
- history

Validation rules:

- state must be in the valid state machine set
- confidence must be within range

Invariants:

- State transitions must follow the documented state machine

Serialization:

- Serialized as a compact state snapshot

Relationships:

- Links learner to graph nodes

Versioning considerations:

- State transitions should be append-only with event history

## 4.8 Recommendation

Fields:

- id
- learner_id
- target_node_id
- reason
- score
- metadata

Validation rules:

- Recommendation must have a target and reason
- Score must be numeric and bounded

Invariants:

- Recommendation is derived from deterministic ranking

Serialization:

- Stable response envelope

Relationships:

- Linked to learner state and graph context

Versioning considerations:

- Generated recommendations should be revocable or invalidated

## 4.9 Roadmap

Fields:

- id
- learner_id
- goal_id
- milestones
- metadata

Validation rules:

- Goal must reference a valid node or career
- Milestones must be ordered

Invariants:

- Roadmap must be executable and ordered

Serialization:

- Deterministic roadmap payload

Relationships:

- Contains milestones

Versioning considerations:

- Roadmap revisions should be versioned and evented

## 4.10 GraphVersion

Fields:

- id
- version
- created_at
- source
- metadata

Validation rules:

- Version must be unique and monotonic within import scope

Invariants:

- Graph version is immutable once committed

Serialization:

- Export-safe metadata payload

Relationships:

- Links to import jobs and validation reports

Versioning considerations:

- Must be preserved for rollback and audit purposes

## 4.11 ValidationReport

Fields:

- id
- graph_version_id
- issues
- health_score
- generated_at

Validation rules:

- health_score must be in the defined range

Invariants:

- Reports must be associated with a valid graph version

Serialization:

- Stable and structured JSON

Relationships:

- Attached to import jobs and graph versions

Versioning considerations:

- Keep immutable after creation

---

# Part 5 — Capability and API Specifications

## 5.1 Capability Execution Contract

Every capability service must:

- Accept a typed request DTO
- Produce a typed response DTO
- Validate inputs before engine execution
- Record correlation metadata
- Emit events for state changes

## 5.2 Capability: Generate Roadmap

Request schema:

- learner_id
- career_id
- target_level
- constraints

Response schema:

- roadmap_id
- milestones
- estimated_duration
- explanation

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- unauthorized
- invalid_target
- unreachable_goal

Events:

- PathGenerated
- PathReplanned

Performance SLA:

- p95 < 600ms

Cache behavior:

- Short-lived cache keyed by learner and goal version

## 5.3 Capability: Recommend Next Concept

Request schema:

- learner_id
- context
- goal_id

Response schema:

- recommendation
- rationale
- readiness
- alternatives

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- invalid_context
- no_candidate

Events:

- RecommendationGenerated

Performance SLA:

- p95 < 400ms

Cache behavior:

- Cache for 30 seconds

## 5.4 Capability: Compare Careers

Request schema:

- learner_id
- career_ids

Response schema:

- comparison
- shared_nodes
- unique_nodes
- gaps

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- invalid_career_ids

Events:

- CareerComparisonRequested

Performance SLA:

- p95 < 350ms

Cache behavior:

- Cache for 1 hour

## 5.5 Capability: Find Skill Gap

Request schema:

- learner_id
- career_id or milestone

Response schema:

- gaps
- prioritized_nodes
- blockers

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- missing_target

Events:

- CareerGoalUpdated

Performance SLA:

- p95 < 400ms

Cache behavior:

- Cache for 5 minutes

## 5.6 Capability: Generate Revision Plan

Request schema:

- learner_id
- available_hours
- horizon

Response schema:

- revision_items
- schedule

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- no_candidates

Events:

- RecommendationGenerated

Performance SLA:

- p95 < 400ms

Cache behavior:

- Cache for 2 minutes

## 5.7 Capability: Explain Dependency

Request schema:

- learner_id
- source_node_id
- target_node_id

Response schema:

- explanation
- chain
- blockers

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- invalid_nodes

Events:

- None

Performance SLA:

- p95 < 300ms

Cache behavior:

- Cache for 1 hour

## 5.8 Capability: Generate Semester Plan

Request schema:

- learner_id
- semester_duration
- goals

Response schema:

- milestones
- weekly_plan

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- invalid_goals

Events:

- PathGenerated

Performance SLA:

- p95 < 700ms

Cache behavior:

- Cache for 5 minutes

## 5.9 Capability: Find Hidden Relationships

Request schema:

- node_id
- depth
- relation_types

Response schema:

- relationships
- confidence

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- invalid_request

Events:

- None

Performance SLA:

- p95 < 500ms

Cache behavior:

- Cache for 10 minutes

## 5.10 Capability: Generate Graph Visualization

Request schema:

- focus_node_id
- depth
- filters

Response schema:

- subgraph
- metadata

Authorization:

- authenticated learner

Idempotency:

- request_id-based safe retry

Errors:

- invalid_request

Events:

- None

Performance SLA:

- p95 < 400ms

Cache behavior:

- Cache for 10 minutes

---

# Part 6 — Frontend Specifications

## 6.1 Routes

- /
- /dashboard
- /explore
- /careers
- /roadmap
- /simulator
- /assessment
- /search
- /tutor
- /settings
- /admin/imports

## 6.2 Pages

Each page must define:

- route entrypoint
- feature composition
- loading boundaries
- error boundaries
- permissions

## 6.3 Components

- layout components
- feature components
- shared UI components
- graph visualization components
- search interface components
- assessment form components

## 6.4 Feature Modules

- graph-visualization
- knowledge-explorer
- career-explorer
- learning-dashboard
- simulator-hub
- assessment-center
- ai-tutor
- roadmap
- settings

## 6.5 State Management

- React Query for server state
- Zustand for UI state
- React Hook Form + Zod for forms

## 6.6 Data Fetching

- All data fetching should go through typed service adapters
- Query keys must follow a stable naming convention
- Mutations should use optimistic updates where appropriate

## 6.7 Error States

- Empty state
- Error state
- Retry state
- Permission denied state

## 6.8 Loading States

- Skeletons for route-level content
- Inline loading for feature subcomponents
- Deferred loading for graph and simulator modules

## 6.9 Permissions

- Learner: access personal features and graph exploration
- Admin: access import and validation operations
- Public: access marketing and auth entrypoints

---

# Part 7 — Plugin Specifications

## 7.1 Registration

Plugins must be discovered through a manifest and registered at startup.

## 7.2 Discovery

- Each plugin provides a manifest with name, version, interfaces, and entrypoint.

## 7.3 Lifecycle

- initialize()
- health()
- shutdown()

## 7.4 Dependency Injection

- Plugins must receive configuration and optional service adapters through a typed container.

## 7.5 Version Compatibility

- Plugin version must be compatible with the host contract version.
- Breaking interface changes require a new versioned plugin contract.

---

# Part 8 — Testing Specifications

## 8.1 Unit Tests

Required for:

- engines
- domain policies
- validation rules
- capability orchestration helpers

## 8.2 Integration Tests

Required for:

- API -> capability -> engine
- engine -> persistence
- event delivery and replay

## 8.3 Contract Tests

Required for:

- API request/response envelope
- event payloads
- plugin manifest contracts

## 8.4 Graph Validation Tests

Required for:

- cycle detection
- dependency validity
- import validation
- rollback correctness

## 8.5 Performance Benchmarks

Required for:

- traversal performance
- recommendation execution
- search latency
- import throughput

## 8.6 End-to-End Tests

Required for:

- roadmap generation
- next concept recommendation
- career comparison
- assessment submission
- import and rollback flow

---

# Part 9 — Build Sequence

## Milestone 1 — Foundation

Scope:

- repository layout
- backend and frontend shells
- shared packages
- health endpoints

Deliverables:

- buildable monorepo with health checks

Acceptance criteria:

- app starts locally
- basic API and UI load

Dependencies:

- none

## Milestone 2 — Core Graph and Persistence

Scope:

- graph engine
- knowledge engine
- persistence schema and repositories

Deliverables:

- nodes and edges viewable and storable

Acceptance criteria:

- graph read/write works end to end

Dependencies:

- milestone 1

## Milestone 3 — Validation and Events

Scope:

- validation engine
- event engine
- event store and broker patterns

Deliverables:

- validated mutations and reliable event flow

Acceptance criteria:

- invalid mutations are rejected and events are delivered

Dependencies:

- milestone 2

## Milestone 4 — Learner State and Dependencies

Scope:

- state engine
- dependency engine
- learner state persistence

Deliverables:

- state transitions and dependency readiness logic

Acceptance criteria:

- learner progress and readiness are persisted and retrievable

Dependencies:

- milestone 3

## Milestone 5 — Recommendation and Pathing

Scope:

- recommendation engine
- learning path engine
- roadmap and next-concept capabilities

Deliverables:

- personalized recommendations and roadmaps

Acceptance criteria:

- next concept and roadmap capabilities work end to end

Dependencies:

- milestone 4

## Milestone 6 — Career, Assessment, and Search

Scope:

- career engine
- assessment engine
- search engine

Deliverables:

- career comparison, assessment submission, search functionality

Acceptance criteria:

- these flows work end to end

Dependencies:

- milestone 5

## Milestone 7 — Frontend Experiences

Scope:

- explorer pages
- roadmap UI
- simulator and assessment pages

Deliverables:

- user-facing workflows

Acceptance criteria:

- core learner experiences are usable

Dependencies:

- milestone 6

## Milestone 8 — Import and Administration

Scope:

- import engine
- admin APIs
- dry-run and rollback

Deliverables:

- import pipeline and admin controls

Acceptance criteria:

- imports validate, commit, and rollback

Dependencies:

- milestone 7

## Milestone 9 — Plugin and Extension Layer

Scope:

- plugin registry
- plugin lifecycle
- extension manifests

Deliverables:

- pluggable engine and UI integrations

Acceptance criteria:

- plugins can be discovered and activated

Dependencies:

- milestone 8

## Milestone 10 — Hardening and Scale Readiness

Scope:

- performance tuning
- observability
- security hardening
- load testing

Deliverables:

- release-ready system

Acceptance criteria:

- performance targets and operational checks are met

Dependencies:

- milestone 9

---

# Part 10 — Developer Guidelines

## 10.1 Coding Standards

- Prefer explicit, typed contracts over loose conventions
- Keep domain logic in engines and policies
- Keep API handlers thin
- Preserve deterministic behavior in core logic

## 10.2 Package Dependency Rules

- Do not introduce cross-layer shortcuts
- No direct persistence imports in capabilities
- No direct API imports in engines

## 10.3 Event Naming Conventions

- Use past-tense domain event names
- Include version and correlation metadata
- Ensure event payloads are additive and backward compatible

## 10.4 Documentation Standards

- Every public module must have a short purpose statement
- Every capability and engine must document its inputs, outputs, and side effects
- Public contracts must be kept in sync with implementation

## 10.5 Review Checklist

- Does the change stay within the approved architecture?
- Are domain rules preserved?
- Are tests added for behavior changes?
- Are events and persistence changes documented?
- Are performance and error handling expectations covered?

---

## Final Note

This document provides the implementation-level specification needed to build SV-OS without making new architectural decisions. It remains faithful to the frozen architecture and is intended as the engineering contract for implementation teams.
