# SV-OS Architecture v1.0 Final

## Purpose

This document is the single authoritative architecture definition for SV-OS. It is the only architecture specification that applies to implementation. All implementation work must follow this document exactly.

This document resolves prior terminology, structural, dependency, and ownership conflicts by selecting one definitive architecture and freezing it.

---

## 1. Architectural Principles

The following principles are mandatory and binding.

1. The knowledge graph is the source of truth.
2. Engines own business logic.
3. Capabilities orchestrate engines.
4. APIs expose capabilities, not CRUD operations.
5. Every mutation is validated before persistence.
6. Every write publishes an event.
7. Engines never call UI.
8. Capabilities never contain business logic.
9. Engines never access another engine's persistence directly.
10. No circular dependencies are allowed.
11. Read-only queries may be direct, but write flows must use the event backbone.
12. The architecture is deterministic by default.

---

## 2. Canonical System Overview

SV-OS is a knowledge operating system for computer science learning.

It consists of:

- a web application for learner and educator experiences
- a backend application for engine execution, capability orchestration, persistence, events, and import workflows
- shared packages for UI, shared types, and configuration
- a PostgreSQL-backed persistence layer
- a domain event system for cross-engine coordination

---

## 3. Canonical Repository Structure

The repository structure is fixed.

```text
SV-OS/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   ├── tests/
│   │   ├── alembic/
│   │   └── pyproject.toml
│   └── web/
│       ├── src/
│       ├── public/
│       └── tests/
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
└── README.md
```

---

## 4. Canonical Backend Architecture

### 4.1 Backend Package Structure

The backend package structure is fixed.

```text
apps/api/app/
├── api/
│   ├── deps.py
│   └── v1/
│       ├── router.py
│       └── endpoints/
├── capabilities/
├── engines/
├── domain/
├── persistence/
├── events/
├── infrastructure/
├── middleware/
├── startup/
├── telemetry/
├── config/
├── exceptions/
├── utils/
└── main.py
```

### 4.2 Backend Layer Responsibilities

- API layer: route requests, parse input, call capabilities, return responses.
- Capability layer: orchestrate engines and produce capability results.
- Engine layer: implement domain logic and deterministic behavior.
- Domain layer: define domain objects, policies, and invariants.
- Persistence layer: implement repository adapters and persistence mapping.
- Events layer: define events, publish events, handle delivery and retry.
- Infrastructure layer: authentication, background workers, telemetry, external adapters.
- Middleware layer: request context, security, tracing, and error handling.

### 4.3 Backend Dependency Direction

The dependency direction is fixed.

```text
API -> Capabilities -> Engines -> Domain
                 \-> Persistence
                 \-> Infrastructure
                 \-> Events
```

The following rules are mandatory:

- API never imports persistence directly.
- Capabilities never contain business logic.
- Engines never import UI code.
- Domain never imports infrastructure or persistence directly.
- Persistence never imports API code.

### 4.4 Backend Initialization Order

The initialization order is fixed.

1. Configuration
2. Telemetry and logging
3. Persistence connection
4. Event bus and event store
5. Engine registry
6. Engine initialization
7. Capability registration
8. API router registration
9. Startup health checks

### 4.5 Backend Startup Order

The startup order is fixed.

1. Load configuration.
2. Initialize logging and telemetry.
3. Initialize persistence.
4. Initialize event infrastructure.
5. Initialize engines.
6. Initialize background workers.
7. Register routes and capability handlers.
8. Run health checks.

### 4.6 Backend Shutdown Order

The shutdown order is fixed.

1. Stop background workers.
2. Stop event delivery workers.
3. Flush pending events.
4. Stop engine operations.
5. Close persistence connections.
6. Close telemetry and logging resources.

### 4.7 Backend Background Workers

The following workers are fixed.

- Event worker: processes domain events.
- Import worker: processes import jobs.
- Search index worker: refreshes search index data.
- Simulator worker: processes simulator runs.

### 4.8 Backend Infrastructure Boundaries

