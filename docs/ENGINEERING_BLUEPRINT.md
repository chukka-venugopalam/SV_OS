# SV-OS Engineering Blueprint

## Status

- Version: 1.0
- Status: Implementation-ready engineering specification
- Scope: Translation of the approved architecture into buildable software structure
- Constraint: No architectural redesign. No pseudocode. No implementation code.

---

## 1. Repository Structure

The monorepo is organized around a single product: a knowledge operating system with a web application, an API backend, shared packages, data assets, and operational tooling.

### 1.1 Top-Level Structure

```text
SV-OS/
├── apps/
│   ├── api/
│   └── web/
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

### 1.2 Application Packages

#### apps/api

Purpose: Backend runtime for all engine execution, capability orchestration, persistence, events, and API delivery.

Responsibilities:

- Expose capability-based APIs
- Host engine implementations
- Manage domain services and workflows
- Persist graph and learner state
- Publish and consume domain events
- Run background jobs and import pipelines

Modules:

```text
apps/api/
├── pyproject.toml
├── alembic.ini
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── deps.py
│   │   ├── v1/
│   │   │   ├── router.py
│   │   │   └── endpoints/
│   │   │       ├── capabilities/
│   │   │       ├── graph/
│   │   │       ├── learner/
│   │   │       ├── career/
│   │   │       ├── assessment/
│   │   │       ├── simulator/
│   │   │       └── admin/
│   ├── capabilities/
│   │   ├── roadmap/
│   │   ├── recommendation/
│   │   ├── assessment/
│   │   ├── planning/
│   │   ├── explanation/
│   │   └── visualization/
│   ├── engines/
│   │   ├── graph/
│   │   ├── knowledge/
│   │   ├── traversal/
│   │   ├── state/
│   │   ├── dependency/
│   │   ├── validation/
│   │   ├── search/
│   │   ├── recommendation/
│   │   ├── learning_path/
│   │   ├── career/
│   │   ├── project/
│   │   ├── assessment/
│   │   ├── simulator/
│   │   ├── roadmap/
│   │   ├── import/
│   │   ├── export/
│   │   ├── event/
│   │   └── analytics/
│   ├── domain/
│   │   ├── models/
│   │   ├── value_objects/
│   │   ├── aggregates/
│   │   ├── factories/
│   │   └── policies/
│   ├── infrastructure/
│   │   ├── auth/
│   │   ├── http/
│   │   ├── messaging/
│   │   ├── telemetry/
│   │   └── background_jobs/
│   ├── persistence/
│   │   ├── repositories/
│   │   ├── mappers/
│   │   ├── models/
│   │   └── query_builders/
│   ├── events/
│   │   ├── contracts/
│   │   ├── handlers/
│   │   ├── bus/
│   │   └── dead_letters/
│   ├── cache/
│   │   ├── redis/
│   │   ├── memory/
│   │   └── policies/
│   ├── config/
│   ├── utils/
│   ├── exceptions/
│   ├── middleware/
│   ├── telemetry/
│   └── startup/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── engine/
│   ├── graph/
│   ├── contract/
│   └── e2e/
└── scripts/
```

#### apps/web

Purpose: Frontend runtime for all learner-facing experiences.

Responsibilities:

- Render pages and feature surfaces
- Provide graph visualization and explorer experiences
- Interact with capability APIs
- Manage client-side state and UI preferences
- Support plugin-driven extensions through feature registries

Modules:

```text
apps/web/
├── package.json
├── next.config.ts
├── src/
│   ├── app/
│   │   ├── (marketing)
│   │   ├── dashboard/
│   │   ├── explore/
│   │   ├── careers/
│   │   ├── roadmap/
│   │   ├── simulator/
│   │   ├── assessment/
│   │   ├── settings/
│   │   └── api/
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── graph/
│   │   ├── explorer/
│   │   ├── dashboard/
│   │   └── forms/
│   ├── features/
│   │   ├── graph-visualization/
│   │   ├── knowledge-explorer/
│   │   ├── career-explorer/
│   │   ├── learning-dashboard/
│   │   ├── simulator-hub/
│   │   ├── assessment-center/
│   │   ├── ai-tutor/
│   │   ├── roadmap/
│   │   └── settings/
│   ├── hooks/
│   ├── providers/
│   ├── stores/
│   ├── services/
│   ├── lib/
│   │   ├── api/
│   │   ├── routing/
│   │   ├── cache/
│   │   └── plugins/
│   ├── types/
│   └── utils/
```

### 1.3 Shared Packages

- packages/ui: reusable design system components and visual primitives
- packages/types: shared domain contracts and DTOs used by web and api
- packages/config: environment, feature flag, and application constants
- packages/eslint-config: lint standards
- packages/tsconfig: shared TypeScript configuration

### 1.4 Data, Docs, and Tooling

- database/: schema, migrations, seeds, scripts
- docs/: architecture, API, deployment, coding standards, runbooks
- scripts/: setup, build, seed, backup, restore utilities
- infrastructure/: deployment manifests and runtime configuration

---

## 2. Backend Blueprint

The backend is structured as layered software with capability-centric orchestration and engine-centric business logic.

### 2.1 Layer Map

```text
API Layer
  -> Capability Layer
  -> Engine Layer
  -> Domain Layer
  -> Infrastructure Layer
  -> Persistence Layer
  -> Event Layer
  -> Caching Layer
  -> Configuration Layer
  -> Utilities
