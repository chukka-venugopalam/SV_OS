# SV-OS v2 Architecture — Knowledge Operating System

## Executive Architecture Document

**Author**: Architecture Review  
**Status**: Design Document — Not Yet Implemented  
**Date**: July 2026

---

## Table of Contents

1. [Architectural Philosophy](#1-architectural-philosophy)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Engine Architecture](#3-engine-architecture)
4. [Knowledge Graph Model](#4-knowledge-graph-model)
5. [Knowledge State Model](#5-knowledge-state-model)
6. [Graph Query Language (GQL)](#6-graph-query-language)
7. [Knowledge Validation System](#7-knowledge-validation-system)
8. [Recommendation System](#8-recommendation-system)
9. [API Architecture](#9-api-architecture)
10. [Data Model & Persistence](#10-data-model--persistence)
11. [Folder Structure](#11-folder-structure)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Risks & Tradeoffs](#14-risks--tradeoffs)
15. [Future-Proofing](#15-future-proofing)
16. [Engine Evaluation](#16-engine-evaluation)

---

## 1. Architectural Philosophy

### 1.1 Core Thesis

SV-OS is not a CRUD application with a recommendation layer. It is a **Knowledge Operating System** — a platform where the primary abstraction is a living, queryable graph of concepts, relationships, and learner states. The database is an implementation detail of persistence. The APIs are surfaces of engine capabilities. The frontend is a collection of viewers that render the graph's current state.

### 1.2 What We Got Wrong in the Previous Plan

| Previous Assumption                        | Corrected View                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| The database is the source of truth        | The Knowledge Graph (in memory) is the source of truth; the database is a persistent cache |
| API endpoints map to database tables       | API endpoints map to engine capabilities                                                   |
| Services wrap repositories                 | Engines wrap domain logic; services orchestrate engines                                    |
| Progress = 4 states                        | Knowledge state is a multi-dimensional model                                               |
| Recommendations = weighted scoring formula | Recommendations = result of graph traversal + state analysis + goal optimization           |
| Import = batch data load                   | Import = graph versioning + validation + diff                                              |
| Frontend = pages                           | Frontend = viewers + interaction surfaces                                                  |
| Engines are optional features              | Engines ARE the product                                                                    |

### 1.3 Design Principles (Ranked)

1. **The Graph is Everything** — Every feature emerges from the graph. If it can't be expressed as a graph operation, it doesn't belong.
2. **Engines over Services** — Business logic lives in pure, testable engines. Services are thin orchestrators that wire engines to the outside world.
3. **State over Status** — Knowledge state is a rich model (10+ dimensions), not a 4-value enum.
4. **Validation before Mutation** — Every graph mutation (import, edit, delete) passes through the validation engine before affecting state.
5. **Capabilities over CRUD** — APIs describe what you can DO, not what you can READ/WRITE.
6. **Deterministic over ML by Default** — Recommendations, paths, and rankings should be deterministic and explainable. ML is additive, not foundational.
7. **Scale-Neutral Design** — Every algorithm and data structure should have documented complexity for V=10^2, V=10^4, and V=10^6.
8. **Engines are Composable** — Every engine exposes a capability that other engines can call. No engine owns user data.

---

## 2. System Architecture Overview

### 2.1 Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  React Frontend (Viewers, Interaction Surfaces, Dashboards)  │
└──────────────────────────┬───────────────────────────────────┘
                           │ Capability-based API calls
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       API LAYER                              │
│  Thin route handlers that validate auth, call engines,       │
│  format responses. NO business logic.                        │
└──────────────────────────┬───────────────────────────────────┘
                           │ Calls engine capabilities
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      ENGINE LAYER                            │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Graph       │ │ Knowledge    │ │ Learning     │         │
│  │ Engine      │ │ Engine       │ │ Path Engine  │         │
│  ├─────────────┤ ├──────────────┤ ├──────────────┤         │
│  │ Traversal   │ │ Validation   │ │ Curriculum   │         │
│  │ Engine      │ │ Engine       │ │ Engine       │         │
│  ├─────────────┤ ├──────────────┤ ├──────────────┤         │
│  │ Query       │ │ State        │ │ Milestone    │         │
│  │ Engine      │ │ Engine       │ │ Engine       │         │
│  ├─────────────┤ ├──────────────┤ ├──────────────┤         │
│  │ Dependency  │ │ Revision     │ │ Skill        │         │
│  │ Engine      │ │ Engine       │ │ Engine       │         │
│  ├─────────────┤ ├──────────────┤ ├──────────────┤         │
│  │ Analytics   │ │ Search       │ │ Competency   │         │
│  │ Engine      │ │ Engine       │ │ Engine       │         │
│  ├─────────────┤ ├──────────────┤ ├──────────────┤         │
│  │ Import      │ │ Export       │ │ Knowledge    │         │
│  │ Engine      │ │ Engine       │ │ Health Engine│         │
│  └─────────────┘ └──────────────┘ └──────────────┘         │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Recommendation  │ Career     │ │ Simulator    │         │
│  │ Engine       │ │ Engine       │ │ Engine       │         │
│  ├─────────────┤ ├──────────────┤ ├──────────────┤         │
│  │ Project     │ │ Assessment   │ │ Roadmap      │         │
│  │ Engine       │ │ Engine       │ │ Engine       │         │
│  ├─────────────┤ ├──────────────┤ ├──────────────┤         │
│  │ Unlock      │ │ Prerequisite │ │ Knowledge    │         │
│  │ Engine       │ │ Solver       │ │ Diff Engine  │         │
│  └─────────────┘ └──────────────┘ └──────────────┘         │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Graph       │ │ Relationship │ │ Learning     │         │
│  │ Viz Engine  │ │ Discovery    │ │ Strategy     │         │
│  │             │ │ Engine       │ │ Engine       │         │
│  └─────────────┘ └──────────────┘ └──────────────┘         │
│  ┌─────────────┐ ┌──────────────┐                          │
│  │ Learning    │ │ Caching      │                          │
│  │ State Engine│ │ Engine       │                          │
│  └─────────────┘ └──────────────┘                          │
└──────────────────────────┬───────────────────────────────────┘
                           │ Reads/writes via repositories
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                          │
│  PostgreSQL (Primary) + Redis (Cache) + Vector Store (Optional)│
│  Repositories are the ONLY layer that touches the database.   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow (Request Lifecycle)

```
Learner asks: "What should I learn next?"

1. API Layer receives: POST /capabilities/next-concept
   - Validates auth, parses params
   - Calls RecommendationEngine.get_next_concept(user_id, context)

2. RecommendationEngine:
   a. Calls LearningStateEngine.get_learner_state(user_id)
      → Returns: {completed, mastering, learning, forgotten, ...}
   b. Calls CareerEngine.get_active_goals(user_id)
      → Returns: [{career_id, target_level, priority}]
   c. Calls GraphEngine.get_reachable_nodes(completed_ids, max_depth=3)
      → Returns: [{node_id, distance, prerequisites_satisfied}]
   d. Calls StateEngine.compute_readiness(reachable_nodes, learner_state)
      → Returns: [{node_id, readiness_score, blockers}]
   e. Calls PrerequisiteSolver.find_optimal_next(readiness_scores, career_goals)
      → Returns: [{node_id, score, reasons}]
   f. Calls MilestoneEngine.suggest_learning_plan(top_nodes)
      → Returns: [{week, nodes, estimated_hours}]

3. API Layer formats and returns:
   {
     concept: {...},
     reason: "Completes your Backend Engineer path milestone 3",
     readiness: 0.87,
     estimated_hours: 12,
     unlocks: ["OS-005", "DB-004"],
     blocked_by: null,
     alternatives: [...]
   }
```

---

## 3. Engine Architecture

### 3.1 Engine Design Pattern

Every engine follows the same contract:

```python
class EngineInterface(ABC):
    """Base contract for all SV-OS engines."""

    @property
    def name(self) -> str: ...

    @property
    def version(self) -> str: ...

    @property
    def capabilities(self) -> list[Capability]: ...

    async def validate(self, context: EngineContext) -> ValidationResult: ...
```

### 3.2 Engines — Complete Design

Below is the definitive evaluation of all 37 proposed engines. Each engine that survives includes its full design. Engines marked as **REJECTED** include justification.

---

#### 3.2.1 Graph Engine ★ CORE

**Status**: ✅ KEEP — The foundation engine

**Purpose**: The Graph Engine is the single source of truth for the knowledge graph's structure. It owns the in-memory graph representation and all structural queries.

**Responsibilities**:

- Maintain the authoritative graph representation (adjacency list in memory)
- Load graph from persistence on startup
- Provide atomic graph operations (add_node, remove_node, add_edge, remove_edge)
- Batch load for subgraphs
- Expose graph metadata (node_count, edge_count, categories, etc.)

**Public Interface**:

```python
class GraphEngine(EngineInterface):
    async def get_node(self, node_id: NodeID) -> KnowledgeNode
    async def get_nodes(self, node_ids: list[NodeID]) -> list[KnowledgeNode]
    async def get_edge(self, source_id: NodeID, target_id: NodeID, edge_type: EdgeType) -> KnowledgeEdge | None
    async def get_neighbors(self, node_id: NodeID, direction: Direction, edge_type: EdgeType | None = None) -> list[KnowledgeNode]
    async def get_subgraph(self, node_ids: list[NodeID], depth: int) -> KnowledgeSubgraph
    async def node_exists(self, node_id: NodeID) -> bool
    async def edge_exists(self, source_id: NodeID, target_id: NodeID, edge_type: EdgeType) -> bool
    async def all_nodes(self) -> list[KnowledgeNode]
    async def all_edges(self, edge_type: EdgeType | None = None) -> list[KnowledgeEdge]
    async def count_by_type(self, node_type: NodeType) -> int
    async def refresh(self) -> None  # Reload from persistence
```

**Dependencies**: None (foundational)
**Performance**: O(1) node/edge lookup, O(d) neighbor lookup where d = degree
**Scale Notes**: For 10^6 nodes, consider Neo4j or Memgraph instead of in-memory dicts

---

#### 3.2.2 Knowledge Engine ★ CORE

**Status**: ✅ KEEP — The domain model owner

**Purpose**: The Knowledge Engine owns the full domain model for knowledge nodes — not just graph structure but all content fields, learning objectives, resources, skills, and metadata.

**Responsibilities**:

- Maintain node content (avoid the `node_details` anti-pattern — do NOT separate structure from content)
- Provide CRUD for node content fields
- Maintain category taxonomy
- Support full-text content search (delegates to Search Engine for actual search)
- Provide flat vs. full node views

**Public Interface**:

```python
class KnowledgeEngine(EngineInterface):
    async def get_node_content(self, node_id: NodeID) -> NodeContent  # Full content with all fields
    async def get_node_meta(self, node_id: NodeID) -> NodeMeta  # Lightweight for traversal
    async def search_content(self, query: str, filters: ContentFilter) -> list[KnowledgeNode]
    async def get_categories(self) -> list[Category]
    async def get_nodes_by_category(self, category: str) -> list[KnowledgeNode]
    async def get_nodes_by_difficulty(self, difficulty: Difficulty) -> list[KnowledgeNode]
    async def get_nodes_by_tag(self, tag: str) -> list[KnowledgeNode]
    async def get_content_blocks(self, node_id: NodeID, block_type: BlockType | None = None) -> list[ContentBlock]
```

**Dependencies**: Graph Engine
**Migrates from**: Existing `KnowledgeNodeService`

---

#### 3.2.3 Traversal Engine ★ CORE

**Status**: ✅ KEEP

**Purpose**: All graph traversal algorithms in one place. BFS, DFS, shortest path, multi-source BFS, k-nearest neighbors, community detection, and more.

**Responsibilities**:

- BFS/DFS with configurable depth and edge type filtering
- Unweighted shortest path (BFS)
- Weighted shortest path (Dijkstra) — for future use with edge weights as difficulty
- Multi-source BFS (what nodes are reachable from a set of starting nodes)
- All-pairs reachability within depth limit
- Cycle detection

**Public Interface**:

```python
class TraversalEngine(EngineInterface):
    async def bfs(self, start_id: NodeID, depth: int, edge_types: list[EdgeType] | None = None) -> TraversalResult
    async def dfs(self, start_id: NodeID, depth: int, edge_types: list[EdgeType] | None = None) -> TraversalResult
    async def shortest_path(self, source_id: NodeID, target_id: NodeID, max_depth: int) -> PathResult
    async def multi_source_bfs(self, start_ids: list[NodeID], depth: int, edge_types: list[EdgeType] | None = None) -> TraversalResult
    async def reachable_nodes(self, from_ids: list[NodeID], max_depth: int, edge_types: list[EdgeType] | None = None) -> set[NodeID]
    async def detect_cycles(self) -> list[Cycle]
    async def find_connected_components(self) -> list[set[NodeID]]
```

**Dependencies**: Graph Engine
**Performance**: O(V + E) BFS/DFS, O((V+E)log V) Dijkstra
**Migrates from**: Existing `GraphTraversalService`

---

#### 3.2.4 Learning Path Engine ★ CORE

**Status**: ✅ KEEP

**Purpose**: Generate, optimize, and manage learning paths. A learning path is an ordered sequence of nodes from a learner's current state to a goal.

**Responsibilities**:

- Generate paths from current state to any goal node
- Optimize paths for time, difficulty, or breadth
- Generate paths for career goals (career → required nodes → prerequisite chain)
- Re-plan paths when learner state changes
- Generate alternative paths (e.g., "fastest", "most thorough", "easiest")
- Path diff (what changed since last plan)

**Public Interface**:

```python
class LearningPathEngine(EngineInterface):
    async def generate_path(self, learner_state: LearnerState, goal_id: NodeID, strategy: PathStrategy) -> LearningPath
    async def generate_career_path(self, learner_state: LearnerState, career_id: CareerID, seniority_level: SeniorityLevel) -> LearningPath
    async def optimize_path(self, path: LearningPath, constraint: PathConstraint) -> LearningPath
    async def replan_path(self, learner_state: LearnerState, current_path: LearningPath) -> LearningPath
    async def generate_alternative_paths(self, learner_state: LearnerState, goal_id: NodeID, count: int) -> list[LearningPath]
    async def diff_paths(self, old_path: LearningPath, new_path: LearningPath) -> PathDiff
    async def estimate_completion(self, path: LearningPath, learner_pace: float) -> TimeEstimate
    async def recommend_path_strategy(self, learner_state: LearnerState, goal_id: NodeID) -> PathStrategy
```

**Dependencies**: Graph Engine, Traversal Engine, State Engine, Career Engine
**Migrates from**: Existing `LearningPathGenerator` (replace the weak implementation)

---

#### 3.2.5 Recommendation Engine

**Status**: ✅ KEEP — But MUST be redesigned completely

**Purpose**: Recommend what to learn next, what to review, and what to skip. This is the most visible engine.

**Current Problems**:

- Fixed linear weights (0.30, 0.25, 0.20, 0.15, 0.10) are arbitrary
- No knowledge state awareness
- No career goal integration
- No learning velocity signal
- No assessment score integration
- No understanding of review cycles (spaced repetition)
- Popularity-based scoring is inappropriate for learning

**Redesigned Interface**:

```python
class RecommendationEngine(EngineInterface):
    async def get_next_concept(self, learner_state: LearnerState, context: RecommendationContext) -> Recommendation
    async def get_next_n_concepts(self, learner_state: LearnerState, context: RecommendationContext, n: int) -> list[Recommendation]
    async def get_review_candidates(self, learner_state: LearnerState, limit: int) -> list[Recommendation]
    async def get_skip_candidates(self, learner_state: LearnerState, reason: SkipReason) -> list[Recommendation]
    async def get_simulator_recommendation(self, learner_state: LearnerState, node_id: NodeID) -> SimulatorRecommendation
    async def get_project_recommendation(self, learner_state: LearnerState, skill_set: set[NodeID]) -> ProjectRecommendation
    async def explain_recommendation(self, recommendation_id: RecommendationID) -> RecommendationExplanation
    async def get_daily_plan(self, learner_state: LearnerState, available_hours: float) -> DailyPlan
```

**Algorithm**: Pure deterministic (see Section 8)
**Dependencies**: Graph Engine, Traversal Engine, State Engine, Career Engine, Prerequisite Solver
**Migrates from**: Existing `RecommendationEngine` (replace entirely)

---

#### 3.2.6 Career Engine

**Status**: ✅ KEEP

**Purpose**: Manage career definitions, career-node mappings, and seniority ladder. Support career comparison, career gap analysis, and career path generation.

**Responsibilities**:

- Career CRUD
- Career-to-node mapping (required, optional, bonus)
- Seniority level management (10 levels)
- Career comparison (find delta between two careers)
- Career gap analysis (what nodes are missing to reach a career)
- Career recommendation based on completed nodes
- Seniority progression within a career

**Public Interface**:

```python
class CareerEngine(EngineInterface):
    async def get_career(self, career_id: CareerID) -> Career
    async def list_careers(self, filters: CareerFilter) -> list[Career]
    async def compare_careers(self, career_ids: list[CareerID]) -> CareerComparison
    async def get_career_gap(self, learner_state: LearnerState, career_id: CareerID, seniority_level: SeniorityLevel) -> SkillGap
    async def get_career_path(self, learner_state: LearnerState, career_id: CareerID) -> LearningPath
    async def recommend_career(self, learner_state: LearnerState) -> list[CareerRecommendation]
    async def get_seniority_progression(self, career_id: CareerID) -> list[SeniorityLevel]
    async def get_nodes_for_level(self, career_id: CareerID, seniority_level: SeniorityLevel) -> list[KnowledgeNode]
    async def get_common_nodes(self, career_id_a: CareerID, career_id_b: CareerID) -> set[NodeID]
    async def get_unique_nodes(self, career_id_a: CareerID, career_id_b: CareerID) -> set[NodeID]
```

**Dependencies**: Graph Engine, Knowledge Engine
**Migrates from**: Existing `CareerService`

---

#### 3.2.7 Project Engine

**Status**: ✅ KEEP

**Purpose**: Manage projects (hands-on exercises), project-node mappings, and project-level framework. Recommend appropriate projects based on skill set.

**Responsibilities**:

- Project CRUD
- Project-level framework (8 levels: Tiny Exercise → Research Project)
- Project-to-node mapping
- Project recommendation based on completed/skill nodes
- Project difficulty estimation based on learner's state
- Project roadmap generation (sequence of projects for a career)

**Public Interface**:

```python
class ProjectEngine(EngineInterface):
    async def list_projects(self, filters: ProjectFilter) -> list[Project]
    async def get_project(self, project_id: ProjectID) -> Project
    async def get_projects_for_node(self, node_id: NodeID) -> list[Project]
    async def recommend_project(self, learner_state: LearnerState, node_id: NodeID | None = None) -> ProjectRecommendation
    async def generate_project_roadmap(self, learner_state: LearnerState, career_id: CareerID) -> list[Project]
    async def get_project_levels(self) -> list[ProjectLevel]
    async def estimate_project_readiness(self, learner_state: LearnerState, project_id: ProjectID) -> ReadinessScore
```

**Dependencies**: Graph Engine, State Engine, Knowledge Engine
**Migrates from**: Existing `ProjectService`

---

#### 3.2.8 Simulator Engine

**Status**: ✅ KEEP

**Purpose**: Manage simulator definitions, node-simulator mappings, and simulator feasibility metadata. Recommend appropriate simulators for nodes.

**Responsibilities**:

- Simulator CRUD
- Node-to-simulator mapping
- Simulator feasibility tracking (HTML/Canvas vs WebGL vs Three.js)
- Simulator recommendation based on node content
- Simulator launch metadata (which technology, effort estimate)

**Public Interface**:

```python
class SimulatorEngine(EngineInterface):
    async def list_simulators(self, filters: SimulatorFilter) -> list[Simulator]
    async def get_simulator(self, simulator_id: SimulatorID) -> Simulator
    async def get_simulators_for_node(self, node_id: NodeID) -> list[Simulator]
    async def recommend_simulator(self, learner_state: LearnerState, node_id: NodeID) -> SimulatorRecommendation
    async def get_implementation_effort(self, simulator_id: SimulatorID) -> EffortEstimate
    async def get_simulators_by_category(self, category: str) -> list[Simulator]
```

**Dependencies**: Graph Engine, Knowledge Engine, Project Engine

---

#### 3.2.9 Assessment Engine

**Status**: ✅ KEEP

**Purpose**: Define assessments, assessment-node mappings, and track assessment results. Assessments validate knowledge state transitions.

**Responsibilities**:

- Assessment CRUD (quiz, coding challenge, interview question, practice exercise)
- Assessment-to-node mapping
- Assessment result tracking per learner
- Knowledge state verification (did the learner actually master this?)
- Difficulty calibration based on results
- Assessment recommendation for knowledge state validation

**Public Interface**:

```python
class AssessmentEngine(EngineInterface):
    async def get_assessments_for_node(self, node_id: NodeID, assessment_type: AssessmentType | None = None) -> list[Assessment]
    async def submit_result(self, learner_id: UserID, assessment_id: AssessmentID, result: AssessmentResult) -> AssessmentOutcome
    async def get_learner_assessment_history(self, learner_id: UserID, node_id: NodeID | None = None) -> list[AssessmentRecord]
    async def verify_mastery(self, learner_state: LearnerState, node_id: NodeID) -> MasteryVerification
    async def recommend_assessment(self, learner_state: LearnerState, node_id: NodeID) -> AssessmentRecommendation
    async def calibrate_difficulty(self, assessment_id: AssessmentID) -> DifficultyCalibration
```

**Dependencies**: State Engine, Knowledge Engine

---

#### 3.2.10 Event Engine

**Status**: ✅ NEW — CRITICAL MISSING PIECE from original review

**Purpose**: Own all domain events and provide publish/subscribe for cross-engine communication. Every state change across the 24 engines emits an event. The Event Engine ensures reliable delivery, prevents duplicate processing, and enables event replay for debugging.

**Why this must exist**: Without it, 24 engines would directly call each other, creating a tangled dependency graph. Events decouple engines and make the system testable, debuggable, and auditable.

**Responsibilities**:

- Define event schema and validation
- Provide publish/subscribe API
- Guarantee at-least-once delivery
- Retry with exponential backoff (3 attempts, then dead-letter queue)
- Idempotency key deduplication
- Event replay for debugging and state reconstruction
- Event sourcing for critical state (learner progress)

**Event Types**:

```python
class DomainEvent(ABC):
    event_id: UUID
    event_type: str
    aggregate_id: str
    timestamp: datetime
    idempotency_key: str
    metadata: dict

# Concrete events
class NodeEncountered(DomainEvent): ...
class NodeStudied(DomainEvent): learner_id, node_id, duration_minutes
class NodePracticed(DomainEvent): learner_id, node_id, project_id
class NodeApplied(DomainEvent): learner_id, node_id, context
class AssessmentSubmitted(DomainEvent): learner_id, node_id, assessment_id, score
class NodeMastered(DomainEvent): learner_id, node_id
class NodeForgotten(DomainEvent): learner_id, node_id
class NodeDeprecated(DomainEvent): node_id, replacement_node_id
class GraphImported(DomainEvent): version_id, node_count, edge_count
class GraphValidated(DomainEvent): version_id, health_score
```

**Public Interface**:

```python
class EventEngine(EngineInterface):
    async def publish(self, event: DomainEvent) -> None
    async def subscribe(self, event_type: str, handler: EventHandler) -> Subscription
    async def unsubscribe(self, subscription: Subscription) -> None
    async def replay(self, event_type: str, from_time: datetime, to_time: datetime) -> list[DomainEvent]
    async def get_event_history(self, aggregate_id: str) -> list[DomainEvent]
    async def get_dead_letter_queue(self) -> list[FailedEvent]
    async def retry_dead_letter(self, event_id: UUID) -> None
```

**Dependencies**: None (foundational — all engines depend on it)

**Consumers**: State Engine (state transitions), Analytics Engine (metrics), Revision Engine (forgetting curve updates), Recommendation Engine (cache invalidation)

**Startup**: Event Engine starts first, before all other engines. Other engines register subscriptions during their own startup.

---

#### 3.2.11 Scheduling Engine

**Status**: ✅ NEW — extracted from Recommendation Engine

**Purpose**: Given a set of recommended nodes (from Recommendation Engine), decide _when_ and _in what order_ to study them within a day, week, or month. Scheduling is distinct from recommendation — one decides _what_, the other decides _when_.

**Responsibilities**:

- Generate daily/weekly study plans from recommendations + reviews
- Respect time constraints (available minutes per day)
- Respect scheduling preferences (morning vs evening, weekdays vs weekends)
- Prioritize reviews before new content
- Balance difficulty across sessions
- Handle overlapping deadlines

**Public Interface**:

```python
class SchedulingEngine(EngineInterface):
    async def generate_daily_plan(self, learner_state: LearnerState, available_minutes: float, preferences: SchedulePreferences) -> DailyPlan
    async def generate_weekly_plan(self, learner_state: LearnerState, daily_budget: float, preferences: SchedulePreferences) -> WeeklyPlan
    async def reschedule(self, learner_id: UserID, missed_sessions: list[SessionID]) -> RevisedPlan
    async def get_optimal_order(self, items: list[SchedulableItem], constraint: TimeConstraint) -> list[SchedulableItem]
```

**Dependencies**: Recommendation Engine, Revision Engine, State Engine

---

#### 3.2.12 Knowledge Validation Engine ★ CORE

**Status**: ✅ KEEP — CRITICAL MISSING PIECE

**Purpose**: Validate every graph mutation before it's committed. This is the "linting" phase of graph operations. Prevents data corruption.

**Responsibilities**:

- Referential integrity (every edge endpoint must exist)
- Duplicate detection (by slug, by title+category)
- Disconnected graph detection (nodes with no edges)
- Impossible prerequisites (node is prerequisite of itself transitively)
- Invalid careers (career requires nodes that don't exist)
- Invalid simulators (simulator links to nodes that don't exist)
- Broken decomposition trees (orphaned decomposition entries)
- Graph health scoring (overall cohesion, density, connectivity)

**Cycle Detection Strategy**: Full DFS-based cycle detection (O(V+E)) is too expensive for every single edge mutation. SV-OS uses **incremental cycle detection**:

1. Maintain a topological order index for every node (computed via Kahn's algorithm on startup/import)
2. On edge insertion (A → B): if `order[A] < order[B]`, the edge preserves the existing order and cannot create a cycle. O(1) check.
3. On edge deletion: recalculate order for the affected subgraph only. O(k) where k = subgraph size.
4. On import: full validation runs after the import, not during each row insertion.
5. Full graph revalidation runs as a background job on a schedule (daily) or on demand.

**This design means edge mutations during regular operation are O(1) — no DFS per mutation.**

**Public Interface**:

```python
class KnowledgeValidationEngine(EngineInterface):
    async def validate_import(self, graph_data: RawGraphData) -> ValidationReport
    async def validate_before_commit(self, operation: GraphOperation) -> ValidationReport

    # Incremental cycle detection
    async def would_create_cycle(self, source_id: NodeID, target_id: NodeID) -> bool  # O(1)
    async def ensure_topological_order(self, node_ids: list[NodeID]) -> list[NodeID]

    # Full graph validation (async/background)
    async def compute_health_score(self) -> GraphHealthScore
    async def detect_orphaned_references(self) -> list[OrphanedReference]
```

---

#### 3.2.13 Query Engine

**Status**: ✅ KEEP — but GQL is marked as v2 feature; basic execution in v1

**Purpose**: Execute expressive queries against the knowledge graph using the SV-OS Graph Query Language (see Section 6).

**Responsibilities**:

- Parse GQL queries (v2: full language; v1: subset of 10 most common queries)
- Optimize query execution
- Execute queries by composing engine capabilities
- Return structured results
- Query caching
- Explain query plans

**GQL Implementation Staging**:

- **v1 (now)**: 10 concrete RPC endpoints; no parser. Each endpoint directly calls engine capabilities. `FIND path(a,b)` → POST `/capabilities/find-path`.
- **v2 (6 months)**: Full GQL parser, AST, optimizer, executor. Add filtering (`WHERE`), projection (`RETURN`), composition (sub-queries), pagination (`LIMIT/OFFSET`).
- **v3 (12 months)**: Named queries, query libraries, EXPLAIN plans, persistent query caching.

The architecture is designed for GQL v2, but implementation starts with simpler RPC endpoints.

**Public Interface**:

```python
class QueryEngine(EngineInterface):
    async def execute(self, query: GQLQuery) -> QueryResult          # v2+
    async def execute_rpc(self, operation: RPCOperation) -> QueryResult  # v1
    async def explain(self, query: GQLQuery) -> QueryPlan
```

**Dependencies**: Graph Engine, Traversal Engine

---

#### 3.2.14 State Engine ★ CORE

**Status**: ✅ KEEP — CRITICAL FOR REDESIGN

**Purpose**: Own the learner's knowledge state for every node. This is the most sophisticated part of the architecture. See Section 5 for the full state model.

**Boundary**: The State Engine is the ONLY engine that reads/writes learner-node state. The Recommendation Engine, Revision Engine, and all other engines query the State Engine — they never read `learner_knowledge_states` directly and never call the Graph Engine for learner-related queries. This enforces layering.

**Public Interface**:

```python
class StateEngine(EngineInterface):
    async def get_learner_state(self, learner_id: UserID) -> LearnerState
    async def get_node_state(self, learner_id: UserID, node_id: NodeID) -> KnowledgeState
    async def get_states_for_nodes(self, learner_id: UserID, node_ids: list[NodeID]) -> dict[NodeID, KnowledgeState]
    async def transition_state(self, learner_id: UserID, node_id: NodeID, event: LearningEvent) -> StateTransition
    async def set_state_manually(self, learner_id: UserID, node_id: NodeID, state: KnowledgeStateValue, reason: str) -> StateTransition
    async def get_learner_stats(self, learner_id: UserID) -> LearnerStats
    async def get_weak_nodes(self, learner_id: UserID, threshold: float) -> list[NodeStatePair]
    async def get_stale_nodes(self, learner_id: UserID, days: int) -> list[NodeStatePair]
    async def get_nodes_needing_review(self, learner_id: UserID) -> list[NodeStatePair]
    async def get_nodes_ready_to_learn(self, learner_id: UserID) -> list[NodeStatePair]
    async def batch_transition(self, learner_id: UserID, transitions: list[StateTransitionRequest]) -> list[StateTransition]
    async def compute_learning_velocity(self, learner_id: UserID, days: int) -> LearningVelocity
    async def get_mastery_by_category(self, learner_id: UserID) -> dict[str, float]

    # Cross-engine queries (used by Recommendation, Revision, Analytics)
    async def get_completed_node_ids(self, learner_id: UserID) -> set[NodeID]
    async def get_terminal_node_ids(self, learner_id: UserID) -> set[NodeID]
    async def get_states_by_primary(self, learner_id: UserID, primary_state: KnowledgeStateValue) -> dict[NodeID, KnowledgeState]
```

**Dependencies**: Event Engine (publishes events for state transitions), Graph Engine (to validate node_id at the boundary), Assessment Engine (optional, for state verification)
**Performance**: Must cache LearnerState aggressively. A full learner state load across 10^4 nodes should be < 100ms.

**Scale**: For 1M learners × 100 nodes = 100M rows, the `learner_knowledge_states` table is partitioned by `learner_id % 16` (16 partitions). Active states (primary_state NOT IN ('deprecated')) are in a hot table; deprecated states are moved to a cold archive monthly.

---

#### 3.2.13 Dependency Engine

**Status**: ✅ KEEP

**Purpose**: Compute and manage dependency relationships between nodes. "If learner studies X, what does that unlock?"

**Responsibilities**:

- Compute unlock chains (transitive closure of prerequisites)
- Find blockers (what's preventing study of node X)
- Find downstream impact (if node X changes, what's affected)
- Compute dependency depth
- Find dependency bottlenecks (nodes with highest downstream impact)

**Public Interface**:

```python
class DependencyEngine(EngineInterface):
    async def get_unlock_chain(self, node_id: NodeID, max_depth: int) -> list[KnowledgeNode]
    async def get_prerequisite_chain(self, node_id: NodeID, max_depth: int) -> list[KnowledgeNode]
    async def find_blockers(self, learner_state: LearnerState, node_id: NodeID) -> list[KnowledgeNode]
    async def find_downstream_impact(self, node_id: NodeID, max_depth: int) -> list[KnowledgeNode]
    async def compute_dependency_depth(self, node_id: NodeID) -> int
    async def find_bottlenecks(self) -> list[BottleneckReport]
    async def get_dependency_graph(self, node_ids: list[NodeID]) -> KnowledgeSubgraph
    async def is_prerequisite_satisfied(self, learner_state: LearnerState, node_id: NodeID) -> bool
```

**Dependencies**: Graph Engine, Traversal Engine
**Performance**: Chain operations use BFS with max_depth bound. For 10^6 nodes, depth should be limited to 10-15.

---

#### 3.2.14 Unlock Engine

**Status**: REJECTED — Merge into Dependency Engine

**Rationale**: "Unlock" is semantically identical to "forward dependency" (if A is prerequisite of B, then A unlocks B). The Dependency Engine already computes this. A separate Unlock Engine would duplicate logic and create synchronization issues. The `unlocks` field in the JSON is already explicitly marked as derived.

---

#### 3.2.15 Revision Engine

**Status**: ✅ KEEP

**Purpose**: Generate revision schedules based on forgetting curves, knowledge state, and assessment scores. Implement spaced repetition for knowledge nodes.

**Public Interface**:

```python
class RevisionEngine(EngineInterface):
    async def generate_revision_schedule(self, learner_state: LearnerState, horizon_days: int) -> RevisionSchedule
    async def get_due_revisions(self, learner_state: LearnerState) -> list[RevisionItem]
    async def compute_retention_score(self, learner_state: LearnerState, node_id: NodeID) -> float
    async def adjust_schedule(self, learner_state: LearnerState, assessment_result: AssessmentResult) -> RevisionSchedule
    async def get_revision_history(self, learner_id: UserID, node_id: NodeID) -> list[RevisionRecord]
```

**Dependencies**: State Engine, Assessment Engine
**Performance**: The forgetting curve model is O(1) per node. Full schedule generation is O(k) where k = nodes needing review.

---

#### 3.2.18 Analytics Engine

**Status**: REJECTED — Split into two distinct engines

**Rationale**: "Analytics" is too broad. It conflates graph-level analysis (graph health, density, bottlenecks) with learner-level analysis (progress, velocity, completion forecasts). These have different data sources, performance characteristics, and consumers.

**Replacements**:

- **Graph Analytics Engine**: Graph-level metrics (centrality, bottlenecks, density, depth distribution, etc.) — merges into Graph Engine
- **Learning Analytics Engine**: Learner-level metrics (pace, completion rates, weak topics, forecasts)

Both are described below.

---

#### 3.2.20 Learning Analytics Engine

**Status**: ✅ KEEP (split from Analytics)

**Public Interface**:

```python
class GraphAnalyticsEngine(EngineInterface):
    async def degree_centrality(self, limit: int) -> list[CentralityResult]
    async def prerequisite_bottlenecks(self, limit: int) -> list[BottleneckResult]
    async def isolated_nodes(self) -> list[KnowledgeNode]
    async def concept_depth_distribution(self) -> DepthDistribution
    async def graph_density(self) -> DensityResult
    async def branching_factor(self) -> BranchingResult
    async def connectivity(self) -> ConnectivityResult
    async def category_distribution(self) -> dict[str, int]
    async def difficulty_distribution(self) -> dict[str, int]
```

**Dependencies**: Graph Engine, Knowledge Engine
**Migrates from**: Existing `GraphAnalyticsService`

---

#### 3.2.18 Learning Analytics Engine

**Status**: ✅ KEEP (split from Analytics)

**Purpose**: Learner-level analytics — understanding individual learning patterns.

**Public Interface**:

```python
class LearningAnalyticsEngine(EngineInterface):
    async def get_learner_stats(self, learner_id: UserID) -> LearnerStats
    async def get_learning_velocity(self, learner_id: UserID, days: int) -> LearningVelocity
    async def get_completion_forecast(self, learner_state: LearnerState, goal_id: NodeID | None = None) -> CompletionForecast
    async def get_weekly_activity(self, learner_id: UserID, weeks: int) -> WeeklyActivity
    async def get_category_mastery(self, learner_id: UserID) -> dict[str, float]
    async def get_learning_streak(self, learner_id: UserID) -> LearningStreak
    async def get_difficulty_progression(self, learner_id: UserID) -> DifficultyProgression
    async def identify_learning_patterns(self, learner_id: UserID) -> LearningPattern
```

**Dependencies**: State Engine, Career Engine
**Migrates from**: Existing `ProgressIntelligence`

---

#### 3.2.21 Search Engine

**Status**: ✅ KEEP

**Purpose**: Full-text search, autocomplete, and ranking across all knowledge nodes. Supports regular and semantic search.

**Responsibilities**:

- Full-text search (PostgreSQL tsvector)
- Autocomplete/suggestions
- Search history tracking
- Trending searches
- Search result ranking
- Faceted filtering (by type, difficulty, category, career)

**Public Interface**:

```python
class SearchEngine(EngineInterface):
    async def search(self, query: str, filters: SearchFilter, page: int, per_page: int) -> SearchResult
    async def suggest(self, partial_query: str, limit: int) -> list[str]
    async def search_by_career(self, query: str, career_id: CareerID) -> SearchResult
    async def get_trending(self, limit: int) -> list[TrendingQuery]
    async def get_search_history(self, learner_id: UserID) -> list[SearchRecord]
    async def clear_search_history(self, learner_id: UserID) -> int
```

**Dependencies**: Knowledge Engine
**Migrates from**: Existing `SearchService` — integrate with AI semantic search

---

#### 3.2.22 Caching Engine

**Status**: REJECTED — Cross-cutting concern, not an engine

**Rationale**: Caching is infrastructure, not domain logic. Every engine should use caching internally via a shared caching abstraction (Redis, in-memory LRU). A separate "Caching Engine" would become a god object that knows about every other engine's data patterns. This is better solved by:

1. A `CacheLayer` decorator that can be applied to any engine method
2. Each engine declaring its own cache invalidation rules
3. A shared `CacheManager` for cross-cutting cache coordination (e.g., "invalidate all caches for node X when it's modified")

---

#### 3.2.23 Versioning Engine

**Status**: ✅ KEEP

**Purpose**: The knowledge graph is a living artifact. Nodes change, edges change, content gets updated. The Versioning Engine tracks all changes and supports rollback, diff, and audit.

**Responsibilities**:

- Graph snapshot creation on import/update
- Graph version comparison (diff)
- Rollback to previous version
- Change audit trail
- Graph evolution analytics

**Public Interface**:

```python
class VersioningEngine(EngineInterface):
    async def create_snapshot(self, label: str, metadata: dict) -> GraphVersion
    async def list_versions(self, limit: int, offset: int) -> list[GraphVersion]
    async def get_version(self, version_id: VersionID) -> GraphVersion
    async def diff_versions(self, version_a: VersionID, version_b: VersionID) -> GraphDiff
    async def rollback(self, version_id: VersionID) -> GraphVersion
    async def get_change_history(self, node_id: NodeID) -> list[ChangeRecord]
```

**Dependencies**: Graph Engine, Knowledge Engine

---

#### 3.2.24 Import Engine

**Status**: ✅ KEEP

**Purpose**: Import knowledge graph data from JSON files (or other formats) into the live graph. This is NOT a simple bulk insert — it's a full graph versioning + validation + transaction pipeline.

**Responsibilities**:

- Parse JSON input matching the SV-OS schema
- Validate against Validation Engine
- Create graph version snapshot
- Upsert nodes, edges, careers, relationships, simulators, decompositions
- Validate referential integrity before committing
- Generate import report
- Support dry-run mode
- Support incremental imports (upsert by node ID)

**Public Interface**:

```python
class ImportEngine(EngineInterface):
    async def import_from_json(self, data: RawGraphData, options: ImportOptions) -> ImportResult
    async def import_from_file(self, file_path: str, options: ImportOptions) -> ImportResult
    async def dry_run(self, data: RawGraphData) -> ValidationReport
    async def validate_import(self, data: RawGraphData) -> ValidationReport
```

**Dependencies**: Graph Engine, Knowledge Engine, Validation Engine, Versioning Engine, Career Engine, Simulator Engine

---

#### 3.2.25 Export Engine

**Status**: ✅ KEEP

**Purpose**: Export the knowledge graph to various formats — JSON (the canonical SV-OS format), CSV, GraphML, or custom subsets.

**Public Interface**:

```python
class ExportEngine(EngineInterface):
    async def export_to_json(self, filters: ExportFilter) -> RawGraphData
    async def export_subgraph(self, center_node_id: NodeID, depth: int) -> RawGraphData
    async def export_career(self, career_id: CareerID) -> RawGraphData
    async def export_category(self, category: str) -> RawGraphData
```

**Dependencies**: Graph Engine, Knowledge Engine, Career Engine

---

#### 3.2.26 Visualization Engine

**Status**: ✅ KEEP

**Purpose**: Generate graph visualization data. This is NOT a frontend rendering engine — it prepares data FOR frontend rendering. Computes layout positions, cluster assignments, edge bundling, and level assignments.

**Public Interface**:

```python
class VisualizationEngine(EngineInterface):
    async def compute_layout(self, node_ids: list[NodeID], layout_type: LayoutType) -> LayoutData
    async def get_clusters(self, node_ids: list[NodeID], algorithm: ClusterAlgorithm) -> list[Cluster]
    async def get_levels(self, node_ids: list[NodeID]) -> list[Level]
    async def compute_force_directed(self, subgraph: KnowledgeSubgraph) -> ForceDirectedLayout
    async def get_prerequisite_flow(self, node_id: NodeID) -> FlowData
    async def get_career_timeline(self, career_id: CareerID) -> TimelineData
    async def get_learner_progress_overlay(self, learner_state: LearnerState, subgraph: KnowledgeSubgraph) -> OverlayData
```

**Dependencies**: Graph Engine, Traversal Engine, Knowledge Engine
**Performance**: Layout computation is O(V log V) minimum. For 10^4+ nodes, frontend rendering is the bottleneck, not backend computation.

---

#### 3.2.27 Graph Transformation Engine

**Status**: REJECTED — No clear use case

**Rationale**: Graph transformation implies converting between graph representations (adjacency list → matrix, directed → undirected, etc.). In practice, SV-OS has one graph representation (the Knowledge Graph). Transformation of learner data into graph features is better handled by the Recommendation Engine or Caching Engine as internal operations. No engine consumer needs "a transposed adjacency matrix of the knowledge graph."

If future requirements demand graph neural network training, this would be a separate GNN Pipeline, not a generic transformation engine.

---

#### 3.2.28 Roadmap Engine

**Status**: REJECTED — Merge into Career Engine + Learning Path Engine

**Rationale**: "Roadmap" is a presentation of career path + learning path data. A roadmap IS a learning path generated for a career goal. The Career Engine provides career data; the Learning Path Engine generates the ordered sequence. A separate Roadmap Engine would simply call both and format the output, which is a **service** responsibility, not an engine responsibility.

---

#### 3.2.29 Prerequisite Solver

**Status**: ✅ KEEP

**Purpose**: Solve the core analytical question: "Given a set of known nodes and a goal node, what is the optimal order to learn the prerequisites?"

**Public Interface**:

```python
class PrerequisiteSolver(EngineInterface):
    async def find_optimal_order(self, known_ids: set[NodeID], goal_ids: set[NodeID]) -> list[KnowledgeNode]
    async def find_minimal_set(self, known_ids: set[NodeID], goal_id: NodeID) -> list[KnowledgeNode]
    async def find_alternative_prerequisites(self, node_id: NodeID) -> list[list[KnowledgeNode]]
    async def compute_readiness(self, learner_state: LearnerState, node_id: NodeID) -> ReadinessScore
    async def blame_blockers(self, learner_state: LearnerState, node_id: NodeID) -> list[Blocker]
```

**Dependencies**: Graph Engine, Traversal Engine, State Engine
**Algorithm**: The solver uses topological sort with dynamic reordering. See Section 8.

---

#### 3.2.30 Curriculum Engine

**Status**: REJECTED — Merge into Learning Path Engine

**Rationale**: "Curriculum" is a named, reusable learning path (e.g., "CS50 curriculum", "Data Science bootcamp"). This is a Learning Path with metadata (author, credits, institution). The Learning Path Engine should support naming and versioning paths. A separate engine would duplicate 90% of the Learning Path Engine's logic.

---

#### 3.2.31 Knowledge Health Engine

**Status**: REJECTED — Merge into Validation Engine

**Rationale**: "Knowledge health" (cohesion, completeness, freshness) is a subset of graph validation. The Validation Engine already computes a health score. Adding a separate engine would create two systems making overlapping claims about graph quality.

---

#### 3.2.32 Knowledge Integrity Engine

**Status**: REJECTED — Merge into Validation Engine

**Rationale**: Same as Knowledge Health Engine. Integrity refers to referential integrity, cycle prevention, and constraint enforcement — all responsibilities of the Validation Engine.

---

#### 3.2.31 Knowledge Diff Engine

**Status**: REJECTED — Merge into Versioning Engine

**Rationale**: "Diff" (comparing two graph versions) is a core feature of versioning. The Versioning Engine's `diff_versions` method already covers this.

---

#### 3.2.32 Skill Engine — Overlap Resolution with Career Engine

The Skill Engine and Career Engine both compute "gap analysis." The boundary is:

- **Career Engine**: Owns `career → node` mapping. Answer: "What nodes do I need for this career?"
- **Skill Engine**: Owns `skill → node` mapping. Answer: "What skills does this career require, and which nodes teach those skills?"

**Career gap analysis flow**:

1. Career Engine: `get_career_gap(learner_state, career_id)` → list of missing `node_ids`
2. Internally calls Skill Engine: `get_skills_for_career(career_id)` → required `skill_ids`
3. Skill Engine: `get_nodes_for_skills(skill_ids)` → all `node_ids` that teach those skills
4. Career Engine: subtract completed `node_ids` from State Engine → final gap

**No ambiguity**: Career Engine is the orchestrator. Skill Engine provides skill-level data. Neither duplicates the other's domain.

---

#### 3.2.34 Relationship Discovery Engine

**Status**: ✅ KEEP

**Purpose**: Discover hidden relationships between nodes automatically using metadata overlap, career co-occurrence, and shared taxonomy membership. This is explicitly NOT automated in v1 (the JSON note says "not a task to solve now"), but the architecture must support it.

**Public Interface**:

```python
class RelationshipDiscoveryEngine(EngineInterface):
    async def find_candidate_relationships(self, node_ids: list[NodeID] | None = None) -> list[RelationshipCandidate]
    async def discover_by_career_cooccurrence(self) -> list[RelationshipCandidate]
    async def discover_by_shared_metadata(self, metadata_field: str) -> list[RelationshipCandidate]
    async def discover_by_shared_simulator(self) -> list[RelationshipCandidate]
    async def compute_similarity_score(self, node_id_a: NodeID, node_id_b: NodeID) -> float
    async def get_discovery_suggestions(self, limit: int) -> list[DiscoverySuggestion]
```

**Dependencies**: Graph Engine, Knowledge Engine, Career Engine, Simulator Engine
**Performance**: All-vs-all comparison is O(n²). Must be batched or offline. For 10^4 nodes, compute on graph version creation, not in real-time.

---

#### 3.2.35 Learning Strategy Engine

**Status**: ✅ KEEP

**Purpose**: Recommend learning strategies based on learner profile, node characteristics, and historical effectiveness. "Should you read, watch, code, or simulate?"

**Public Interface**:

```python
class LearningStrategyEngine(EngineInterface):
    async def recommend_strategy(self, learner_state: LearnerState, node_id: NodeID) -> LearningStrategy
    async def get_strategies_for_node(self, node_id: NodeID) -> list[LearningStrategy]
    async def record_strategy_outcome(self, learner_id: UserID, strategy: LearningStrategy, effective: bool) -> None
    async def get_effective_strategies(self, learner_id: UserID, node_type: NodeType) -> list[LearningStrategy]
```

**Dependencies**: Knowledge Engine, State Engine

---

#### 3.2.36 Milestone Engine

**Status**: REJECTED — Merge into Learning Path Engine

**Rationale**: Milestones are structural elements of a Learning Path. The Learning Path Engine already groups nodes into milestones. A separate engine would duplicate the grouping logic and create synchronization issues.

---

#### 3.2.37 Skill Engine

**Status**: ✅ KEEP

**Purpose**: Manage skills (cross-cutting learner abilities) that transcend individual knowledge nodes. Skills are composed of knowledge from multiple nodes.

**Public Interface**:

```python
class SkillEngine(EngineInterface):
    async def get_skill(self, skill_id: SkillID) -> Skill
    async def list_skills(self, filters: SkillFilter) -> list[Skill]
    async def get_skills_for_node(self, node_id: NodeID) -> list[Skill]
    async def get_nodes_for_skill(self, skill_id: SkillID) -> list[KnowledgeNode]
    async def get_skill_gap(self, learner_state: LearnerState, skill_id: SkillID) -> SkillGap
    async def get_learner_skill_profile(self, learner_id: UserID) -> SkillProfile
    async def get_career_skill_requirements(self, career_id: CareerID) -> list[SkillRequirement]
    async def compute_skill_mastery(self, learner_state: LearnerState, skill_id: SkillID) -> float
```

**Dependencies**: Graph Engine, Knowledge Engine, Career Engine
**Migrates from**: Existing `SkillService`

---

#### 3.2.38 Competency Engine

**Status**: REJECTED — Merge into Skill Engine

**Rationale**: "Competency" is a synonym for "skill." In the SV-OS domain, a competency IS a skill at a specific level. The Skill Engine should support competency levels via its existing interfaces rather than a separate engine.

---

#### 3.2.39 Learning State Engine

**Status**: REJECTED — Merge into State Engine

**Rationale**: "Learning State" and "Knowledge State" describe the same thing: the learner's relationship to a node. The State Engine (3.2.12) already owns this domain. A separate "Learning State Engine" would be a duplicate.

---

### 3.3 Engine Dependency Graph (Exhaustive)

```
Legend: ───→  depends on
        ~~~→  subscribes to events from

                    ┌──────────────┐
                    │ Event Engine  │ (Foundation — no deps, starts first)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────────────────────────┐
              ▼            ▼                                ▼
       ┌──────────┐ ┌──────────┐                    ┌─────────────┐
       │Graph     │ │Knowledge │                    │Versioning    │
       │Engine    │ │Engine    │                    │Engine        │
       └────┬─────┘ └─────┬────┘                    └──────┬───────┘
            │             │                                │
            ▼             ▼                                ▼
       ┌──────────────────────────────────────────────────────┐
       │  ┌────────────┐  ┌───────────┐  ┌───────────────┐   │
       │  │Traversal   │  │Query      │  │Validation      │   │
       │  │Engine      │  │Engine     │  │Engine          │   │
       │  └─────┬──────┘  └─────┬─────┘  └───────┬───────┘   │
       │        │               │                 │           │
       │  ┌─────┴───────────────┴─────────────────┴──────┐    │
       │  │              State Engine                     │    │
       │  │   (All learner queries go through State,      │    │
       │  │    not Graph, Engine)                         │    │
       │  └──────────────────────┬──────────────────────┘    │
       │                         │                           │
       │  ┌──────────────────────┴──────────────────────┐    │
       │  │            Dependency Engine                  │    │
       │  └──────────────────────┬──────────────────────┘    │
       │                         │                           │
       │  ┌──────────────────────┴──────────────────────┐    │
       │  │          Prerequisite Solver                  │    │
       │  └──────────────────────┬──────────────────────┘    │
       │                         │                           │
       │  ┌──────────────────────┴──────────────────────┐    │
       │  │  ┌──────────┐ ┌──────────┐ ┌────────────┐   │    │
       │  │  │Learning  │ │Career   │ │Search      │   │    │
       │  │  │Path Eng  │ │Engine   │ │Engine      │   │    │
       │  │  └────┬─────┘ └────┬─────┘ └────────────┘   │    │
       │  │       │            │                         │    │
       │  │  ┌────┴────────────┴─────────────────────┐   │    │
       │  │  │     Recommendation Engine               │   │    │
       │  │  └──────────────────┬────────────────────┘   │    │
       │  │                     │                        │    │
       │  │  ┌──────────────────┴────────────────────┐   │    │
       │  │  │       Scheduling Engine                 │   │    │
       │  │  └──────────────────────────────────────┘   │    │
       │  └─────────────────────────────────────────────┘    │
       │                                                     │
       │  ┌─────────────────────────────────────────────┐    │
       │  │  ┌──────────┐ ┌──────────┐ ┌────────────┐   │    │
       │  │  │Skill     │ │Project   │ │Simulator   │   │    │
       │  │  │Engine    │ │Engine    │ │Engine      │   │    │
       │  │  └────┬─────┘ └────┬─────┘ └─────┬──────┘   │    │
       │  │       │            │               │         │    │
       │  │  ┌────┴────────────┴───────────────┴──────┐  │    │
       │  │  │      Assessment Engine                   │  │    │
       │  │  └──────────────────┬────────────────────┘  │    │
       │  │                     │                       │    │
       │  │  ┌──────────────────┴────────────────────┐  │    │
       │  │  │         Revision Engine                  │  │    │
       │  │  └──────────────────────────────────────┘  │    │
       │  └─────────────────────────────────────────────┘    │
       │                                                     │
       │  ┌─────────────────────────────────────────────┐    │
       │  │  ┌──────────────┐ ┌──────────────────────┐  │    │
       │  │  │Learning      │ │Relationship           │  │    │
       │  │  │Analytics Eng │ │Discovery Engine       │  │    │
       │  │  └──────┬───────┘ └─────────┬────────────┘  │    │
       │  │         │                   │                │    │
       │  │  ┌──────┴───────────────────┴────────────┐   │    │
       │  │  │       Learning Strategy Engine          │   │    │
       │  │  └──────────────────────────────────────┘   │    │
       │  └─────────────────────────────────────────────┘    │
       │                                                     │
       │  ┌─────────────────────────────────────────────┐    │
       │  │           Visualization Engine                │    │
       │  └─────────────────────────────────────────────┘    │
       │                                                     │
       │  ┌─────────────────────────────────────────────┐    │
       │  │  ┌──────────┐ ┌──────────┐                  │    │
       │  │  │Import    │ │Export    │                  │    │
       │  │  │Engine    │ │Engine    │                  │    │
       │  │  └────┬─────┘ └────┬─────┘                  │    │
       │  │       │            │                        │    │
       │  │  ┌────┴────────────┴────────────────────┐   │    │
       │  │  │      Versioning Engine                  │   │    │
       │  │  └──────────────────────────────────────┘   │    │
       │  └─────────────────────────────────────────────┘    │
       └──────────────────────────────────────────────────────┘

Cross-cutting: All engines ~~~→ Event Engine (publish/subscribe)
```

**Engine-to-Event subscriptions**:

- State Engine subscribes to: `NodeEncountered`, `NodeStudied`, `NodePracticed`, `NodeApplied`, `AssessmentSubmitted`
- Revision Engine subscribes to: `NodeMastered`, `AssessmentSubmitted`
- Analytics Engine subscribes to: all events
- Recommendation Engine subscribes to: `NodeMastered`, `NodeForgotten` (cache invalidation)
- Scheduling Engine subscribes to: `NodeMastered`, `ReviewDue`

---

## 4. Knowledge Graph Model

### 4.1 Graph Objects (Domain Model — Persistence-Independent)

```python
@dataclass
class KnowledgeNode:
    id: NodeID          # e.g., "OS-005" or UUID
    name: str
    category: str
    difficulty: int      # 1-5 scale
    estimated_learning_hours: int
    prerequisites: list[NodeID]
    unlocks: list[NodeID]           # DERIVED — never stored
    cross_domain_connections: list[NodeID]

    # Content fields (populated incrementally)
    content: NodeContent | None     # Full content (see below)
    metadata: NodeMetadata           # Core metadata

@dataclass
class NodeContent:
    # Structured content blocks for the content layer
    learning_objectives: list[str]
    required_skills: list[str]
    real_world_applications: list[str]
    common_mistakes: list[str]
    interview_questions: list[str]
    coding_challenges: list[str]
    practice_exercises: list[str]
    learning_outcomes: list[str]
    research_papers: list[Resource]
    books: list[Resource]
    documentation: list[Resource]
    external_resources: list[Resource]
    ai_tutor_suggestions: list[str]
    tags: list[str]

    # Project/Simulator content
    mini_projects: list[ProjectRef]
    major_projects: list[ProjectRef]
    hands_on_labs: list[LabRef]
    required_tools: list[str]
    required_simulators: list[SimulatorRef]

@dataclass
class Relationship:
    from: NodeID
    to: NodeID
    type: RelationshipType  # prerequisite | hidden_relationship_type
    metadata: RelationshipMetadata

@dataclass
class Career:
    id: CareerID
    title: str
    required_nodes: list[NodeID]
    optional_nodes: list[NodeID]
    recommended_order: list[NodeID]
    seniority_progression: list[SeniorityLevel]

@dataclass
class Simulator:
    id: SimulatorID
    name: str
    category: str
    purpose: str
    complexity: SimComplexity
    technologies: list[str]
    implementation_effort: str
    educational_value: str
    nodes: list[NodeID]

@dataclass
class Project:
    id: ProjectID
    title: str
    level: ProjectLevel     # Tiny Exercise → Research
    time_estimate: str
    learning_value: str
    example: str
    nodes: list[NodeID]

@dataclass
class ConceptDecomposition:
    node_id: NodeID
    hierarchy: list[DecompositionNode]  # Tree structure

@dataclass
class DecompositionNode:
    id: str                 # e.g., "OS-005.M3.T1.C2.MC1.AKU1"
    name: str
    level: DecompositionLevel   # module | topic | concept | micro_concept | atomic_unit
    children: list[DecompositionNode]

@dataclass
class SeniorityLevel:
    level: int              # 1-10
    name: str               # Complete Beginner → Innovator
    description: str
    min_nodes: int
    node_deltas: dict[CareerID, list[NodeID]]   # New nodes at this level
```

### 4.2 Graph Query Language (GQL)

The SV-OS Graph Query Language is a simple, capability-based query model that allows expressing complex graph operations in a readable format.

#### Query Types

```
FIND path(<source>, <target> [, max_depth=10])
    Returns: [node_id, ...]

FIND unlock_chain(<node_id> [, max_depth=10])
    Returns: [[level0_nodes], [level1_nodes], ...]

FIND prerequisite_chain(<node_id> [, max_depth=10])
    Returns: [[level0_nodes], [level1_nodes], ...]

FIND related(<node_id> [, edge_type] [, depth=1])
    Returns: [{node_id, relationship_type, direction}, ...]

FIND careers_requiring(<node_id>)
    Returns: [career_id, ...]

FIND projects_requiring(<node_id>)
    Returns: [project_id, ...]

FIND simulators_for(<node_id>)
    Returns: [simulator_id, ...]

FIND common_nodes(<career_a>, <career_b>)
    Returns: [node_id, ...]

FIND unique_nodes(<career_a>, <career_b>)
    Returns: {career_a_only: [node_id, ...], career_b_only: [node_id, ...]}

FIND bottlenecks([category])
    Returns: [{node_id, dependent_count}, ...]

FIND isolated_nodes()
    Returns: [node_id, ...]

FIND hidden_relationships(<node_id> [, type])
    Returns: [{from, to, type, note}, ...]

FIND decomposition(<node_id>)
    Returns: [{level, id, name, parent_id}, ...]

FIND shortest_path(<source>, <target> [, via=<edge_type>])
    Returns: [node_id, ...]

FIND reachable_from(<node_ids>, [max_depth], [via=<edge_type>])
    Returns: [node_id, ...]

COMPARE careers(<career_a>, <career_b>)
    Returns: {common: [...], a_only: [...], b_only: [...]}

COMPARE versions(<version_a>, <version_b>)
    Returns: {added: [...], removed: [...], modified: [...]}
```

#### Query Engine Implementation

The GQL is parsed into an intermediate representation, then executed by composing engine capabilities:

```python
# Example: FIND path(MATH-001, OS-005, max_depth=15)
# Parses to:
QueryOperation(
    type="path",
    args={"source": "MATH-001", "target": "OS-005", "max_depth": 15},
    executor=lambda engines: engines.traversal.shortest_path(
        source_id=resolve("MATH-001"),
        target_id=resolve("OS-005"),
        max_depth=15
    )
)
```

---

## 5. Knowledge State Model

### 5.1 States

The learner's relationship to each knowledge node is modeled as 10 states with explicit transitions:

```python
class KnowledgeStateValue(enum.StrEnum):
    UNKNOWN = 'unknown'                    # Never encountered
    INTRODUCED = 'introduced'              # Heard of it, seen it once
    LEARNING = 'learning'                  # Actively studying
    PRACTICING = 'practicing'              # Applying via exercises/projects
    APPLIED = 'applied'                    # Used in real-world context
    MASTERED = 'mastered'                  # Can teach others, deep understanding
    TEACHING = 'teaching'                  # Currently explaining/mentoring on this
    FORGOTTEN = 'forgotten'                # Was learned, but not reviewed
    NEEDS_REVISION = 'needs_revision'      # Assessment showed gaps
    DEPRECATED = 'deprecated'              # Knowledge is obsolete/replaced
```

### 5.2 State Transitions

```
UNKNOWN ──[encounter]──→ INTRODUCED
INTRODUCED ──[start_studying]──→ LEARNING
LEARNING ──[complete_basics]──→ PRACTICING
PRACTICING ──[apply_really]──→ APPLIED
APPLIED ──[demonstrate_expertise]──→ MASTERED
MASTERED ──[teach_others]──→ TEACHING
MASTERED ──[time_passes]──→ FORGOTTEN
FORGOTTEN ──[assessment_shows_gaps]──→ NEEDS_REVISION
NEEDS_REVISION ──[review_and_retest]──→ APPLIED  # or back to LEARNING
LEARNING ──[assessment_shows_gaps]──→ NEEDS_REVISION
APPLIED ──[assessment_shows_gaps]──→ NEEDS_REVISION
any ──[technology_evolves]──→ DEPRECATED
```

### 5.3 State Dimensions

Beyond the primary state, each node has secondary dimensions:

```python
@dataclass
class KnowledgeState:
    primary: KnowledgeStateValue           # The main state

    # Temporal dimensions
    last_encountered_at: datetime | None   # When first seen
    last_studied_at: datetime | None       # Last study session
    last_assessed_at: datetime | None      # Last assessment
    next_review_at: datetime | None        # Spaced repetition

    # Effort dimensions
    total_study_minutes: int               # Cumulative time
    study_sessions: int                     # Number of sessions
    assessment_attempts: int               # Number of assessments taken
    best_assessment_score: float | None    # Best score (0-1)
    latest_assessment_score: float | None  # Latest score

    # Meta dimensions
    confidence: float                       # Self-reported confidence (0-1)
    interest: float                         # Self-reported interest (0-1)
    priority: float                         # Computed priority for this learner
    source: str                             # How this state was set (assessment|self_report|automatic)
```

### 5.4 State Influence on Recommendations

Each state has a different influence on recommendations:

| State          | Should Recommend                   | Should Review    | Should Skip         |
| -------------- | ---------------------------------- | ---------------- | ------------------- |
| UNKNOWN        | ✅ High priority if in career path | ❌               | ❌                  |
| INTRODUCED     | ✅ High priority to continue       | ❌               | ❌                  |
| LEARNING       | ✅ Medium priority (reinforce)     | ❌               | ❌                  |
| PRACTICING     | ✅ Low priority (need projects)    | ❌               | ❌                  |
| APPLIED        | ❌                                 | ✅ Low priority  | ✅                  |
| MASTERED       | ❌                                 | ✅ (if long ago) | ✅                  |
| TEACHING       | ❌                                 | ❌               | ✅                  |
| FORGOTTEN      | ❌                                 | ✅ High priority | ❌                  |
| NEEDS_REVISION | ❌                                 | ✅ Urgent        | ❌                  |
| DEPRECATED     | ❌                                 | ❌               | ✅ Skip permanently |

---

## 6. Graph Query Language (GQL) — Complete Specification

### 6.1 Grammar

```
QUERY          ::= COMMAND "(" [ARGUMENTS] ")"
COMMAND        ::= "FIND" | "COMPARE" | "ANALYZE" | "EXPLAIN"
ARGUMENTS      ::= ARG ("," ARG)*
ARG            ::= IDENTIFIER "=" VALUE
VALUE          ::= STRING | NUMBER | BOOLEAN | LIST
LIST           ::= "[" VALUE ("," VALUE)* "]"
IDENTIFIER     ::= [a-zA-Z_][a-zA-Z0-9_]*
```

### 6.2 Commands Reference

```
FIND path(source, target [, max_depth=10])
FIND unlock_chain(node_id [, max_depth=10])
FIND prereq_chain(node_id [, max_depth=10])
FIND related(node_id [, edge_type] [, depth=1])
FIND careers(node_id)
FIND projects(node_id)
FIND simulators(node_id)
FIND common(a, b)           -- common nodes between two careers/sets
FIND unique(a, b)           -- unique nodes per career/set
FIND bottlenecks([category])
FIND isolated()
FIND hidden(node_id [, type])
FIND decomposition(node_id)
FIND shortest(source, target [, via=edge_type])
FIND reachable(node_ids [, max_depth] [, via=edge_type])
FIND similar(node_id)       -- similar nodes by metadata overlap
FIND gaps(career_id, state)  -- knowledge gaps for career given current state

COMPARE careers(a, b)
COMPARE versions(a, b)
COMPARE paths(a, b)          -- two learning paths

ANALYZE depth_distribution()
ANALYZE density()
ANALYZE connectivity()
ANALYZE health()
ANALYZE category_distribution()
ANALYZE difficulty_distribution()

EXPLAIN recommendation(learner_id, node_id)
EXPLAIN path(path_id)
EXPLAIN state(learner_id, node_id)
```

### 6.3 Examples

```gql
-- "What do I need to learn before studying OS-005?"
FIND prereq_chain("OS-005", max_depth=5)

-- "What single concept unlocks the most other concepts?"
FIND bottlenecks("All")

-- "What's the fastest way from MATH-001 to OS-005?"
FIND shortest("MATH-001", "OS-005", via="prerequisite")

-- "What's common and unique between AI Engineer and Backend Engineer?"
COMPARE careers("CAR-AI-ENGINEER", "CAR-BACKEND")

-- "What hidden connections does Virtual Memory have?"
FIND hidden("OS-005")

-- "What knowledge gaps do I have for becoming a Backend Engineer?"
FIND gaps("CAR-BACKEND", learner_state)

-- "Analyze the health of the graph"
ANALYZE health()
```

---

## 7. Knowledge Validation System

### 7.1 Validation Pipeline

Every graph mutation passes through a validation pipeline:

```
Mutation Request
    │
    ▼
┌─────────────────────────────────────┐
│ 1. Schema Validation                │
│    - Node has required fields       │
│    - Edge has valid types           │
│    - Data types are correct         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 2. Referential Integrity            │
│    - Every edge endpoint exists     │
│    - Every career node reference    │
│    - Every simulator node reference │
│    - Every decomposition ref        │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 3. Structural Validation            │
│    - No cycles (or warn)            │
│    - No duplicate slugs             │
│    - No duplicate edges             │
│    - No self-loops                  │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 4. Semantic Validation              │
│    - Prerequisite depth sanity      │
│    - Difficulty progression sanity  │
│    - Category consistency           │
│    - Cross-domain refs resolve      │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 5. Health Score Computation         │
│    - Connectivity %                 │
│    - Isolated node count            │
│    - Average branching factor       │
│    - Depth distribution             │
│    - Bottleneck identification      │
└──────────────┬──────────────────────┘
               ▼
              Commit or Reject
```

### 7.2 Validation Report

```python
@dataclass
class ValidationReport:
    passed: bool
    errors: list[ValidationError]
    warnings: list[ValidationWarning]
    health_score: float              # 0.0 (broken) to 1.0 (perfect)

    # Detailed breakdown
    structural_health: float         # Cycles, duplicates, orphaned refs
    coverage_health: float           # What % of nodes have full content
    connectivity_health: float       # What % of nodes are connected
    career_health: float             # What % of career nodes exist

    # Statistics
    total_nodes: int
    total_edges: int
    isolated_nodes: int
    bottleneck_nodes: list[BottleneckReport]
    max_depth: int
    avg_depth: float
```

### 7.3 Graph Health Score Formula

```
health_score = (structural_health × 0.35)
             + (coverage_health × 0.25)
             + (connectivity_health × 0.25)
             + (career_health × 0.15)

Where:
  structural_health = 1.0 - (num_cycles × 0.3 + num_duplicates × 0.2 + num_orphans × 0.5)
  coverage_health = nodes_with_full_content / total_nodes
  connectivity_health = nodes_with_edges / total_nodes
  career_health = career_nodes_that_exist / total_career_node_refs
```

---

## 8. Recommendation System (Deterministic)

### 8.1 Architecture

NO AI. Pure deterministic algorithms using:

1. **Graph Traversal**: What's reachable from the learner's current state
2. **Dependency Analysis**: What's blocked vs. ready
3. **Knowledge State**: What needs review vs. what's new
4. **Career Goals**: What's on the learner's chosen path
5. **Assessment Scores**: What the learner has actually demonstrated
6. **Time Estimates**: How long each node takes given difficulty
7. **Learning Velocity**: How fast the learner has been progressing
8. **Difficulty Progression**: What difficulty level is appropriate now

### 8.2 Algorithm: get_next_concept

```python
async def get_next_concept(
    self,
    learner_state: LearnerState,
    context: RecommendationContext
) -> Recommendation:
    """
    Pure deterministic algorithm.
    Returns the single best next concept to study.
    """

    # STEP 1: Candidates = nodes that are NOT in a terminal state
    # Terminal states: MASTERED, TEACHING, DEPRECATED
    candidates = []
    for node_id, state in learner_state.node_states.items():
        if state.primary not in TERMINAL_STATES:
            candidates.append(node_id)

    # STEP 2: Filter by reachability (prerequisites satisfied)
    reachable = []
    for node_id in candidates:
        prereq_ids = await self.graph.get_prerequisites(node_id)
        if prereq_ids is None or all(
            learner_state.node_states[p].primary in COMPLETED_STATES
            for p in prereq_ids
        ):
            reachable.append(node_id)

    if not reachable:
        # No new nodes reachable → recommend review of weak nodes
        return await self._recommend_review(learner_state)

    # STEP 3: Score each reachable node
    scored = []
    for node_id in reachable:
        state = learner_state.node_states.get(node_id)
        score = 0.0
        reasons = []

        # A. Priority boost: on career path?
        if context.career_ids:
            career_boost = await self._career_relevance(node_id, context.career_ids)
            score += career_boost * self.W_CAREER
            if career_boost > 0.5:
                reasons.append(f"Required for {len(context.career_ids)} career path(s)")

        # B. State urgency: INTRODUCED > LEARNING > PRACTICING > UNKNOWN
        state_urgency = {
            KnowledgeStateValue.INTRODUCED: 0.9,
            KnowledgeStateValue.LEARNING: 0.7,
            KnowledgeStateValue.PRACTICING: 0.4,
            KnowledgeStateValue.UNKNOWN: 0.3,
            KnowledgeStateValue.FORGOTTEN: 0.8,
            KnowledgeStateValue.NEEDS_REVISION: 0.6,
        }.get(state.primary if state else KnowledgeStateValue.UNKNOWN, 0.0)
        score += state_urgency * self.W_STATE
        if state_urgency > 0.5:
            reasons.append(self._state_reason(state.primary))

        # C. Unlock potential: how many nodes does this unlock?
        unlock_count = len(await self.dependency.get_unlock_chain(node_id, max_depth=1))
        unlocks_normalized = min(unlock_count / self.MAX_UNLOCK_BOOST, 1.0)
        score += unlocks_normalized * self.W_UNLOCK
        if unlocks_normalized > 0.5:
            reasons.append(f"Unlocks {unlock_count} concept(s)")

        # D. Difficulty match: challenging but not overwhelming
        node = await self.graph.get_node(node_id)
        difficulty_gap = abs(node.difficulty - learner_state.average_difficulty)
        difficulty_good = max(0, 1.0 - (difficulty_gap * 0.25))
        score += difficulty_good * self.W_DIFFICULTY

        # E. Time fit: can it be completed in one session?
        estimated_time = node.estimated_learning_hours * 60  # convert to min
        if context.available_minutes:
            time_fit = min(estimated_time / context.available_minutes, 1.0)
            score += (1.0 - abs(time_fit - 0.7)) * self.W_TIME  # prefer ~70% of available time

        # F. Weakness offset: if nearby nodes are weak, this is higher priority
        neighbors = await self.graph.get_neighbors(node_id)
        weak_nearby = sum(
            1 for n in neighbors
            if learner_state.node_states.get(n.id, KnowledgeState()).primary == KnowledgeStateValue.NEEDS_REVISION
        )
        if weak_nearby > 0:
            score += min(weak_nearby * 0.05, 0.2) * self.W_WEAK
            reasons.append(f"{weak_nearby} related concept(s) need reinforcement")

        scored.append((score, node_id, reasons))

    # STEP 4: Pick the best
    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best_id, best_reasons = scored[0]

    return Recommendation(
        node=await self.graph.get_node(best_id),
        score=best_score,
        reasons=best_reasons,
        alternatives=[await self.graph.get_node(nid) for _, nid, _ in scored[1:4]],
        estimated_time=best_node.estimated_learning_hours,
    )
```

### 8.3 Scoring Weights (Tunable)

```python
# Default weights — can be overridden per learner
self.W_CAREER = 0.30       # Career relevance
self.W_STATE = 0.25        # Knowledge state urgency
self.W_UNLOCK = 0.20       # Unlock potential
self.W_DIFFICULTY = 0.10   # Difficulty match
self.W_TIME = 0.10         # Time fit
self.W_WEAK = 0.05         # Weak topic reinforcement

# These are NOT arbitrary — they're based on educational research
# priority: goals > gaps > growth > comfort > logistics
```

---

## 9. API Architecture

### 9.1 Design Principles

- **Capability-based, not CRUD-based**: Endpoints describe what you can DO
- **Verb-first naming**: `find-shortest-path` not `GET /graph/path`
- **Uniform response format**: Every response has `{success, data, error, meta}`
- **Paginate everything** that returns lists
- **No business logic in handlers** — just auth check → engine call → format response

### 9.2 API Categories

```
POST   /capabilities/next-concept          # What should I learn next?
POST   /capabilities/review-plan           # What should I review today?
POST   /capabilities/daily-plan            # Plan my study session
POST   /capabilities/find-path             # Find shortest learning path
POST   /capabilities/find-roadmap          # Find career roadmap
POST   /capabilities/compare-careers       # Compare two careers
POST   /capabilities/calculate-gap         # Calculate skill gap
POST   /capabilities/generate-revision     # Generate revision schedule
POST   /capabilities/estimate-time         # Estimate learning time
POST   /capabilities/recommend-project     # Recommend a project
POST   /capabilities/recommend-simulator   # Recommend a simulator
POST   /capabilities/find-hidden           # Find hidden relationships
POST   /capabilities/explain-why           # Explain why a concept is required
POST   /capabilities/validate-knowledge    # Validate knowledge state
POST   /capabilities/export-graph          # Export graph to JSON

# Graph queries (GQL)
POST   /graph/query                        # Execute GQL query
POST   /graph/explain                      # Explain GQL query plan

# Learner state
POST   /learner/state                      # Get current learner state
POST   /learner/transition                 # Record a learning event
POST   /learner/stats                      # Get learner analytics

# Import/Export (admin)
POST   /admin/import                       # Import knowledge graph
POST   /admin/validate                     # Dry-run validation
POST   /admin/import/status                # Get import status
GET    /admin/graph/health                 # Get graph health score
GET    /admin/graph/versions               # List graph versions
POST   /admin/graph/rollback               # Rollback to version
GET    /admin/graph/diff                   # Diff two versions

# Knowledge graph exploration
GET    /graph/nodes                        # List nodes (with filters)
GET    /graph/nodes/{id}                   # Get node detail
GET    /graph/categories                   # List categories

# Careers
GET    /careers                            # List careers
GET    /careers/{id}                       # Get career detail

# Simulators
GET    /simulators                         # List simulators
GET    /simulators/{id}                    # Get simulator detail

# Projects
GET    /projects                           # List projects (with filters)
GET    /projects/{id}                      # Get project detail

# Assessment
POST   /assessments/submit                # Submit assessment result
GET    /assessments/history               # Get assessment history

# Search
GET    /search                             # Full-text search
GET    /search/suggest                     # Autocomplete suggestions
```

### 9.3 Response Format

```json
{
    "success": true,
    "data": {
        "concept": {
            "id": "OS-005",
            "name": "Virtual Memory",
            "difficulty": 4,
            "estimated_hours": 20
        },
        "score": 0.87,
        "reasons": [
            "Required for Backend Engineer career path",
            "Unlocks 5 concepts including OS-006 and CLOUD-002",
            "All prerequisites completed (ARCH-005, OS-001)"
        ],
        "alternatives": [...],
        "estimated_time": 1200
    },
    "meta": {
        "engine_version": "2.0.0",
        "computation_time_ms": 145,
        "gql_query": "FIND path(learner_state, CAR-BACKEND)"
    },
    "error": null
}
```

---

## 10. Data Model & Persistence

### 10.1 Core Tables (PostgreSQL)

The database is a persistence layer for the graph, NOT the source of truth. The graph lives in memory (Graph Engine) and is persisted here.

```sql
-- Core Knowledge Graph
knowledge_nodes (extends existing)
    - ADD: source_id TEXT              -- Original JSON ID (e.g., "OS-005")
    - ADD: content JSONB               -- All NodeContent fields as JSONB
    - ADD: metadata JSONB              -- Extended: difficulty 1-5, hours, tools, companies, etc.
    - KEEP: existing columns (slug, title, description, content, node_type, difficulty, etc.)
    - KEEP: search_vector (tsvector)

knowledge_edges (uses existing)
    - KEEP: existing columns (source_node_id, target_node_id, relationship_type, direction, description, weight, metadata)

hidden_relationships (NEW)
    - id UUID PK
    - source_node_id FK
    - target_node_id FK
    - relationship_type TEXT    -- structural_analogy, shared_theory, applied_structure, etc.
    - note TEXT
    - UNIQUE(source_node_id, target_node_id, relationship_type)

content_blocks (NEW — replaces node_details)
    - id UUID PK
    - node_id FK
    - block_type TEXT           -- theory, example, visualization, flashcard, assessment, project, etc.
    - content JSONB             -- Block content (structure depends on type)
    - order_index INT
    - UNIQUE(node_id, block_type, order_index)

careers (uses existing)
    - KEEP: existing columns
    - ADD: metadata JSONB (add recommended_order, etc.)

career_requirements (uses existing)
    - KEEP: existing columns (requirement_type already has required/recommended/bonus)

career_seniority_nodes (NEW)
    - id UUID PK
    - career_id FK
    - seniority_level INT          -- 1-10
    - node_id FK
    - UNIQUE(career_id, seniority_level, node_id)

simulators (NEW)
    - id UUID PK
    - name TEXT
    - category TEXT
    - purpose TEXT
    - complexity TEXT
    - technologies TEXT[]
    - implementation_effort TEXT
    - educational_value TEXT

node_simulators (NEW)
    - id UUID PK
    - node_id FK
    - simulator_id FK
    - metadata JSONB
    - UNIQUE(node_id, simulator_id)

projects (uses existing)
    - KEEP: existing columns
    - ADD: project_level TEXT     -- Tiny Exercise, Mini Project, etc.

concept_decomposition (NEW)
    - id UUID PK
    - node_id FK                  -- Top-level node (e.g., OS-005)
    - hierarchy_id TEXT           -- e.g., "OS-005.M3.T1.C2.MC1.AKU1"
    - name TEXT
    - level TEXT                  -- module, topic, concept, micro_concept, atomic_unit
    - parent_hierarchy_id TEXT    -- Parent in the decomposition tree
    - UNIQUE(node_id, hierarchy_id)

graph_versions (NEW)
    - id UUID PK
    - label TEXT
    - snapshot JSONB              -- Full graph snapshot
    - metadata JSONB
    - created_at TIMESTAMPTZ

seniority_levels (NEW — lookup/config)
    - level INT PK
    - name TEXT
    - description TEXT
    - min_node_count INT

project_levels (NEW — lookup/config)
    - level_name TEXT PK
    - time_estimate TEXT
    - learning_value TEXT
    - example TEXT

-- Learner State
learner_knowledge_states (NEW — replaces user_progress)
    - id UUID PK
    - learner_id UUID FK
    - node_id UUID FK
    - primary_state TEXT                 -- unknown, introduced, learning, etc.
    - confidence FLOAT
    - interest FLOAT
    - total_study_minutes INT
    - study_sessions INT
    - assessment_attempts INT
    - best_assessment_score FLOAT
    - latest_assessment_score FLOAT
    - last_studied_at TIMESTAMPTZ
    - last_assessed_at TIMESTAMPTZ
    - next_review_at TIMESTAMPTZ
    - source TEXT
    - UNIQUE(learner_id, node_id)

assessment_records (NEW)
    - id UUID PK
    - learner_id FK
    - node_id FK
    - assessment_type TEXT       -- quiz, coding_challenge, interview_question, etc.
    - score FLOAT
    - max_score FLOAT
    - time_taken_minutes INT
    - metadata JSONB
    - created_at TIMESTAMPTZ

learning_events (NEW — event log)
    - id UUID PK
    - learner_id FK
    - node_id FK
    - event_type TEXT            -- encountered, studied, practiced, assessed, etc.
    - from_state TEXT
    - to_state TEXT
    - metadata JSONB
    - created_at TIMESTAMPTZ

learning_paths (uses and extends existing learning_paths)
    - ADD: goal_node_id UUID FK
    - ADD: goal_career_id UUID FK
    - ADD: learner_id UUID FK
    - ADD: strategy TEXT
    - KEEP: existing columns
```

### 10.2 Table vs. Engine Mapping

| Engine             | Primary Table(s)                                     |
| ------------------ | ---------------------------------------------------- |
| Graph Engine       | knowledge_nodes, knowledge_edges                     |
| Knowledge Engine   | knowledge_nodes, content_blocks                      |
| Career Engine      | careers, career_requirements, career_seniority_nodes |
| Project Engine     | projects, project_requirements                       |
| Simulator Engine   | simulators, node_simulators                          |
| State Engine       | learner_knowledge_states                             |
| Assessment Engine  | assessment_records                                   |
| Versioning Engine  | graph_versions                                       |
| Revision Engine    | learner_knowledge_states (next_review_at)            |
| Learning Analytics | learner_knowledge_states, learning_events            |

### 10.3 Indexes for Scale

```sql
-- Critical indexes for 10,000+ nodes, 100,000+ edges, 1,000,000+ learners

-- Knowledge edges: traversal is the bottleneck
CREATE INDEX idx_knowledge_edges_source_type
    ON knowledge_edges(source_node_id, relationship_type)
    WHERE is_deleted = false;
CREATE INDEX idx_knowledge_edges_target_type
    ON knowledge_edges(target_node_id, relationship_type)
    WHERE is_deleted = false;

-- Learner state: per-learner queries
CREATE INDEX idx_learner_states_learner_node
    ON learner_knowledge_states(learner_id, node_id);
CREATE INDEX idx_learner_states_primary
    ON learner_knowledge_states(learner_id, primary_state);

-- State transitions: efficient review scheduling
CREATE INDEX idx_learner_states_next_review
    ON learner_knowledge_states(learner_id, next_review_at)
    WHERE primary_state IN ('mastered', 'applied');

-- Career requirements: career gap analysis
CREATE INDEX idx_career_req_career_type
    ON career_requirements(career_id, requirement_type);
```

---

## 11. Folder Structure

```
apps/api/
├── app/
│   ├── engines/                         # ★ CORE — All business logic
│   │   ├── __init__.py
│   │   ├── base.py                      # EngineInterface, Capability
│   │   ├── context.py                   # EngineContext
│   │   ├── graph/                       # Graph Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py                # Graph domain models
│   │   ├── knowledge/                   # Knowledge Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py
│   │   ├── traversal/                   # Traversal Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── algorithms.py            # BFS, DFS, Dijkstra implementations
│   │   ├── query/                       # Query Engine (GQL)
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   ├── parser.py                # GQL parser
│   │   │   ├── executor.py              # Query execution
│   │   │   └── ast.py                   # Query AST
│   │   ├── state/                       # State Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py                # KnowledgeState, transitions
│   │   ├── learning_path/               # Learning Path Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   ├── strategies.py            # Path generation strategies
│   │   │   └── models.py
│   │   ├── recommendation/              # Recommendation Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   ├── scoring.py               # Scoring algorithms
│   │   │   └── weights.py               # Tunable weight configs
│   │   ├── career/                      # Career Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py
│   │   ├── project/                     # Project Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py
│   │   ├── simulator/                   # Simulator Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py
│   │   ├── assessment/                  # Assessment Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py
│   │   ├── validation/                  # Validation Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   ├── checks.py                # Individual validation checks
│   │   │   └── report.py                # ValidationReport
│   │   ├── dependency/                  # Dependency Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── solver.py                # Prerequisite Solver
│   │   ├── revision/                    # Revision Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── forgetting_curve.py
│   │   ├── analytics/                   # Learning Analytics Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── metrics.py
│   │   ├── search/                      # Search Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── ranking.py
│   │   ├── versioning/                  # Versioning Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── diff.py
│   │   ├── import_knowledge/            # Import Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── parsers/
│   │   │       ├── json_parser.py
│   │   │       └── __init__.py
│   │   ├── export/                      # Export Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── formatters/
│   │   │       ├── json_formatter.py
│   │   │       └── __init__.py
│   │   ├── visualization/               # Visualization Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── layout.py
│   │   ├── relationship_discovery/      # Relationship Discovery Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── strategies/
│   │   ├── learning_strategy/           # Learning Strategy Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── strategies.py
│   │   ├── skill/                       # Skill Engine
│   │   │   ├── __init__.py
│   │   │   ├── engine.py
│   │   │   └── models.py
│   │   └── cache/                       # NOT an engine — caching layer
│   │       ├── __init__.py
│   │       └── cache_manager.py
│   │
│   ├── services/                        # Thin orchestration layer
│   │   ├── __init__.py
│   │   ├── capability_service.py        # Routes engine capabilities to API
│   │   ├── learner_service.py           # Learner-specific orchestration
│   │   └── admin_service.py             # Admin operations orchestration
│   │
│   ├── api/                             # API layer
│   │   ├── deps.py                      # DI (keep existing)
│   │   ├── v1/
│   │   │   ├── router.py               # Updated with new routes
│   │   │   ├── endpoints/
│   │   │   │   ├── capabilities.py      # All /capabilities/* endpoints
│   │   │   │   ├── graph_query.py       # /graph/query
│   │   │   │   ├── learner_state.py     # Learner state endpoints
│   │   │   │   ├── admin_import.py      # Import/validate endpoints
│   │   │   │   ├── admin_graph.py       # Graph management
│   │   │   │   ├── careers.py           # Career endpoints (existing)
│   │   │   │   ├── search.py            # Search (existing)
│   │   │   │   └── ...                  # Keep existing endpoints
│   │   │   └── __init__.py
│   │   └── __init__.py
│   │
│   ├── repositories/                    # Persistence (keep existing pattern)
│   │   ├── __init__.py
│   │   ├── unit_of_work.py             # Keep existing
│   │   ├── base.py                      # Keep existing
│   │   ├── engine_repositories.py       # NEW — repositories for engine persistence
│   │   └── ...                          # Keep existing repositories
│   │
│   ├── models/                          # SQLAlchemy models (keep existing, add new)
│   │   ├── __init__.py
│   │   ├── knowledge_node.py            # Extend
│   │   ├── knowledge_edge.py            # Keep
│   │   ├── hidden_relationship.py       # NEW
│   │   ├── content_block.py             # NEW
│   │   ├── learner_knowledge_state.py   # NEW
│   │   ├── assessment_record.py         # NEW
│   │   ├── learning_event.py            # NEW
│   │   ├── simulator.py                 # NEW
│   │   ├── concept_decomposition.py     # NEW
│   │   ├── graph_version.py             # NEW
│   │   ├── seniority_level.py           # NEW
│   │   └── ...                          # Keep existing models
│   │
│   ├── schemas/                         # Pydantic schemas (keep existing, add new)
│   │   ├── __init__.py
│   │   ├── engine/                      # Engine-specific schemas
│   │   │   ├── graph.py
│   │   │   ├── recommendation.py
│   │   │   ├── learning_path.py
│   │   │   ├── state.py
│   │   │   └── ...
│   │   ├── api/                         # API response schemas
│   │   └── ...
│   │
│   ├── core/                            # Core infrastructure (keep existing)
│   │   ├── config.py
│   │   ├── database.py
│   │   └── ...
│   │
│   └── main.py                          # Keep existing
│
├── alembic/                             # Keep existing
├── tests/
│   ├── engines/                         # Pure unit tests for each engine
│   │   ├── test_graph_engine.py
│   │   ├── test_recommendation_engine.py
│   │   ├── test_validation_engine.py
│   │   └── ...
│   ├── api/                             # API integration tests
│   └── ...
└── ...
```

---

## 12. Frontend Architecture

### 12.1 Viewer Pattern

Replace page-based routing with **viewer-based routing**. Each viewer renders a specific graph perspective:

```
/graph                  → GraphExplorerViewer (knowledge graph navigation)
/graph/node/{id}        → NodeDetailViewer (single node with all content blocks)
/graph/career/{id}      → CareerTimelineViewer (career path visualization)
/graph/compare          → CareerComparisonViewer (side-by-side career comparison)
/graph/path             → PathVisualizationViewer (learning path visualization)
/graph/relationships    → HiddenRelationshipExplorer
/graph/tree/{id}        → DecompositionTreeViewer

/learn                   → LearningDashboardViewer (daily plan, progress, recommendations)
/learn/review            → ReviewSessionViewer (spaced repetition review)
/learn/strategy          → StrategyViewer (learning strategy recommendations)

/careers                 → CareerListViewer
/careers/{id}            → CareerDetailViewer
/careers/{id}/roadmap    → CareerRoadmapViewer

/projects                → ProjectListViewer
/projects/{id}           → ProjectDetailViewer

/simulators              → SimulatorListViewer
/simulators/{id}         → SimulatorLauncherViewer (runs the interactive widget)

/search                  → SearchViewer

/admin                   → GraphHealthDashboard, ImportManager, VersionHistory
```

### 12.2 Content Block Plugin System

```typescript
// TypeScript
interface ContentBlockRenderer {
  type: ContentBlockType;
  component: React.ComponentType<BlockProps>;
  priority: number;
}

interface BlockProps {
  content: ContentBlock;
  nodeId: string;
  learnerState?: KnowledgeState;
  onComplete?: (event: LearningEvent) => void;
}

// Registration
const renderers = new Map<ContentBlockType, ContentBlockRenderer>();

registerRenderer({
  type: 'theory',
  component: TheoryBlock,
  priority: 1,
});

registerRenderer({
  type: 'visualization',
  component: VisualizationBlock,
  priority: 2,
});

// In NodeDetailViewer
{node.content_blocks
  .sort((a, b) => renderers.get(a.type)?.priority ?? 99 - renderers.get(b.type)?.priority ?? 99)
  .map(block => {
    const Renderer = renderers.get(block.type);
    return Renderer ? <Renderer.content content={block} nodeId={node.id} /> : null;
  })
}
```

### 12.3 Shared Visualization Component

All graph visualizations (graph explorer, career timeline, dependency chain, hidden relationships) share one parameterized component:

```typescript
interface GraphVisualizationProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  layout: 'force-directed' | 'hierarchical' | 'radial' | 'timeline';
  nodeRenderer?: (node: KnowledgeNode) => React.ReactNode;
  edgeRenderer?: (edge: KnowledgeEdge) => React.ReactNode;
  interactions?: {
    onClick?: (node: KnowledgeNode) => void;
    onHover?: (node: KnowledgeNode) => void;
    selection?: string[];
  };
  overlays?: {
    learnerState?: Map<string, KnowledgeState>;
    highlightPath?: string[];
    clusters?: Cluster[];
  };
  sizing?: {
    width: number | string;
    height: number | string;
    nodeSizeBy?: 'popularity' | 'depth' | 'difficulty';
  };
}
```

---

## 13. Implementation Roadmap

### Phase 0: Foundation (4-6 weeks)

1. Implement **Graph Engine** (in-memory graph representation)
2. Implement **Traversal Engine** (BFS, DFS, shortest path)
3. Implement **State Engine** (knowledge state model, transitions)
4. Implement basic **Validation Engine** (cycle detection, referential integrity)
5. Database migrations for new tables
6. Wire engine → repository → database

### Phase 1: Core Capabilities (4-6 weeks)

1. Implement **Prerequisite Solver**
2. Implement **Dependency Engine**
3. Implement **Learning Path Engine** (basic path generation)
4. Implement **Career Engine** (career CRUD, career gap analysis)
5. Implement **Knowledge Engine** (content blocks, full-field nodes)
6. Implement **Search Engine** (full-text + faceted)
7. Capability API: `find-path`, `calculate-gap`, `next-concept`

### Phase 2: Intelligence (4-6 weeks)

1. Implement **Recommendation Engine** (deterministic scoring)
2. Implement **Revision Engine** (forgetting curve, review scheduling)
3. Implement **Learning Analytics Engine** (velocity, forecasts)
4. Implement **Assessment Engine** (results tracking, mastery verification)
5. Capability API: `daily-plan`, `review-plan`, `explain-why`

### Phase 3: Content Layer (4-6 weeks)

1. Implement **Project Engine** (project management, recommendation)
2. Implement **Simulator Engine** (simulator management, recommendation)
3. Implement **Skill Engine** (skill management, profile building)
4. Implement **Learning Strategy Engine**
5. Frontend: Content Block Plugin System
6. Frontend: Project/Simulator viewers

### Phase 4: Advanced (4-6 weeks)

1. Implement **Import Engine** (JSON import with validation + versioning)
2. Implement **Export Engine**
3. Implement **Versioning Engine** (snapshots, diff, rollback)
4. Implement **Query Engine** (GQL parser + executor)
5. Implement **Relationship Discovery Engine**
6. Frontend: GQL playground, Admin dashboard

### Phase 5: Polish (ongoing)

1. **Visualization Engine** (layout computation)
2. Caching layer
3. Performance optimization at scale
4. Frontend: animation, transitions, responsiveness

---

## 14. Risks & Tradeoffs

### 14.1 Risks

| Risk                                                  | Likelihood | Impact | Mitigation                                                                      |
| ----------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------- |
| Graph Engine memory limit at 10^6 nodes               | Medium     | High   | Implement paginated/lazy loading, consider Neo4j backend for V2                 |
| Recommendation Engine becomes too complex to maintain | Medium     | Medium | Keep scoring algorithm pure and testable; version every weight change           |
| State Engine performance with 10^7 learner-node pairs | Medium     | High   | Aggressive caching (Redis), batch state updates, async projections              |
| Validation Engine blocks imports                      | Low        | Medium | Dry-run mode, incremental validation, background health checks                  |
| Team cognitive load from 20+ engines                  | Medium     | Medium | Strict interfaces, comprehensive tests, engine dependency graph visible in docs |
| Frontend viewer consistency                           | Medium     | Low    | Shared visualization component, design system enforces consistency              |

### 14.2 Tradeoffs

| Decision                                      | Tradeoff                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| In-memory graph (vs. database queries)        | Speed → memory cost. 10^4 nodes ≈ 50MB. 10^6 nodes ≈ 5GB. Acceptable.              |
| Deterministic recommendation (vs. ML)         | Explainability → less personalization at extremes. ML can be added later.          |
| 10-state model (vs. 4-state)                  | Rich learner insight → complexity. Mitigated by state transition automation.       |
| Engine-based architecture (vs. service-based) | Clear separation of concerns → more files, more indirection.                       |
| Content blocks (vs. monolithic JSONB)         | Extensibility → more joins. Acceptable: content blocks are read-heavy.             |
| GQL (vs. REST endpoints for everything)       | Expressive queries → learning curve. GQL is additive to REST, not replacement.     |
| PostgreSQL (vs. Neo4j)                        | Simpler ops, existing infra → traversal speed at scale. Acceptable for 10^5 nodes. |

---

## 15. Future-Proofing

### 15.1 Architecture for AI Integration

The architecture is designed to make AI integration additive, not foundational:

- **Embedding Engine**: A future engine that generates and stores embeddings for every node
- **Semantic Recommendation Engine**: Adds ML-based scoring alongside deterministic scoring
- **RAG Pipeline**: The existing RAG Engine becomes a consumer of the Graph Engine + Embedding Engine
- **Personalized Learning Strategy**: ML model that learns which strategies work for which learners
- **Intelligent Career Pathing**: ML model that predicts career success based on node completion patterns

### 15.2 Scaling to 1M+ Nodes

- **Graph Sharding**: Split graph by category into shards
- **Read Replicas**: All graph reads hit replicas; writes hit primary
- **Cache Strategy**:
  - L1: In-process LRU cache (Graph Engine nodes/edges)
  - L2: Redis (frequently accessed subgraphs, learner states)
  - L3: PostgreSQL
- **Graph Engine Backend**: Replace in-memory dicts with Memgraph/Neo4j when 10^5 threshold is crossed
- **Async Loading**: Lazy-load node content; only metadata and edges are eager-loaded

### 15.3 Multi-Tenant Knowledge Graphs

- Future: Organizations can maintain their OWN knowledge graphs alongside the public SV-OS graph
- Each engine accepts a `graph_id` parameter
- Graph isolation at the engine level, not the database level

---

## 16. Engine Evaluation Summary

| #   | Engine                            | Decision         | Rationale                                           |
| --- | --------------------------------- | ---------------- | --------------------------------------------------- |
| 1   | **Graph Engine**                  | ✅ CORE          | Foundation — owns graph structure                   |
| 2   | **Knowledge Engine**              | ✅ CORE          | Owns node content and taxonomy                      |
| 3   | **Learning Path Engine**          | ✅ CORE          | Path generation from state to goal                  |
| 4   | **Recommendation Engine**         | ✅ MUST REDESIGN | Replace linear weights with deterministic algorithm |
| 5   | **Career Engine**                 | ✅ KEEP          | Career management and analysis                      |
| 6   | **Project Engine**                | ✅ KEEP          | Project management and recommendation               |
| 7   | **Simulator Engine**              | ✅ KEEP          | Simulator management and recommendation             |
| 8   | **Assessment Engine**             | ✅ KEEP          | Assessment tracking and mastery verification        |
| 9   | **Knowledge Validation Engine**   | ✅ KEEP          | Critical missing piece — validates all mutations    |
| 10  | **Query Engine**                  | ✅ KEEP          | Executes GQL queries against graph                  |
| 11  | **Traversal Engine**              | ✅ KEEP          | BFS/DFS/shortest path algorithms                    |
| 12  | **Progress Engine**               | ❌ REJECTED      | Merged into State Engine                            |
| 13  | **Dependency Engine**             | ✅ KEEP          | Compute dependencies, blockers, unlocks             |
| 14  | **Unlock Engine**                 | ❌ REJECTED      | Merged into Dependency Engine                       |
| 15  | **Revision Engine**               | ✅ KEEP          | Spaced repetition and forgetting curves             |
| 16  | **Analytics Engine**              | ❌ SPLIT         | Split into Graph Analytics + Learning Analytics     |
| 17  | **Search Engine**                 | ✅ KEEP          | Full-text search and ranking                        |
| 18  | **Caching Engine**                | ❌ REJECTED      | Cross-cutting concern, not an engine                |
| 19  | **Versioning Engine**             | ✅ KEEP          | Graph snapshots, diff, rollback                     |
| 20  | **Import Engine**                 | ✅ KEEP          | JSON/format import with validation                  |
| 21  | **Export Engine**                 | ✅ KEEP          | Graph export to multiple formats                    |
| 22  | **Visualization Engine**          | ✅ KEEP          | Layout and visualization data computation           |
| 23  | **Graph Transformation Engine**   | ❌ REJECTED      | No clear use case                                   |
| 24  | **Roadmap Engine**                | ❌ REJECTED      | Merged into Career + Learning Path Engines          |
| 25  | **Prerequisite Solver**           | ✅ KEEP          | Optimal prerequisite ordering                       |
| 26  | **Curriculum Engine**             | ❌ REJECTED      | Merged into Learning Path Engine                    |
| 27  | **Knowledge Health Engine**       | ❌ REJECTED      | Merged into Validation Engine                       |
| 28  | **Knowledge Integrity Engine**    | ❌ REJECTED      | Merged into Validation Engine                       |
| 29  | **Knowledge Diff Engine**         | ❌ REJECTED      | Merged into Versioning Engine                       |
| 30  | **Relationship Discovery Engine** | ✅ KEEP          | Semi-automated relationship mining                  |
| 31  | **Learning Strategy Engine**      | ✅ KEEP          | Learning strategy recommendations                   |
| 32  | **Milestone Engine**              | ❌ REJECTED      | Merged into Learning Path Engine                    |
| 33  | **Skill Engine**                  | ✅ KEEP          | Cross-cutting skill management                      |
| 34  | **Competency Engine**             | ❌ REJECTED      | Merged into Skill Engine                            |
| 35  | **Learning State Engine**         | ❌ REJECTED      | Merged into State Engine                            |
| 36  | **Graph Analytics Engine**        | ✅ KEEP (split)  | Graph-level analytical queries                      |
| 37  | **Learning Analytics Engine**     | ✅ KEEP (split)  | Learner-level analytics                             |

**Final Count: 24 Engines** (15 original KEEP/REDESIGN + 2 SPLIT into 4 = 17 + 7 full KEEP = 24)

---

## Appendix: What Changed from the Previous Plan

| Aspect                | Previous Plan                                      | New Architecture                                  |
| --------------------- | -------------------------------------------------- | ------------------------------------------------- |
| Center of gravity     | Database tables                                    | Knowledge Engine + Graph Engine                   |
| API style             | CRUD (GET/POST/PUT/DELETE)                         | Capability-based (find-path, recommend-next)      |
| Progress model        | 4 states (not_started/learning/completed/mastered) | 10 states with explicit transitions               |
| Recommendation        | Linear weighted formula (5 signals)                | Deterministic algorithm (8 signals, career-aware) |
| Engine scope          | 5 engines (recommendation, learning path, etc.)    | 24 engines with clear contracts                   |
| Validation            | None                                               | Full validation pipeline (5 stages)               |
| Query model           | REST endpoints only                                | GQL + REST                                        |
| Graph query           | Hardcoded endpoints                                | Expressive GQL language                           |
| Content storage       | `node_details` table (separate from nodes)         | `content_blocks` polymorphic system               |
| Frontend architecture | Page-based routing                                 | Viewer-based routing                              |
| Data model            | `user_progress` table                              | `learner_knowledge_states` (10-dimension model)   |
| Project structure     | Flat services directory                            | Hierarchical engines/ directory                   |