- Authentication and authorization belong to infrastructure.
- Telemetry, metrics, tracing, and health checks belong to infrastructure and telemetry.
- Background jobs belong to infrastructure.
- External service adapters belong to infrastructure.

### 4.9 Backend Persistence Boundaries

- Graph persistence is owned by the Graph Engine.
- Knowledge content persistence is owned by the Knowledge Engine.
- Learner state persistence is owned by the State Engine.
- Validation reports are owned by the Validation Engine.
- Import job state is owned by the Import Engine.
- Event history is owned by the Event Engine.

### 4.10 Backend Event Boundaries

- Only the Event Engine publishes and consumes core domain events.
- Engines publish events for state changes.
- Engines do not call another engine for write operations.
- Event consumers must be idempotent.

### 4.11 Backend Capability Boundaries

Capabilities are fixed to the following responsibilities.

- Roadmap capability: generate learning roadmaps.
- Recommendation capability: generate next-step recommendations.
- Career capability: compare careers and analyze skill gaps.
- Assessment capability: submit and evaluate assessments.
- Search capability: resolve search requests.
- Import capability: manage import workflows.
- Graph capability: expose graph exploration operations.

### 4.12 Backend Engine Boundaries

Engines own only the logic for their domain. They do not own API routes, UI, or persistence outside their designated scope.

---

## 5. Canonical Frontend Architecture

### 5.1 Frontend Package Structure

The frontend package structure is fixed.

```text
apps/web/src/
├── app/
├── components/
├── features/
├── hooks/
├── providers/
├── stores/
├── services/
├── lib/
├── types/
└── utils/
```

### 5.2 Frontend Pages

The frontend pages are fixed.

- Home
- Dashboard
- Explore
- Graph
- Roadmap
- Career
- Assessment
- Search
- Simulator
- Settings
- Admin Import

### 5.3 Frontend Features

The frontend features are fixed.

- Graph visualization
- Knowledge explorer
- Learning dashboard
- Roadmap experience
- Career explorer
- Assessment center
- Search experience
- Simulator hub
- Admin import experience

### 5.4 Frontend Stores

The frontend stores are fixed.

- graphStore
- learnerStore
- uiStore
- searchStore
- assessmentStore
- importStore

### 5.5 Frontend Hooks

The frontend hooks are fixed.

- useGraphData
- useLearnerState
- useRecommendations
- useRoadmap
- useCareerMatches
- useAssessment
- useSearch
- useImportJob

### 5.6 Frontend Providers

The frontend providers are fixed.

- AppProvider
- QueryProvider
- ThemeProvider
- AuthProvider
- GraphProvider

### 5.7 Frontend Services

The frontend services are fixed.

- graphService
- recommendationService
- roadmapService
- careerService
- assessmentService
- searchService
- importService

### 5.8 Frontend Shared Components

The frontend shared components are fixed.

- PageLayout
- SectionHeader
- Card
- Panel
- EmptyState
- LoadingState
- ErrorState
- Modal
- Tabs
- FormField

### 5.9 Frontend Plugin Registry

The frontend plugin registry is fixed.

- Plugin manifests are registered through a plugin registry.
- Plugins are feature extensions and must be isolated from core engine logic.
- Plugins consume capability APIs and shared UI primitives.

### 5.10 Frontend Graph Components

The frontend graph components are fixed.

- GraphCanvas
- GraphNodeCard
- GraphEdgeList
- GraphFilterPanel
- GraphLegend

### 5.11 Frontend Learning Components

The frontend learning components are fixed.

- LearningPathView
- ProgressPanel
- ReadinessPanel
- RecommendationCard
- RecommendationList

### 5.12 Frontend Career Components

The frontend career components are fixed.

- CareerExplorer
- CareerMatchList
- SkillGapPanel
- CareerDetailPanel

### 5.13 Frontend Recommendation Components

The frontend recommendation components are fixed.

- RecommendationPanel
- RecommendationReasonList
- NextStepCard

---

## 6. Canonical Engine Catalog