```

### 2.2 Package Specifications

#### API Layer

Purpose: Receive and validate inbound requests and translate them to capability execution.

Responsibilities:

- Route requests by capability
- Validate auth and request contracts
- Call capability services
- Normalize response shape
- Handle errors and trace propagation

Public interfaces:

- Router registration
- Endpoint handlers
- Request/response schemas
- Dependency injection providers

Dependencies:

- Capability Layer
- Configuration Layer
- Infrastructure Layer
- Utilities

Forbidden dependencies:

- Must not import persistence repositories directly
- Must not contain business logic
- Must not call engines directly except through capabilities

#### Capability Layer

Purpose: Implement user-facing capabilities as orchestrators over engines.

Responsibilities:

- Compose engine calls into end-to-end workflows
- Enforce business rules and policy checks
- Produce capability responses and explainability metadata
- Emit domain events after state-changing workflows

Public interfaces:

- Capability service classes
- Capability request/response DTOs
- Orchestration methods

Dependencies:

- Engine Layer
- Domain Layer
- Event Layer
- Configuration Layer

Forbidden dependencies:

- Must not access database directly
- Must not own persistence models
- Must not bypass event layer for mutations

#### Engine Layer

Purpose: Own all domain-specific business logic in pure, testable components.

Responsibilities:

- Implement graph algorithms
- Manage learner state transitions
- Calculate recommendations and learning plans
- Validate graph integrity and content quality
- Expose deterministic operations

Public interfaces:

- Engine interfaces and implementations
- Query methods
- Command handlers
- Event subscriptions

Dependencies:

- Domain Layer
- Event Layer
- Infrastructure Layer for external adapters

Forbidden dependencies:

- Must not depend on API Layer
- Must not depend on web components
- Must not depend on persistence repositories directly

#### Domain Layer

Purpose: Define the core model vocabulary and domain rules.

Responsibilities:

- Define entities, aggregates, value objects, and policies
- Encapsulate domain invariants
- Provide factories and state transitions
- Define business exceptions

Public interfaces:

- Domain entities and interfaces
- Policy classes
- Transition definitions

Dependencies:

- None beyond shared types

Forbidden dependencies:

- Must not depend on HTTP, FastAPI, or web frameworks
- Must not depend on persistence implementation details

#### Infrastructure Layer

Purpose: Provide platform integrations and adapters.

Responsibilities:

- Auth and authorization adapters
- Background job runners
- Metrics, logging, tracing, and health integrations
- External service clients
- Event bus adapters

Public interfaces:

- Provider interfaces
- Adapters and clients
- Health check services

Dependencies:

- Domain Layer
- Configuration Layer

Forbidden dependencies:

- Must not contain business logic for capabilities
- Must not define domain entities

#### Persistence Layer

Purpose: Provide the concrete storage boundary for state and graph data.

Responsibilities:

- Map domain objects into PostgreSQL
- Run queries and transactions
- Implement repository contracts
- Manage migrations and schema evolution

Public interfaces:

- Repository interfaces and implementations
- Unit-of-work abstractions
- Query builders

Dependencies:

- Domain Layer
- Configuration Layer

Forbidden dependencies:

- Must not be imported by API Layer directly
- Must not contain orchestration logic
- Must not emit domain events on its own

#### Event Layer

Purpose: Provide asynchronous communication between engines and capabilities.

Responsibilities:

- Publish immutable domain events
- Deliver events to subscribers
- Retry and dead-letter failed handlers
- Record event history for replay and debugging

Public interfaces:

- Event bus
- Event contracts
- Subscription registries
- Dead-letter management

Dependencies:

- Domain Layer
- Persistence Layer for event store
- Infrastructure Layer for transport adapters

Forbidden dependencies:

- Must not depend on API Layer
- Must not perform capability orchestration

#### Caching Layer

Purpose: Support hot reads and expensive graph operations.

Responsibilities:

- Cache graph queries and learner state snapshots
- Apply TTL and invalidation policies
- Store computed recommendations and traversal results where appropriate

Public interfaces:

- Cache client interfaces
- Cache keys and policies
- Invalidation helpers

Dependencies:

- Configuration Layer
- Infrastructure Layer

Forbidden dependencies:

- Must not be the source of truth for state
- Must not bypass validation or event rules

#### Configuration Layer

Purpose: Own all configuration and environment contract.

Responsibilities:

- Load env-based settings
- Validate feature flags and secrets
- Expose strongly typed settings to all layers

Public interfaces:

- Settings classes
- Feature flag providers
- Environment validators

Dependencies:

- None

Forbidden dependencies:

- Must not import business logic packages

#### Utilities

Purpose: Shared cross-cutting helpers.

Responsibilities:

- Formatting, parsing, pagination, UUIDs, time handling, serialization
- Common logging and metrics helpers

Public interfaces:

- Utility modules and helper functions

Dependencies:

- None or limited to configuration

Forbidden dependencies:

- Must not contain domain/business logic

---

## 3. Frontend Blueprint

The frontend is a collection of feature surfaces that all operate on the same graph-backed domain model.

### 3.1 Page Architecture

#### Pages

- Home / marketing landing
- Knowledge Explorer
- Career Explorer
- Learning Dashboard
- Simulator Hub
- Assessment Center
- Search Results
- AI Tutor
- Roadmap view
- Settings
- Admin / import management

### 3.2 Feature Modules

#### Graph Visualization

Purpose: Present the knowledge graph in interactive, navigable form.

Responsibilities:

- Render nodes and edges
- Support pan, zoom, selection, and focus
- Highlight dependency chains and career paths
- Provide drill-down into node details

Modules:

- components/graph
- features/graph-visualization
- hooks/useGraphViewport
- stores/graphStore

#### Knowledge Explorer

Purpose: Let learners browse and search the knowledge graph.

Responsibilities:

- Browse by category, difficulty, and type
- Inspect node content and prerequisite relationships
- Open subgraphs and dependency context

#### Career Explorer

Purpose: Compare careers and understand skill requirements.

Responsibilities:

- List careers and progression levels
- Show career deltas and gap analysis
- Recommend next steps toward a target career

#### Learning Dashboard

Purpose: Give learners a personal view of progress, recommendations, and plans.

Responsibilities:

- Display current state and daily plan
- Surface recommended concepts and review tasks
- Track activity and streaks

#### Simulator Hub

Purpose: Present hands-on learning scenarios and structured practice.

Responsibilities:

- Launch challenges and simulations
- Show outcomes and scored performance
- Connect simulator results to learning state

#### Assessment Center

Purpose: Deliver and review structured assessments.

Responsibilities:

- Present assessment flows
- Capture submissions and scores
- Link outcomes to state updates and next recommendations

#### Search

Purpose: Provide fast content discovery across the graph.

Responsibilities:

- Full-text and faceted search
- Suggestions and recent history
- Filter by node type and category

#### AI Tutor

Purpose: Provide contextual explanations and assistive guidance.

Responsibilities:

- Explain dependency chains and concepts
- Answer learner questions with graph-backed explanations
- Surface relevant learning resources

#### Roadmap

Purpose: Show long-range learning progression.

Responsibilities:

- Present plan by week or semester
- Highlight milestones and prerequisite unlocks
- Allow plan refresh and adaptation

#### Settings

Purpose: Manage learner preferences and feature configuration.

Responsibilities:

- Theme, notification, and privacy settings
- Personal learning preferences
- Plugin and extension preferences

### 3.3 Component Model

- Layout: header, sidebar, breadcrumbs, mobile nav
- Shared UI: cards, badges, empty states, modals, loaders
- Feature components: graph canvas, explorer panel, career comparison cards
- Form components: assessment input, settings form, search filters

### 3.4 State Management

- React Query for server state
- Zustand for UI state
- React Hook Form + Zod for forms

### 3.5 Routing

- App Router-based route tree
- Route-level loading and error boundaries
- Shared route constants and typed route helpers

### 3.6 Caching

- Query cache for canonical API resources
- Local component cache for graph subgraphs and explorer filters
- Session persistence for UI preferences and current view state

### 3.7 Plugin System

- Feature registry for optional extensions
- Plugin manifest contracts for new visualizations, simulators, assessments, and recommendation rules
- Runtime loading via dependency injection and manifest resolution

---

## 4. Engine Package Blueprint

Each engine is implemented in its own package under the backend engine layer and follows the same structure.

### 4.1 Common Engine Structure

Every engine package contains:

```text
<engine>/
├── __init__.py
├── interface.py
├── implementation.py
├── dto.py
├── commands.py
├── queries.py
├── events.py
├── services/
│   ├── __init__.py
│   ├── core.py
│   └── helpers.py
├── config.py
├── tests/
│   ├── test_interface.py
│   ├── test_behavior.py
│   └── test_integration.py
```

### 4.2 Engine Catalog

#### Graph Engine

Folder: apps/api/app/engines/graph

Files:

- interface.py
- implementation.py
- dto.py
- queries.py
- events.py
- config.py

Interfaces:

- GraphEngine
- GraphQueryPort

DTOs:

- KnowledgeNodeDTO
- KnowledgeEdgeDTO
- GraphSnapshotDTO
- SubgraphDTO

Commands:

- CreateNodeCommand
- UpdateNodeCommand
- DeleteNodeCommand
- CreateEdgeCommand
- DeleteEdgeCommand

Queries:

- GetNodeQuery
- GetNeighborsQuery
- GetSubgraphQuery
- CountNodesQuery

Events:

- NodeCreated
- NodeUpdated
- NodeDeleted
- EdgeCreated
- EdgeDeleted
- GraphReloaded

Public API:

- get_node, get_nodes, get_neighbors, get_subgraph, count

Internal services:

- adjacency index manager
- node cache manager
- graph snapshot loader

Configuration:

- graph cache size
- eager load toggle
- max subgraph depth

Testing strategy:

- unit tests for graph mutation logic
- integration tests with persistence adapter
- property tests for graph invariants

#### Knowledge Engine

Folder: apps/api/app/engines/knowledge

Files:

- interface.py
- implementation.py
- dto.py
- queries.py
- events.py

Interfaces:

- KnowledgeEngine

DTOs:

- NodeContentDTO
- ContentBlockDTO
- ResourceDTO
- SkillLinkDTO

Commands:

- UpdateNodeContentCommand
- AttachResourceCommand
- AttachAssessmentCommand

Queries:

- GetNodeContentQuery
- GetContentBlocksQuery
- GetNodesByCategoryQuery

Events:

- NodeContentUpdated
- ContentBlockAdded
- ContentBlockRemoved

Public API:

- get_content, get_resources, get_tags, get_assessments

Internal services:

- content block normalizer
- metadata resolver

Configuration:

- content cache size
- block indexing policy

Testing strategy:

- content transformation tests
- schema compatibility tests with import data

#### Traversal Engine

Folder: apps/api/app/engines/traversal

Files:

- interface.py
- implementation.py
- dto.py

Interfaces:

- TraversalEngine

DTOs:

- TraversalResultDTO
- PathResultDTO
- CycleReportDTO

Commands:

- None

Queries:

- BFSQuery
- DFSQuery
- ShortestPathQuery
- ReachabilityQuery
- TopologicalSortQuery

Events:

- None

Public API:

- bfs, dfs, shortest_path, multi_source_bfs, detect_cycle

Internal services:

- queue manager
- visited-set tracker
- bounded traversal policy

Configuration:

- max depth
- max traversal nodes
- edge-type filters

Testing strategy:

- deterministic traversal tests
- graph stress tests

#### State Engine

Folder: apps/api/app/engines/state

Files:

- interface.py
- implementation.py
- dto.py
- commands.py
- queries.py
- events.py

Interfaces:

- StateEngine

DTOs:

- LearnerStateDTO
- NodeStateDTO
- TransitionResultDTO

Commands:

- TransitionStateCommand
- SetConfidenceCommand
- MarkCompletedCommand

Queries:

- GetLearnerStateQuery
- GetNodeStateQuery
- GetCompletedNodesQuery

Events:

- StateTransitioned
- ConfidenceUpdated
- LearningMilestoneReached

Public API:

- get_learner_state, transition, get_completed_ids, get_velocity

Internal services:

- state machine engine
- streak calculator
- transition validator

Configuration:

- state retention policy
- partition strategy
- cache TTL

Testing strategy:

- state transition tests
- regression tests for milestone and streak logic

#### Dependency Engine

Folder: apps/api/app/engines/dependency

Files:

- interface.py
- implementation.py
- dto.py

Interfaces:

- DependencyEngine

DTOs:

- DependencyChainDTO
- BlockerDTO
- DependencyGraphDTO

Commands:

- None

Queries:

- PrerequisitesQuery
- DependentsQuery
- UnlocksQuery
- BlockersQuery

Events:

- None

Public API:

- get_prerequisites, get_dependents, is_ready, find_blockers

Internal services:

- prerequisite resolver
- barrier analyzer

Configuration:

- depth limits
- cache TTL

Testing strategy:

- dependency correctness tests
- cycle-resistance tests

#### Validation Engine

Folder: apps/api/app/engines/validation

Files:

- interface.py
- implementation.py
- dto.py
- events.py

Interfaces:

- ValidationEngine

DTOs:

- ValidationResultDTO
- ValidationIssueDTO
- ValidationReportDTO
- GraphHealthScoreDTO

Commands:

- ValidateNodeCommand
- ValidateGraphCommand
- ValidateImportCommand

Queries:

- GetValidationStatusQuery
- GetValidationCacheQuery

Events:

- ValidationWarning
- ValidationFailed
- HealthScoreComputed

Public API:

- validate_node, validate_edge, validate_full_graph, validate_import

Internal services:

- integrity checker
- health scorer
- incremental validator

Configuration:

- validation depth limits
- strictness profile

Testing strategy:

- structural integrity tests
- import validation regression tests

#### Search Engine

Folder: apps/api/app/engines/search

Files:

- interface.py
- implementation.py
- dto.py
- events.py

Interfaces:

- SearchEngine

DTOs:

- SearchResultDTO
- SearchSuggestionDTO
- SearchRecordDTO

Commands:

- IndexNodeCommand
- RemoveNodeCommand
- RecordSearchCommand

Queries:

- SearchQuery
- SuggestQuery
- TrendingQuery

Events:

- NodeIndexed
- NodeRemoved
- SearchRecorded

Public API:

- search, suggest, get_trending

Internal services:

- tokenizer
- ranking policy
- index refresh manager

Configuration:

- index refresh interval
- maximum result count

Testing strategy:

- relevance tests
- autocomplete tests
- indexing consistency tests

#### Recommendation Engine

Folder: apps/api/app/engines/recommendation

Files:

- interface.py
- implementation.py
- dto.py
- services/

Interfaces:

- RecommendationEngine

DTOs:

- RecommendationDTO
- RecommendationContextDTO
- DailyPlanDTO

Commands:

- None

Queries:

- GetNextConceptQuery
- GetReviewCandidatesQuery
- GetDailyPlanQuery

Events:

- RecommendationGenerated

Public API:

- get_next_concept, get_next_n_concepts, get_review_candidates, get_daily_plan

Internal services:

- readiness scorer
- review scheduler
- explanation builder

Configuration:

- weighting profile
- review cadence policy
- maximum recommendation count

Testing strategy:

- deterministic recommendation tests
- review scheduling regression tests

#### Learning Path Engine

Folder: apps/api/app/engines/learning_path

Files:

- interface.py
- implementation.py
- dto.py

Interfaces:

- LearningPathEngine

DTOs:

- LearningPathDTO
- PathStepDTO
- TimeEstimateDTO

Commands:

- GeneratePathCommand
- ReplanPathCommand

Queries:

- GeneratePathQuery
- AlternativePathsQuery

Events:

- PathGenerated
- PathReplanned

Public API:

- generate_path, generate_career_path, optimize_path, replan_path

Internal services:

- path optimizer
- milestone planner
- alternative generator

Configuration:

- path length limits
- optimization strategy registry

Testing strategy:

- path correctness tests
- plan optimization tests

#### Career Engine

Folder: apps/api/app/engines/career

Files:

- interface.py
- implementation.py
- dto.py

Interfaces:

- CareerEngine

DTOs:

- CareerDTO
- CareerComparisonDTO
- SkillGapDTO

Commands:

- CreateCareerCommand
- UpdateCareerCommand

Queries:

- GetCareerQuery
- CompareCareersQuery
- GetCareerGapQuery

Events:

- CareerGoalUpdated
- CareerComparisonRequested

Public API:

- get_career, compare_careers, get_career_gap, recommend_career

Internal services:

- career delta calculator
- seniority progression mapper

Configuration:

- career taxonomy definitions

Testing strategy:

- career comparison correctness tests
- gap analysis tests

#### Project Engine

Folder: apps/api/app/engines/project

Files:

- interface.py
- implementation.py
- dto.py

Interfaces:

- ProjectEngine

DTOs:

- ProjectDTO
- ProjectRecommendationDTO

Commands:

- LinkProjectCommand
- UpdateProjectCommand

Queries:

- GetProjectQuery
- RecommendProjectQuery

Events:

- ProjectRecommended

Public API:

- recommend_project, get_project_context

Internal services:

- project suitability scorer

Configuration:

- project availability policy

Testing strategy:

- project recommendation tests

#### Assessment Engine

Folder: apps/api/app/engines/assessment

Files:

- interface.py
- implementation.py
- dto.py
- events.py

Interfaces:

- AssessmentEngine

DTOs:

- AssessmentDTO
- AssessmentResultDTO

Commands:

- SubmitAssessmentCommand
- GradeAssessmentCommand

Queries:

- GetAssessmentQuery
- GetAssessmentResultQuery

Events:

- AssessmentSubmitted
- AssessmentGraded

Public API:

- get_assessment, submit_assessment, grade_assessment

Internal services:

- scoring policy engine
- rubric evaluator

Configuration:

- scoring thresholds
- time limits

Testing strategy:

- scoring correctness tests
- submission workflow tests

#### Simulator Engine

Folder: apps/api/app/engines/simulator

Files:

- interface.py
- implementation.py
- dto.py
- events.py

Interfaces:

- SimulatorEngine

DTOs:

- SimulatorDTO
- SimulatorRunDTO

Commands:

- RunSimulatorCommand
- CompleteSimulatorCommand

Queries:

- GetSimulatorQuery
- GetRunHistoryQuery

Events:

- SimulatorCompleted

Public API:

- run_simulator, get_simulator_result

Internal services:

- scenario loader
- outcome evaluator

Configuration:

- simulator registry
- timeout policy

Testing strategy:

- scenario result tests
- concurrency tests

#### Import Engine

Folder: apps/api/app/engines/import

Files:

- interface.py
- implementation.py
- dto.py
- events.py

Interfaces:

- ImportEngine

DTOs:

- ImportJobDTO
- ImportValidationDTO
- ImportProgressDTO

Commands:

- StartImportCommand
- CommitImportCommand
- RollbackImportCommand

Queries:

- GetImportJobQuery
- GetImportProgressQuery

Events:

- ImportStarted
- ImportCompleted
- ImportFailed
- ImportRolledBack

Public API:

- start_import, dry_run_import, commit_import, rollback_import

Internal services:

- parser
- validator
- transformer
- graph builder
- integrity checker

Configuration:

- batch size
- dry-run policy
- rollback mode

Testing strategy:

- parser and transformation tests
- data integrity tests
- rollback tests

#### Event Engine

Folder: apps/api/app/engines/event

Files:

- interface.py
- implementation.py
- dto.py
- bus.py

Interfaces:

- EventEngine

DTOs:

- DomainEventDTO
- DeliveryResultDTO
- DeadLetterDTO

Commands:

- PublishEventCommand
- RetryEventCommand

Queries:

- GetEventHistoryQuery
- GetDeadLettersQuery

Events:

- EventPublished
- EventDelivered
- EventFailed

Public API:

- publish, subscribe, replay, retry_dead_letter

Internal services:

- event serializer
- delivery monitor
- idempotency guard

Configuration:

- retry policy
- max retries
- dead-letter retention

Testing strategy:

- delivery-order tests
- retry policy tests
- idempotency tests

---

## 5. Capability Layer

Capabilities are the product-facing entry points. They orchestrate engines and do not own persistence or network access.

### 5.1 Capability Catalog

#### FindShortestPath

Purpose: Return the optimal learning route between two graph nodes.

Orchestrates:

- Graph Engine
- Traversal Engine
- Dependency Engine
- Validation Engine

Input:

- source node, target node, optional constraints

Output:

- path, reasons, blockers, estimated difficulty

#### GenerateRoadmap

Purpose: Build a long-range learning roadmap aligned to a learner state and career target.

Orchestrates:

- State Engine
- Learning Path Engine
- Career Engine
- Recommendation Engine

#### RecommendNextConcept

Purpose: Suggest the next concept or skill to learn.

Orchestrates:

- State Engine
- Recommendation Engine
- Dependency Engine
- Career Engine

#### RecommendRevision

Purpose: Identify nodes that should be reviewed soon.

Orchestrates:

- State Engine
- Recommendation Engine
- Knowledge Engine

#### CalculateSkillGap

Purpose: Determine missing knowledge relative to a career or target milestone.

Orchestrates:

- Career Engine
- Dependency Engine
- State Engine
- Validation Engine

#### CompareCareers

Purpose: Compare two careers by skill overlap and divergence.

Orchestrates:

- Career Engine
- Graph Engine
- Dependency Engine

#### GenerateSemesterPlan

Purpose: Generate a semester-sized learning plan with milestones and pacing.

Orchestrates:

- Learning Path Engine
- State Engine
- Recommendation Engine

#### GenerateInterviewPlan

Purpose: Build a focused, interview-ready plan around a target role.

Orchestrates:

- Career Engine
- Recommendation Engine
- Learning Path Engine

#### ExplainDependency

Purpose: Produce rationale for why a concept depends on another.

Orchestrates:

- Dependency Engine
- Knowledge Engine
- Graph Engine

#### EstimateLearningTime

Purpose: Produce realistic time estimates for paths and modules.

Orchestrates:

- Learning Path Engine
- State Engine
- Knowledge Engine

#### GenerateVisualization

Purpose: Build graph views for exploration or explanation.

Orchestrates:

- Graph Engine
- Traversal Engine
- Knowledge Engine

### 5.2 Capability Contract Pattern

Each capability exposes:

- Input DTO
- Output DTO
- Execution policy
- Event emission contract
- Authorization metadata
- Observability tags

---

## 6. Event Contracts

All state-changing workflows emit domain events. Events are immutable and idempotent by design.

### 6.1 Event Catalog

| Event                   | Publisher                 | Subscribers                                        | Payload                                   | Ordering               | Retry                           | Idempotency              | Failure Handling               | Versioning          |
| ----------------------- | ------------------------- | -------------------------------------------------- | ----------------------------------------- | ---------------------- | ------------------------------- | ------------------------ | ------------------------------ | ------------------- |
| NodeCreated             | Import Engine / Admin API | Graph Engine, Knowledge Engine, Search Engine      | node_id, node_type, content, version      | Per aggregate          | Exponential backoff             | Event ID dedupe          | Dead-letter after max retries  | v1 payload contract |
| EdgeCreated             | Import Engine / Admin API | Graph Engine, Validation Engine, Dependency Engine | source_id, target_id, edge_type           | Per aggregate          | Exponential backoff             | Event ID dedupe          | Dead-letter after max retries  | v1                  |
| GraphImported           | Import Engine             | Validation Engine, Search Engine, State Engine     | import_id, source, version, summary       | Global import sequence | Retry with job checkpoint       | Import ID dedupe         | Retry import job               | v1                  |
| StateTransitioned       | State Engine              | Recommendation Engine, Analytics Engine            | learner_id, node_id, from_state, to_state | Per learner            | Retry with state reconciliation | Event ID dedupe          | Recompute affected projections | v1                  |
| ConfidenceUpdated       | State Engine              | Recommendation Engine                              | learner_id, node_id, confidence           | Per learner            | Retry                           | Event ID dedupe          | Recompute recommendation cache | v1                  |
| AssessmentSubmitted     | Assessment Engine         | State Engine, Recommendation Engine                | assessment_id, learner_id, score          | Per learner            | Retry                           | Submission ID dedupe     | Store failure and retry        | v1                  |
| PathGenerated           | Learning Path Engine      | UI event feed, Analytics Engine                    | path_id, learner_id, goal_id              | Per learner            | Retry                           | Path ID dedupe           | Rebuild if missing             | v1                  |
| CareerGoalUpdated       | Career Engine             | Recommendation Engine, Learning Path Engine        | learner_id, career_id, level              | Per learner            | Retry                           | Goal version dedupe      | Recompute roadmap              | v1                  |
| ValidationFailed        | Validation Engine         | Admin API, Import Engine                           | component, errors, severity               | Global                 | Retry                           | Error fingerprint dedupe | Alert and quarantine import    | v1                  |
| RecommendationGenerated | Recommendation Engine     | UI API                                             | recommendation_id, learner_id, concept_id | Per learner            | Retry                           | Recommendation ID dedupe | Regenerate from state          | v1                  |

### 6.2 Event Rules

- Events are emitted only after successful domain transition
- Events must remain immutable after publish
- Every event carries event_id, occurred_at, aggregate_id, version, and correlation_id
- Consumers must be idempotent and skip duplicate deliveries
- Ordering is guaranteed per aggregate_id; cross-aggregate ordering is best-effort
- Retry policy: 1s, 2s, 4s, 8s, then dead-letter after 3 retries
- Versioning: additive changes only; breaking changes require a new event version

---

## 7. API Blueprint

The API is capability-driven. Every endpoint corresponds to a capability and returns a normalized envelope.

### 7.1 API Contract Pattern

Each endpoint must define:

- Purpose
- Request schema
- Response schema
- Engines involved
- Events emitted
- Authorization
- Caching
- Rate limiting
- Performance target

### 7.2 Endpoint Catalog

| Endpoint                                     | Purpose                | Request                      | Response                             | Engines                           | Events                    | Auth          | Cache | Rate Limit | Perf Target |
| -------------------------------------------- | ---------------------- | ---------------------------- | ------------------------------------ | --------------------------------- | ------------------------- | ------------- | ----- | ---------- | ----------- |
| POST /api/v1/capabilities/next-concept       | Recommend next concept | learner_id, context          | recommendation, rationale, readiness | Recommendation, State, Dependency | RecommendationGenerated   | Authenticated | 30s   | 60/min     | p95 < 250ms |
| POST /api/v1/capabilities/roadmap            | Generate roadmap       | learner_id, career_id, level | roadmap, milestones                  | Learning Path, Career, State      | PathGenerated             | Authenticated | 5m    | 30/min     | p95 < 600ms |
| POST /api/v1/capabilities/skill-gap          | Calculate skill gap    | learner_id, career_id        | gaps, blockers, priorities           | Career, Dependency, State         | CareerGoalUpdated         | Authenticated | 5m    | 30/min     | p95 < 400ms |
| POST /api/v1/capabilities/compare-careers    | Compare careers        | career_ids, learner_state    | comparison, delta                    | Career, Graph                     | CareerComparisonRequested | Authenticated | 1h    | 60/min     | p95 < 350ms |
| POST /api/v1/capabilities/explain-dependency | Explain dependency     | node_id, target_id           | explanation, chain                   | Dependency, Knowledge             | None                      | Authenticated | 1h    | 120/min    | p95 < 300ms |
| POST /api/v1/capabilities/estimate-time      | Estimate learning time | path_id or goal              | estimate, assumptions                | Learning Path, Knowledge          | None                      | Authenticated | 10m   | 60/min     | p95 < 250ms |
| POST /api/v1/capabilities/visualize          | Generate subgraph view | node_id, depth               | subgraph, metadata                   | Graph, Traversal                  | None                      | Authenticated | 10m   | 60/min     | p95 < 400ms |
| POST /api/v1/capabilities/assessments/submit | Submit assessment      | assessment_id, answers       | score, breakdown                     | Assessment, State                 | AssessmentSubmitted       | Authenticated | None  | 20/min     | p95 < 500ms |
| GET /api/v1/graph/nodes/{id}                 | Get node details       | node_id                      | node                                 | Graph, Knowledge                  | None                      | Authenticated | 10m   | 120/min    | p95 < 200ms |
| GET /api/v1/search                           | Search graph content   | query, filters               | results                              | Search, Knowledge                 | SearchRecorded            | Authenticated | 2m    | 120/min    | p95 < 300ms |
| POST /api/v1/imports/start                   | Start import           | source, format, options      | import_id                            | Import                            | ImportStarted             | Admin         | None  | 5/min      | p95 < 1s    |
| POST /api/v1/imports/dry-run                 | Dry run import         | source, format               | validation report                    | Import, Validation                | None                      | Admin         | None  | 5/min      | p95 < 2s    |

### 7.3 API Response Envelope

Every API response must use:

- success
- message
- data
- errors
- timestamp
- request_id

---

## 8. Graph Services

Reusable graph services are implemented once and consumed by engines and capabilities.

### 8.1 Service Catalog

#### Traversal Service

Responsibilities:

- BFS, DFS, shortest path, connected components
- Bounded traversal for performant request path

#### Shortest Path Service

Responsibilities:

- Unweighted shortest path via BFS
- Weighted path support for future use

#### Cycle Detection Service

Responsibilities:

- Detect cycles in dependency and prerequisite graphs
- Support incremental and full validation modes

#### Topological Ordering Service

Responsibilities:

- Provide ordering for validation and dependency reasoning
- Support incremental updates after edge mutation

#### Dependency Chain Service

Responsibilities:

- Resolve prerequisite and unlock chains
- Identify impact propagation for graph changes

#### Career Delta Service

Responsibilities:

- Compare career requirements and identify missing or extra knowledge

#### Similarity Service

Responsibilities:

- Measure similarity between nodes, skills, and career maps

#### Graph Diff Service

Responsibilities:

- Compare old and new graph versions during import and migration

#### Relationship Discovery Service

Responsibilities:

- Discover implicit relationships from shared prerequisites and common outcomes

#### Graph Validation Service

Responsibilities:

- Enforce structural rules and semantic constraints

### 8.2 Graph Service Rules

- All graph services must operate over immutable graph snapshots or a versioned graph view
- They must never mutate graph state directly
- They must return deterministic results for identical input
- They must support bounded execution for request paths

---

## 9. Persistence Mapping

The domain model is persisted in PostgreSQL. The graph remains the source of truth; the database is the durable backing store.

### 9.1 Core Tables

| Domain Object     | Table               | Notes                                                         |
| ----------------- | ------------------- | ------------------------------------------------------------- |
| KnowledgeNode     | knowledge_nodes     | Stores node identity, type, slug, title, difficulty, metadata |
| KnowledgeEdge     | knowledge_edges     | Stores source/target/type and relationship semantics          |
| NodeContent       | content_blocks      | Stores text, media, resources, assessments, and blocks        |
| LearnerState      | learner_states      | Stores learner progress state snapshot per node               |
| LearnerProfile    | learner_profiles    | Stores learner identity, preferences, objectives              |
| Career            | careers             | Stores career definitions and metadata                        |
| CareerRequirement | career_requirements | Maps career to required nodes and levels                      |
| Skill             | skills              | Stores skill definitions                                      |
| SkillNodeMap      | skill_node_maps     | Maps skills to graph nodes                                    |
| Assessment        | assessments         | Stores assessment definitions and scoring rules               |
| AssessmentResult  | assessment_results  | Stores learner submissions and scores                         |
| ImportJob         | import_jobs         | Stores import lifecycle and batch status                      |
| EventStore        | event_store         | Immutable append-only event log                               |
| CacheEntry        | cache_entries       | Optional operational cache metadata                           |

### 9.2 Indexes

- Primary indexes on node_id, edge_id, learner_id, career_id, assessment_id
- GIN or GIST indexes for JSONB metadata and tags
- Partial indexes for active state and incomplete imports
- Composite indexes for common traversal and recommendation queries

### 9.3 Views and Materialized Views

- vw_node_graph: denormalized graph view for traversal and search
- vw_learner_progress: current learner progress summary
- mv_recommendation_candidates: precomputed candidate view for hot paths

### 9.4 JSONB Usage

- Node metadata
- Content blocks
- Plugin configuration
- Import source metadata
- Recommendation rationale payloads

### 9.5 Partitioning

- event_store partitioned by month
- learner_states partitioned by learner hash or active/inactive status
- import_jobs partitioned by created_at month

### 9.6 Caching

- Redis for live learner state and hot graph queries
- Application-level in-memory cache for frequently-read node metadata
- Cache invalidation driven by domain events

### 9.7 Migration Strategy

- Schema changes are additive first
- Backfill runs in batches
- Downtime is avoided through online migration patterns
- Graph rehydration from event history is supported for recovery

---

## 10. Import Pipeline

The import system is a full pipeline for ingesting content into the graph while preserving integrity and versioning.

### 10.1 Pipeline Stages

1. Parser
   - Reads external content and normalizes input formats
   - Produces a canonical source document model

2. Validation
   - Checks required fields, duplicate slugs, and structure consistency
   - Emits validation errors and warnings

3. Transformation
   - Maps source content into domain objects
   - Produces node definitions, edges, skills, resources, and assessments

4. Graph Builder
   - Creates or updates graph nodes and edges
   - Applies versioning and graph snapshot creation

5. Integrity Checker
   - Validates the resulting graph for structural and semantic correctness
   - Fails or quarantines invalid imports

6. Versioning
   - Creates import version and graph snapshot
   - Retains rollback metadata

7. Dry Run
   - Validates import without writing state
   - Returns preview metrics and issues

8. Rollback
   - Reverts to previous graph version if import fails or is rejected

### 10.2 Progress Reporting

- Percent complete per stage
- Rows parsed, transformed, validated, and committed
- Queue depth and elapsed time
- Import health and error counts

### 10.3 Metrics

- total_nodes_added
- total_edges_added
- validation_errors
- transformation_failures
- rollback_count
- import_duration_ms

### 10.4 Import Contract

The import pipeline must:

- preserve deterministic behavior
- emit domain events at stage boundaries
- allow replay and dry-run mode
- enforce validation before mutation

---

## 11. Plugin Architecture

The system is extensible without modifying core packages. Extensions plug into open contracts.

### 11.1 Extension Points

#### New Engines

Contract:

- implement engine interface
- register via plugin manifest
- expose configuration and health probe

#### New Simulators

Contract:

- define scenario metadata
- expose run lifecycle
- return outcome and metrics

#### New Assessments

Contract:

- define prompt or rubric contract
- return scoring policy
- emit assessment events

#### New Graph Algorithms

Contract:

- implement traversal algorithm interface
- expose complexity metadata
- accept graph snapshot and constraints

#### New Content Blocks

Contract:

- define block schema
- declare rendering strategy
- assign to node content pipeline

#### New Recommendation Rules

Contract:

- implement recommendation rule interface
- provide ranking score and explanation
- operate on deterministic learner state

#### New Careers

Contract:

- define career metadata and required nodes
- register progression levels
- attach to graph via mapping rules

#### New Skills

Contract:

- define skill taxonomy
- map to one or more nodes
- participate in skill-gap computation

### 11.2 Plugin Registry

- Registry resolves plugin manifests at startup
- Plugins are version-checked and isolated behind interfaces
- Plugin configuration lives in the configuration layer
- Plugin failures do not crash the core system

---

## 12. Dependency Rules

These rules are mandatory for the long-term health of the system.

### 12.1 Allowed Dependencies

- API Layer -> Capability Layer, Configuration Layer, Utilities
- Capability Layer -> Engine Layer, Domain Layer, Event Layer
- Engine Layer -> Domain Layer, Event Layer, Infrastructure Layer, Persistence Layer via ports
- Domain Layer -> None beyond shared types
- Persistence Layer -> Domain Layer only
- Event Layer -> Domain Layer, Persistence Layer
- Caching Layer -> Infrastructure Layer, Configuration Layer

### 12.2 Forbidden Dependencies

- API Layer must not import persistence repositories directly
- Capability Layer must not import API Layer or persistence directly
- Engine Layer must not import web components or HTTP frameworks
- Domain Layer must not import infrastructure, persistence, or API frameworks
- Persistence Layer must not perform orchestration or emit capability-level events
- Event Layer must not invoke user-facing APIs

### 12.3 Circular Dependency Prevention

- Engines communicate through events for writes and query contracts for reads
- Capability layer is the only layer that orchestrates other layers
- Domain objects do not reference implementation packages
- Dependency inversion is enforced through interfaces and ports

### 12.4 Module Boundaries

Every module must expose a narrow public contract and hide implementation details. No module may reach across layers except through the allowed dependency graph.

---

## 13. Coding Standards

The codebase must be consistent, explicit, and maintainable over a decade.

### 13.1 Naming

- Use descriptive, domain-based names; avoid technical jargon where domain language exists
- Use PascalCase for classes, camelCase for methods, snake_case for modules and files in Python
- Use kebab-case for route segments and frontend file paths
- Use suffixes for concepts: Command, Query, Event, DTO, Service, Engine, Policy

### 13.2 Interfaces

- Interfaces must be explicit and small
- Prefer one responsibility per interface
- Avoid leaky abstractions and generic overuse

### 13.3 DTOs

- DTOs are immutable data contracts
- Name them by purpose, not by transport format
- Keep them free of behavior

### 13.4 Commands and Queries

- Commands mutate or request a state change
- Queries are read-only and side-effect free
- Commands and queries must be validated before execution

### 13.5 Events

- Events are immutable and versioned
- Names use past tense: NodeCreated, StateTransitioned
- Include correlation_id and causation_id

### 13.6 Errors

- Domain errors must be explicit and typed
- Do not return bare tuples or strings for failures
- Errors must contain context and remediation hints

### 13.7 Logging

- Logs must include request_id, correlation_id, actor_id, and operation_id
- Sensitive data must never be logged
- Business events should be emitted as structured logs

### 13.8 Testing

- Tests must be written before implementation changes to the behavior being modified
- Unit tests for engines and policies
- Integration tests across persistence and events
- End-to-end tests for full capability flows

### 13.9 Configuration

- No hardcoded secrets or environment values
- Every configurable threshold must be declared in settings
- Settings must fail fast on invalid configuration

### 13.10 Documentation

- Every public module and capability must provide concise docs
- API contracts and event contracts must remain versioned and discoverable
- Architecture decisions must be preserved in docs and ADRs

---

## 14. Testing Blueprint

Testing is a first-class engineering concern, not an afterthought.

### 14.1 Unit Tests

Coverage target:

- Engine logic: 90%+
- Capabilities: 85%+
- Domain policies: 95%+

Focus:

- Graph algorithms
- State transitions
- Recommendation ranking and explainability
- Validation rules

### 14.2 Integration Tests

Cover:

- API-to-capability execution
- Capability-to-engine orchestration
- Event delivery and persistence
- Cache invalidation and refresh behavior

### 14.3 Engine Tests

Each engine must have:

- interface conformance tests
- deterministic behavior tests
- failure mode tests
- integration tests with the persistence adapter

### 14.4 Graph Validation Tests

- cycle detection
- dependency consistency
- integrity after import and rollback
- health score consistency

### 14.5 Performance Tests

- traversal latency under realistic graph sizes
- recommendation execution under load
- import throughput and validation cost

### 14.6 Property-Based Tests

Use property-based testing for:

- traversal correctness
- graph invariants
- ranking stability under equivalent input
- event idempotency behavior

### 14.7 Contract Tests

- API contract tests for request/response envelopes
- Event contract tests for payload shape and versioning
- Plugin contract tests for extension lifecycle

### 14.8 End-to-End Tests

- Next-concept flow
- Roadmap generation flow
- Career comparison flow
- Import and rollback flow
- Assessment submission and state update flow

---

## 15. Build Order

The implementation order below is sequential and produces a runnable system at each milestone.

### Week 1 — Foundation

Deliverables:

- Repository skeleton
- Backend package structure
- Frontend route skeleton
- Shared types and config packages
- Basic health endpoints and CI setup

Dependencies:

- None

Runnable outcome:

- The monorepo runs locally with health checks and basic UI shell.

### Week 2 — Core Graph and Persistence

Deliverables:

- Graph Engine
- Knowledge Engine
- PostgreSQL schema and migrations
- Repository interfaces
- Basic graph read endpoints

Dependencies:

- Week 1

Runnable outcome:

- A user can view and inspect nodes and edges.

### Week 3 — Validation and Events

Deliverables:

- Validation Engine
- Event Engine
- Event store and retry handlers
- Import validation foundation

Dependencies:

- Week 2

Runnable outcome:

- Graph mutations are validated before commit and events are persisted.

### Week 4 — Learning State and Dependency Model

Deliverables:

- State Engine
- Dependency Engine
- Learner state persistence and transitions
- Dependency traversal APIs

Dependencies:

- Week 3

Runnable outcome:

- A learner can progress through concepts and unlock dependencies.

### Week 5 — Recommendation and Learning Path

Deliverables:

- Recommendation Engine
- Learning Path Engine
- Next-concept and roadmap capabilities
- Initial explanation support

Dependencies:

- Week 4

Runnable outcome:

- The system can suggest the next concept and generate a roadmap.

### Week 6 — Career and Assessment

Deliverables:

- Career Engine
- Assessment Engine
- Career comparison and gap analysis
- Assessment submission flow

Dependencies:

- Week 5

Runnable outcome:

- Learners can evaluate career fit and complete assessments.

### Week 7 — Search, Explorer, and Visualization

Deliverables:

- Search Engine
- Graph visualization surface
- Knowledge Explorer and Career Explorer UI
- Search and drill-down experience

Dependencies:

- Week 6

Runnable outcome:

- Users can browse, search, and visualize the graph.

### Week 8 — Import Pipeline and Admin Tools

Deliverables:

- Import Engine
- Dry-run and rollback flows
- Import progress reporting
- Admin UI for imports

Dependencies:

- Week 7

Runnable outcome:

- Content can be imported safely and validated before commit.

### Week 9 — Simulator, Roadmap, and Tutor Experience

Deliverables:

- Simulator Engine
- Roadmap experience
- AI Tutor integration points
- Plugin manifests and extension registry

Dependencies:

- Week 8

Runnable outcome:

- The major learner experiences are runnable end-to-end.

### Week 10 — Hardening and Scale Readiness

Deliverables:

- Performance tuning
- Caching policies
- Observability and alerting
- Contract test suite and deployment hardening

Dependencies:

- Week 9

Runnable outcome:

- The system is release-ready for pilot deployment.

---

## Final Engineering Note

This blueprint is the implementation contract for SV-OS. It does not redefine the architecture. It converts the approved architectural decisions into the concrete structure required for delivery: package boundaries, engine responsibilities, API contracts, event semantics, persistence mapping, extension points, dependency rules, standards, tests, and build order.