The engine catalog is fixed. These are the only engines.

### 6.1 Graph Engine

- Final Name: Graph Engine
- Responsibility: maintain structural graph state and provide graph traversal access.
- Owner: Backend Core Team
- Dependencies: Persistence adapter, Validation Engine, Event Engine
- Public Interface: get_node, get_nodes, get_edge, get_neighbors, get_subgraph, node_exists, edge_exists, count
- Internal Components: graph repository, adjacency accessors, graph metadata handlers
- Events Published: graph.node.created, graph.node.updated, graph.edge.created, graph.edge.updated
- Events Consumed: import.committed, validation.passed, validation.failed

### 6.2 Knowledge Engine

- Final Name: Knowledge Engine
- Responsibility: manage node content, resources, tags, metadata, assessments, and skills.
- Owner: Backend Core Team
- Dependencies: Graph Engine, Persistence adapter
- Public Interface: get_content, get_content_blocks, get_resources, get_tags, get_skills_for_node, get_assessments_for_node
- Internal Components: content repository, content block handlers, content metadata handlers
- Events Published: knowledge.content.updated
- Events Consumed: graph.node.created, graph.node.updated

### 6.3 Traversal Engine

- Final Name: Traversal Engine
- Responsibility: compute graph traversal and path results.
- Owner: Backend Core Team
- Dependencies: Graph Engine
- Public Interface: bfs, dfs, shortest_path, reachable, topological_sort
- Internal Components: traversal algorithms, bounded-depth traversers
- Events Published: none
- Events Consumed: none

### 6.4 Event Engine

- Final Name: Event Engine
- Responsibility: own the domain event backbone.
- Owner: Backend Platform Team
- Dependencies: Event store, persistence adapter
- Public Interface: publish, subscribe, replay, get_history, retry_dead_letter
- Internal Components: event bus, event store, subscriber registry, retry handler
- Events Published: all domain events
- Events Consumed: none

### 6.5 State Engine

- Final Name: State Engine
- Responsibility: maintain learner state and learner progression state.
- Owner: Backend Core Team
- Dependencies: Graph Engine, Event Engine
- Public Interface: get_state, update_state, list_states
- Internal Components: state repository, state transition handlers
- Events Published: state.updated, state.completed, state.blocked
- Events Consumed: assessment.submitted, recommendation.generated

### 6.6 Dependency Engine

- Final Name: Dependency Engine
- Responsibility: evaluate prerequisites, blockers, and readiness.
- Owner: Backend Core Team
- Dependencies: Graph Engine, State Engine
- Public Interface: get_readiness, get_blockers
- Internal Components: prerequisite rules, blocker evaluation, readiness calculation
- Events Published: dependency.readiness.updated
- Events Consumed: state.updated, graph.node.updated

### 6.7 Validation Engine

- Final Name: Validation Engine
- Responsibility: validate all mutations and imports before persistence.
- Owner: Backend Core Team
- Dependencies: Graph Engine, Knowledge Engine
- Public Interface: validate_graph_change, validate_import
- Internal Components: rule registry, validation reports, mutation validators
- Events Published: validation.passed, validation.failed
- Events Consumed: graph.change.requested, import.started

### 6.8 Search Engine

- Final Name: Search Engine
- Responsibility: resolve search requests over graph and content data.
- Owner: Backend Core Team
- Dependencies: Graph Engine, Knowledge Engine
- Public Interface: search
- Internal Components: index adapter, ranking rules, search result formatter
- Events Published: search.index.updated
- Events Consumed: graph.node.updated, knowledge.content.updated

### 6.9 Recommendation Engine

- Final Name: Recommendation Engine
- Responsibility: generate deterministic next-step recommendations.
- Owner: Backend Core Team
- Dependencies: State Engine, Dependency Engine, Graph Engine
- Public Interface: get_next_recommendation
- Internal Components: recommendation rules, ranking policy, explanation builder
- Events Published: recommendation.generated
- Events Consumed: state.updated, dependency.readiness.updated

### 6.10 Learning Path Engine

- Final Name: Learning Path Engine
- Responsibility: generate a coherent learning path to a target outcome.
- Owner: Backend Core Team
- Dependencies: Recommendation Engine, Dependency Engine, Graph Engine
- Public Interface: generate_path
- Internal Components: path planner, milestone generator, ordering rules
- Events Published: roadmap.generated
- Events Consumed: recommendation.generated, dependency.readiness.updated

### 6.11 Career Engine

- Final Name: Career Engine
- Responsibility: map learner progress to career opportunities and skill gaps.
- Owner: Backend Core Team
- Dependencies: Graph Engine, State Engine
- Public Interface: get_career_matches, get_skill_gap
- Internal Components: career matching rules, skill-gap analyzer
- Events Published: career.match.updated
- Events Consumed: state.updated

### 6.12 Assessment Engine

- Final Name: Assessment Engine
- Responsibility: define, submit, and evaluate assessments.
- Owner: Backend Core Team
- Dependencies: State Engine, Validation Engine
- Public Interface: get_assessment, submit_assessment, grade_assessment
- Internal Components: assessment repository, grading rules, result formatter
- Events Published: assessment.submitted, assessment.scored
- Events Consumed: state.updated

### 6.13 Import Engine

- Final Name: Import Engine
- Responsibility: ingest external content, validate it, and commit it into the graph.
- Owner: Backend Core Team
- Dependencies: Validation Engine, Graph Engine, Knowledge Engine, Event Engine
- Public Interface: start_import, get_import_status, rollback_import
- Internal Components: parser, validator, transformer, commit handler, rollback handler
- Events Published: import.started, import.completed, import.failed, import.rollback.requested
- Events Consumed: validation.passed, validation.failed

### 6.14 Simulator Engine

- Final Name: Simulator Engine
- Responsibility: execute simulation scenarios and produce outcomes.
- Owner: Backend Core Team
- Dependencies: State Engine, Event Engine
- Public Interface: run_simulation
- Internal Components: scenario runner, outcome evaluator
- Events Published: simulator.started, simulator.completed
- Events Consumed: state.updated

---

## 7. Canonical Domain Model

The domain model is fixed.

### 7.1 KnowledgeNode

- Purpose: represent a node in the knowledge graph.
- Ownership: Graph Engine
- Relationships: connected by edges, enriched by content, referenced by state
- Lifecycle: created, updated, removed
- Persistence Mapping: knowledge_nodes

### 7.2 KnowledgeEdge

- Purpose: represent a relationship between nodes.
- Ownership: Graph Engine
- Relationships: connects source and target nodes
- Lifecycle: created, removed
- Persistence Mapping: knowledge_edges

### 7.3 NodeContent

- Purpose: store content and metadata attached to a node.
- Ownership: Knowledge Engine
- Relationships: belongs to a node
- Lifecycle: created, updated, removed
- Persistence Mapping: node_content

### 7.4 LearnerState

- Purpose: represent learner progress and current mastery state for a node.
- Ownership: State Engine
- Relationships: belongs to a learner and a node
- Lifecycle: created, updated
- Persistence Mapping: learner_states

### 7.5 ValidationReport

- Purpose: represent the result of validation for a mutation or import.
- Ownership: Validation Engine
- Relationships: attached to a mutation or import job
- Lifecycle: created, consumed
- Persistence Mapping: validation_reports

### 7.6 AssessmentSubmission

- Purpose: represent a learner submission for an assessment.
- Ownership: Assessment Engine
- Relationships: belongs to a learner and an assessment
- Lifecycle: submitted, scored
- Persistence Mapping: assessment_submissions

### 7.7 ImportJob

- Purpose: represent an import workflow and its execution state.
- Ownership: Import Engine
- Relationships: produces graph mutation events and rollback state
- Lifecycle: queued, running, completed, failed, rolled_back
- Persistence Mapping: import_jobs

### 7.8 DomainEvent

- Purpose: represent state changes and workflow coordination across the system.
- Ownership: Event Engine
- Relationships: emitted by engines and consumed by other engines
- Lifecycle: published, delivered, retried, dead_lettered
- Persistence Mapping: domain_events

---

## 8. Canonical Event Model

The event model is fixed.

### 8.1 Event Naming Convention

- Events use the form: domain.action.v1
- Example: graph.node.created.v1

### 8.2 Event Versioning

- Event version is always included in the event name.
- Event payloads are versioned with the same major version.

### 8.3 Event Payload Standard

- Every event contains: event_id, event_type, occurred_at, correlation_id, aggregate_id, payload

### 8.4 Correlation IDs

- Every event must carry a correlation_id.
- Correlation IDs are propagated through related workflows.

### 8.5 Idempotency

- All event consumers must be idempotent.
- Duplicate delivery must not cause double-write side effects.

### 8.6 Retry Policy

- Retry is applied for transient failures.
- Retry count is fixed at three attempts.
- Retry delay is fixed at one, five, and fifteen seconds.

### 8.7 Dead-Letter Handling

- Failed events that exceed retry policy are moved to dead-letter storage.
- Dead letters are inspectable and replayable.

### 8.8 Outbox Usage

- Writes that change domain state must publish an outbox event before commit.
- The outbox is the authoritative source for event emission.

---

## 9. Canonical API Model

The API model is fixed and capability-first.

### 9.1 Capability Catalog

- Graph capability: explore graph structure and retrieve subgraphs.
- Knowledge capability: retrieve content and metadata for nodes.
- Recommendation capability: retrieve the next recommended concept.
- Roadmap capability: generate a learning roadmap.
- Career capability: compare careers and analyze skill gaps.
- Assessment capability: submit and evaluate assessments.
- Search capability: search graph and content.
- Import capability: start, monitor, and rollback imports.
- Simulation capability: run simulator scenarios.

### 9.2 API Contract Rule

- APIs expose capability outcomes.
- APIs never expose persistence entities directly.
- APIs never contain business logic.

---

## 10. Mandatory Engineering Rules

The following rules are mandatory.

1. Engines own business logic.
2. Capabilities orchestrate engines.
3. The Graph Engine is the structural authority.
4. Every mutation passes through validation.
5. Every write publishes an event.
6. Engines never call UI.
7. Capabilities never contain business logic.
8. No engine accesses another engine's persistence directly.
9. No circular dependencies are allowed.
10. Read-only access may be direct.
11. All write flows must use the event backbone.
12. The frontend consumes capability APIs only.
13. Shared packages contain no domain business logic.
14. Background workers are infrastructure-owned.
15. Import workflows must support dry-run, commit, and rollback.

---

## 11. Canonical Shared Packages

The shared package ownership is fixed.

- packages/ui: shared UI primitives and design-system components.
- packages/types: shared request, response, and domain contracts.
- packages/config: environment variables, flags, and shared constants.
- packages/eslint-config: linting standards.
- packages/tsconfig: TypeScript build configuration.

---

## 12. Canonical Persistence Mapping

The persistence mapping is fixed.

- Graph data maps to graph tables.
- Content data maps to content tables.
- Learner state maps to learner state tables.
- Validation results map to validation result tables.
- Import jobs map to import job tables.
- Events map to event tables.

All persistence access is through repositories owned by the corresponding engine boundary.

---

## 13. Canonical Import Pipeline

The import pipeline is fixed.

1. Receive import request.
2. Validate incoming payload.
3. Run dry-run if requested.
4. Commit validated changes to graph and content.
5. Publish import events.
6. Record import progress.
7. Support rollback if required.

---

## 14. Canonical Plugin System

The plugin system is fixed.

- Plugins are optional extensions.
- Plugins are registered through a plugin registry.
- Plugins consume capability APIs and shared UI components.
- Plugins never bypass engine boundaries.

---

## 15. Architecture Status

Architecture Version: 1.0

Status: FROZEN

Implementation Status: READY
