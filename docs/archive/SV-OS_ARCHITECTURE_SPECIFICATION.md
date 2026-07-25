# SV-OS Architecture Specification

## The Definitive Architecture for a Knowledge Operating System

**Document Version**: 1.0 (Final)  
**Author**: Architecture Team  
**Status**: Ratified Design — Ready for Implementation Planning  
**Audience**: All current and future SV-OS contributors  
**Lifespan**: This document is the canonical architecture reference. It must be updated if and only if an Architecture Decision Record (ADR) supersedes a specific section.

---

## Preamble: What This Document Is and Is Not

This document is the **complete architecture specification** for the Silicon Valley Learning Operating System. It is written for engineers who will build, maintain, and extend this system over the next decade.

**This document is:**

- A complete blueprint of all subsystems and their interactions
- A specification of every engine, its purpose, its interface, and its dependencies
- A definition of every domain object, its lifecycle, and its ownership
- A storage architecture, a consistency model, a scalability strategy
- A set of principles that guide every architectural decision

**This document is not:**

- Implementation code or SQL
- A tutorial or getting-started guide
- A list of technologies (those belong in tech decisions docs)
- A project plan with dates (that belongs in the development roadmap)

---

## Part I: Foundations

### 1. Architectural Principles

These principles are ranked. When two principles conflict, the higher-ranked principle wins.

| Rank | Principle                                                      | Rationale                                                                                                                                                                  |
| ---- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **The Knowledge Graph is the source of truth**                 | Every feature emerges from the graph. If it cannot be expressed as a graph operation, it does not belong in SV-OS.                                                         |
| 2    | **Engines own logic; services orchestrate**                    | Business logic lives in pure, testable engines. Services are thin orchestrators that wire engines to the outside world. No engine calls an API endpoint or HTTP service.   |
| 3    | **State is explicit, not implicit**                            | Learner knowledge, graph health, and recommendation quality are all modeled as explicit state machines with documented transitions.                                        |
| 4    | **Validated before mutated**                                   | Every graph mutation passes through the Validation Engine before being committed. Validation is not optional.                                                              |
| 5    | **Deterministic by default, probabilistic by explicit choice** | All core algorithms (recommendation, path-finding, gap analysis) must produce identical outputs for identical inputs. ML is additive, not foundational.                    |
| 6    | **Engines communicate through events, not direct calls**       | The Event Engine is the communication backbone. No engine directly calls another engine's methods for state-changing operations. Read-only queries are the only exception. |
| 7    | **Capabilities over CRUD**                                     | APIs describe what the system can DO, not what data it stores.                                                                                                             |
| 8    | **Scale-neutral design**                                       | Every algorithm documents its complexity for V=10^2, V=10^4, and V=10^6. No algorithm with worse-than-O(V log V) complexity runs in a request path.                        |
| 9    | **Engines are replaceable**                                    | Every engine has a defined interface. Backend implementations (in-memory, PostgreSQL, Neo4j, Redis) can be swapped without changing engine consumers.                      |
| 10   | **The architecture is the product**                            | SV-OS is not a CRUD app with ML. It is an OS for knowledge. Every architectural decision serves this identity.                                                             |

### 2. What SV-OS Is

SV-OS is a **Knowledge Operating System**. It provides:

1. **A structured representation of all Computer Science knowledge** — the Knowledge Graph
2. **Engines that operate on that knowledge** — traversal, recommendation, validation, etc.
3. **A state model for learners** — where each learner is in their journey
4. **Capabilities that learners and educators can invoke** — plan a path, assess readiness, find gaps
5. **A visualization layer** — that renders graph state for human understanding

### 3. What SV-OS Is Not

- **Not a CMS** — content management is a side effect, not the core purpose
- **Not an LMS** — course management, grading, and enrollment are explicitly out of scope
- **Not a CRUD API with AI** — the API expresses capabilities, not database operations
- **Not a monolithic application** — the architecture supports decomposition into microservices when scale demands it
- **Not AI-dependent** — all core capabilities work without ML. AI is additive.

---

## Part II: Engine Architecture

### 4. Engine Design Contract

Every engine in SV-OS follows this contract:

```python
# Pseudocode — language-agnostic contract

Engine:
    # Identity
    name: str                        # Unique engine name
    version: str                     # Semantic version
    capabilities: list[Capability]   # What this engine can do

    # Lifecycle
    async initialize():              # Called once at startup. Must be idempotent.
    async health(): -> HealthStatus  # Returns engine health
    async shutdown():                # Graceful shutdown

    # Query — all queries are read-only and can be called freely
    # Each capability in capabilities defines its own query methods
```

**Key constraint**: No engine calls another engine's methods for **write operations**. Write operations must go through the Event Engine. Read-only queries (get_node, get_learner_state, etc.) are the only cross-engine direct calls allowed.

**Why**: This prevents circular call chains, makes the system testable (any engine can be tested with mocked events), and enables future decomposition into microservices.

### 5. Complete Engine Catalog

This section defines every engine in SV-OS, its single responsibility, its interface, and its dependencies.

---

#### 5.1 Graph Engine

**Responsibility**: The authoritative in-memory representation of the knowledge graph. All structural queries (nodes, edges, subgraphs) go through this engine.

**Single responsibility**: Maintain graph structure and provide read-only access to it.

```python
Engine GraphEngine:
    capabilities:
        - query_nodes(filters: NodeFilter) -> list[NodeID]
        - get_node(id: NodeID) -> KnowledgeNode
        - get_nodes(ids: list[NodeID]) -> list[KnowledgeNode]
        - get_edge(source: NodeID, target: NodeID, type: EdgeType) -> KnowledgeEdge | None
        - get_edges(source: NodeID, type: EdgeType, direction: Direction) -> list[KnowledgeEdge]
        - get_neighbors(id: NodeID, type: EdgeType, direction: Direction) -> list[NodeID]
        - get_subgraph(center: NodeID, depth: int, types: list[EdgeType]) -> Subgraph
        - node_exists(id: NodeID) -> bool
        - edge_exists(source: NodeID, target: NodeID, type: EdgeType) -> bool
        - count(filter: NodeFilter) -> int

    events_subscribed:
        - NodeCreated(id, data)      → add to graph
        - NodeUpdated(id, data)      → update in graph
        - NodeDeleted(id)            → remove from graph
        - EdgeCreated(source, target, type) → add edge
        - EdgeDeleted(source, target, type) → remove edge
        - GraphReloaded()            → reload from persistence

    persistence: PostgreSQL (knowledge_nodes, knowledge_edges)
    cache: In-memory dict (all nodes, all edges — eager-loaded on startup)
    startup: Load all nodes (30MB for 10K nodes), all edges (20MB for 50K edges)
```

---

#### 5.2 Knowledge Engine

**Responsibility**: Own the full content model for every node — learning objectives, resources, assessments, skills, tags, content blocks.

**Single responsibility**: Manage the enriched content attached to graph nodes.

```python
Engine KnowledgeEngine:
    capabilities:
        - get_content(node_id: NodeID) -> NodeContent
        - get_content_block(node_id: NodeID, block_type: BlockType) -> list[ContentBlock]
        - get_categories() -> list[Category]
        - get_nodes_by_category(category: str) -> list[NodeID]
        - get_tags(node_id: NodeID) -> list[str]
        - get_resources(node_id: NodeID, type: ResourceType) -> list[Resource]
        - get_skills_for_node(node_id: NodeID) -> list[SkillID]
        - get_assessments_for_node(node_id: NodeID) -> list[AssessmentID]

    events_subscribed:
        - NodeContentUpdated(id, content)  → update content cache
        - NodeCreated(id, initial_content) → store content

    persistence: PostgreSQL (knowledge_nodes.metadata, content_blocks)
    cache: Lazy-load per-node content; LRU cache (10,000 entries)
```

---

#### 5.3 Traversal Engine

**Responsibility**: Implement all graph traversal algorithms (BFS, DFS, shortest path, multi-source BFS, topological sort).

**Single responsibility**: Graph algorithm implementations. No state, no persistence — pure computation over graph data.

```python
Engine TraversalEngine:
    depends_on: GraphEngine (for graph data)

    capabilities:
        - bfs(start: NodeID, depth: int, edge_types: list[EdgeType]) -> TraversalResult
        - dfs(start: NodeID, depth: int, edge_types: list[EdgeType]) -> TraversalResult
        - shortest_path(source: NodeID, target: NodeID, max_depth: int) -> PathResult
        - multi_source_bfs(starts: list[NodeID], depth: int, edge_types: list[EdgeType]) -> TraversalResult
        - reachable(starts: list[NodeID], depth: int, edge_types: list[EdgeType]) -> set[NodeID]
        - topological_sort(node_ids: list[NodeID]) -> list[NodeID]
        - detect_cycle(edge_type: EdgeType) -> Cycle | None
        - find_connected_components(edge_type: EdgeType) -> list[set[NodeID]]

    complexity:
        - BFS/DFS: O(V+E) in request path. Max depth = 10. Max V per depth = 500.
        - Shortest path: O(V+E). Max V = 10,000. Falls back to bounded BFS beyond.
        - Cycle detection: O(V+E) on full graph. O(1) incremental (see Validation Engine).

    events_subscribed: None (pure computation, stateless)
```

---

#### 5.4 Event Engine

**Responsibility**: The communication backbone for all engines. Owns event publication, subscription, delivery, retry, and replay.

**Single responsibility**: Reliable asynchronous communication between engines.

**Design decisions**:

- At-least-once delivery (exactly-once is a myth; idempotent handlers are the solution)
- In-process event bus for v1 (no network overhead between engines)
- Kafka/RabbitMQ adapter for future distributed deployment
- Events are immutable after publication

```python
Engine EventEngine:
    capabilities:
        - publish(event: DomainEvent) -> EventID
        - subscribe(event_type: str, handler: EventHandler, options: SubscriptionOptions) -> Subscription
        - unsubscribe(subscription: Subscription)
        - replay(event_type: str, from: Timestamp, to: Timestamp) -> list[DomainEvent]
        - get_history(aggregate_id: str) -> list[DomainEvent]
        - get_dead_letters() -> list[FailedEvent]
        - retry_dead_letter(event_id: EventID)
        - clear_dead_letter(event_id: EventID)

    events_published:
        - See complete event catalog in Part IV

    startup: First engine to start. All other engines register subscriptions during initialize().
    persistence: PostgreSQL (event_store table — append-only, partitioned by month)
    retry: Exponential backoff: 1s, 2s, 4s, 8s. Max 3 retries. Dead letter after 3rd failure.
    idempotency: Every event has event_id (UUID v4). Handlers store processed event_ids and skip duplicates.
```

---

#### 5.5 State Engine

**Responsibility**: Own the complete knowledge state for every learner on every node. This is the most complex engine.

**Single responsibility**: Manage learner knowledge state as a state machine with documented transitions.

```python
Engine StateEngine:
    depends_on: GraphEngine (for node validation), EventEngine (for publishing transitions)

    capabilities:
        - get_learner_state(learner_id: UserID) -> LearnerState
        - get_node_state(learner_id: UserID, node_id: NodeID) -> KnowledgeState
        - get_batch_states(learner_id: UserID, node_ids: list[NodeID]) -> dict[NodeID, KnowledgeState]
        - transition(learner_id: UserID, node_id: NodeID, trigger: TransitionTrigger) -> StateTransition
        - set_confidence(learner_id: UserID, node_id: NodeID, confidence: float)
        - get_states_by_primary(learner_id: UserID, state: KnowledgeState) -> list[NodeID]
        - get_completed_ids(learner_id: UserID) -> set[NodeID]
        - get_terminal_ids(learner_id: UserID) -> set[NodeID]
        - get_velocity(learner_id: UserID, days: int) -> LearningVelocity
        - get_streak(learner_id: UserID) -> LearningStreak

    events_subscribed:
        - All learning events (see Part IV) — these trigger state transitions

    events_published:
        - StateTransitioned(learner_id, node_id, from_state, to_state, trigger)
        - ConfidenceUpdated(learner_id, node_id, new_confidence)

    persistence: PostgreSQL (learner_knowledge_states — partitioned by learner_id % 16)
    cache: Redis (full learner state for active learners; 24h TTL with write-through)
    scale: 10M learners × 100 nodes = 1B rows. Partitioned by learner_id hash. Hot storage for active state; cold archive for terminal states.
```

---

#### 5.6 Dependency Engine

**Responsibility**: Compute dependency relationships between nodes — prerequisites, unlocks, blockers, downstream impact.

**Single responsibility**: Answer "what depends on what" questions.

```python
Engine DependencyEngine:
    depends_on: GraphEngine, TraversalEngine

    capabilities:
        - get_prerequisites(node_id: NodeID, depth: int) -> list[NodeID]
        - get_dependents(node_id: NodeID, depth: int) -> list[NodeID]
        - get_unlocks(node_id: NodeID, depth: int) -> list[NodeID]
        - find_blockers(learner_id: UserID, node_id: NodeID) -> list[Blocker]
        - find_downstream(node_id: NodeID, depth: int) -> list[NodeID]
        - compute_depth(node_id: NodeID) -> int
        - find_bottlenecks(limit: int) -> list[BottleneckReport]
        - is_ready(learner_id: UserID, node_id: NodeID) -> bool  # all prereqs satisfied?
        - get_prerequisite_graph(node_ids: list[NodeID]) -> Subgraph

    events_subscribed: None (reads from GraphEngine and TraversalEngine)
    cache: Prerequisite chains cached per node (24h TTL, invalidated on graph changes)
```

---

#### 5.7 Validation Engine

**Responsibility**: Validate every graph mutation before and after it is committed.

**Single responsibility**: Ensure graph integrity through incremental, full, background, and continuous validation.

```python
Engine ValidationEngine:
    depends_on: GraphEngine, TraversalEngine

    capabilities:
        # Incremental (O(1) per mutation — for request path)
        - validate_edge(source: NodeID, target: NodeID, type: EdgeType) -> ValidationResult
        - validate_node(node: KnowledgeNode) -> ValidationResult
        - validate_career_node(career_id: CareerID, node_id: NodeID) -> ValidationResult

        # Full (O(V+E) — for import completion, scheduled jobs)
        - validate_full_graph() -> ValidationReport
        - validate_import(data: RawGraphData) -> ValidationReport

        # Background (continuous, periodic)
        - start_background_validation()  # Runs on a schedule
        - get_validation_status() -> ValidationStatus

        # Health
        - compute_health_score() -> GraphHealthScore
        - get_validation_cache() -> dict  # Cached validation results

    incremental_cycle_detection:
        - Maintain topological_order_index: dict[NodeID, int] (computed via Kahn's algorithm)
        - On edge add (A → B): if order[A] < order[B], NO cycle. O(1).
        - On edge add (A → B): if order[A] >= order[B], run bounded DFS from B to A. O(E) worst case.
        - On import: recompute all orders. O(V+E). Done once, not per-row.

    validation_checks:
        STRUCTURAL:
            - Referential integrity (every FK resolves)
            - No duplicate slugs
            - No self-loops
            - No duplicate edges (by source+target+type)
            - No cycles (via incremental algorithm)
        SEMANTIC:
            - Prerequisite depth sanity (< 20)
            - Difficulty progression (no beginner → expert jumps)
            - Career nodes exist
            - Simulator nodes exist
        HEALTH:
            - Connectivity ratio
            - Isolated node count
            - Average branching factor
            - Depth distribution
            - Bottleneck identification

    events_subscribed:
        - EdgeCreated → incremental validation
        - EdgeDeleted → update topological order
        - NodeCreated → validate node
        - GraphImported → full validation + health score

    events_published:
        - ValidationWarning(component, issue, severity)
        - ValidationFailed(component, errors)
        - HealthScoreComputed(score, breakdown)

    cache: Validation results cached for 5 minutes (stale-while-revalidate for graph operations)
```

---

#### 5.8 Search Engine

**Responsibility**: Full-text search, autocomplete, and faceted filtering across all nodes.

**Single responsibility**: Indexing and searching knowledge content.

```python
Engine SearchEngine:
    depends_on: KnowledgeEngine

    capabilities:
        - search(query: str, filters: SearchFilter, page: int, per_page: int) -> SearchResult
        - suggest(prefix: str, limit: int) -> list[str]
        - search_by_type(query: str, node_type: NodeType) -> SearchResult
        - search_by_category(query: str, category: str) -> SearchResult
        - get_trending(limit: int) -> list[str]
        - record_search(learner_id: UserID, query: str, results_count: int)
        - get_history(learner_id: UserID) -> list[SearchRecord]

    events_subscribed:
        - NodeCreated → add to search index
        - NodeContentUpdated → reindex
        - NodeDeleted → remove from index

    persistence: PostgreSQL tsvector (primary), Elasticsearch (optional for scale)
    cache: Search results cached for 5 minutes. Trending cached for 1 hour.
```

---

#### 5.9 Skill Engine

**Responsibility**: Manage skills as cross-cutting competencies that span multiple knowledge nodes.

**Single responsibility**: Define skills, map skills to nodes, compute skill proficiency from knowledge state.

```python
Engine SkillEngine:
    depends_on: GraphEngine, KnowledgeEngine

    capabilities:
        - get_skill(skill_id: SkillID) -> Skill
        - list_skills(filters: SkillFilter) -> list[Skill]
        - get_skills_for_node(node_id: NodeID) -> list[Skill]
        - get_nodes_for_skill(skill_id: SkillID) -> list[NodeID]
        - get_skill_proficiency(learner_id: UserID, skill_id: SkillID) -> Proficiency
        - get_learner_skill_profile(learner_id: UserID) -> SkillProfile
        - get_career_skill_gap(learner_id: UserID, career_id: CareerID) -> SkillGap
        - find_skill_relationships(skill_id: SkillID) -> list[SkillRelationship]

    events_subscribed:
        - StateTransitioned → recalculate skill proficiency (batch, periodic, not per-event)

    persistence: PostgreSQL (skills, skill_relationships, skill_node_mappings)
```

---

#### 5.10 Career Engine

**Responsibility**: Define careers, map careers to nodes and skills, compute career gaps and transitions.

**Single responsibility**: Career pathing and gap analysis.

```python
Engine CareerEngine:
    depends_on: GraphEngine, SkillEngine, StateEngine

    capabilities:
        - get_career(career_id: CareerID) -> Career
        - list_careers(filters: CareerFilter) -> list[Career]
        - get_career_roadmap(career_id: CareerID, seniority_level: int) -> CareerRoadmap
        - compare_careers(a: CareerID, b: CareerID) -> CareerComparison
        - get_gap(learner_id: UserID, career_id: CareerID) -> SkillGap
        - recommend_careers(learner_id: UserID, limit: int) -> list[CareerRecommendation]
        - get_seniority_progression(career_id: CareerID) -> list[SeniorityLevel]
        - get_nodes_for_seniority(career_id: CareerID, level: int) -> list[NodeID]
        - estimate_completion_time(learner_id: UserID, career_id: CareerID) -> TimeEstimate

    events_subscribed:
        - StateTransitioned → invalidate gap analysis cache per learner

    persistence: PostgreSQL (careers, career_requirements, career_seniority_nodes, seniority_levels)
```

---

#### 5.11 Learning Path Engine

**Responsibility**: Generate ordered sequences of nodes from a learner's current state to a goal.

**Single responsibility**: Path generation with configurable strategies.

```python
Engine LearningPathEngine:
    depends_on: GraphEngine, TraversalEngine, DependencyEngine, StateEngine, CareerEngine

    capabilities:
        - generate_path(learner_id: UserID, goal: Goal, strategy: PathStrategy) -> LearningPath
        - generate_career_path(learner_id: UserID, career_id: CareerID, seniority_level: int) -> LearningPath
        - reoptimize_path(learner_id: UserID, path_id: PathID) -> LearningPath
        - compare_paths(path_a: PathID, path_b: PathID) -> PathDiff
        - estimate_time(learner_id: UserID, path: LearningPath) -> TimeEstimate
        - get_alternative_paths(learner_id: UserID, goal: Goal, count: int) -> list[LearningPath]

    strategies:
        - fastest: Minimize total estimated time
        - most_thorough: Cover all prerequisites, no shortcuts
        - easiest: Prefer lower-difficulty nodes first
        - career_aligned: Prioritize nodes on the learner's chosen career path
        - balanced: Mix of all strategies (default)

    events_subscribed: None (reads state, does not write)
    cache: Generated paths cached for 1 hour (invalidated on state change)
```

---

#### 5.12 Prerequisite Solver

**Responsibility**: Solve the core analytical question: given known nodes, a goal, and constraints, what is the optimal order to learn prerequisites?

**Single responsibility**: Prerequisite ordering and readiness computation.

```python
Engine PrerequisiteSolver:
    depends_on: GraphEngine, DependencyEngine, StateEngine

    capabilities:
        - find_optimal_order(known_ids: set[NodeID], goal_id: NodeID) -> list[NodeID]
        - find_minimal_set(known_ids: set[NodeID], goal_id: NodeID) -> list[NodeID]
        - compute_readiness(learner_id: UserID, node_id: NodeID) -> ReadinessScore
        - find_alternative_prereqs(node_id: NodeID) -> list[list[NodeID]]
        - identify_blockers(learner_id: UserID, node_id: NodeID) -> list[Blocker]
        - suggest_pruning(known_ids: set[NodeID], goal_id: NodeID) -> list[NodeID]  # nodes that CAN be skipped

    algorithm:
        1. From goal, BFS backward through prerequisites to build full dependency tree
        2. Topologically sort all discovered nodes
        3. Remove nodes in known_ids
        4. Return remaining nodes in topological order
        5. For minimal set: find all nodes that are strictly on SOME path from known → goal
           (prune nodes that are only on dead-end branches)

    events_subscribed: None (pure computation)
```

---

#### 5.13 Recommendation Engine

**Responsibility**: Answer "what should I learn next?" through deterministic decision rules — NOT weighted formulas.

**Single responsibility**: Determine the optimal next learning action for a learner.

The Recommendation Engine uses **decision rules**, not scoring weights. Each rule outputs a binary or ordinal signal. A priority arbiter selects the highest-priority candidate.

```python
Engine RecommendationEngine:
    depends_on: StateEngine, DependencyEngine, CareerEngine, KnowledgeEngine, PrerequisiteSolver

    capabilities:
        - get_next_concept(learner_id: UserID, context: RecommendationContext) -> Recommendation
        - get_next_n_concepts(learner_id: UserID, context: RecommendationContext, n: int) -> list[Recommendation]
        - get_review_candidates(learner_id: UserID, limit: int) -> list[Recommendation]
        - get_daily_plan_input(learner_id: UserID, context: RecommendationContext) -> DailyPlanInput
        - explain(id: RecommendationID) -> Explanation
        - rerank(learner_id: UserID, candidates: list[NodeID], context: RecommendationContext) -> list[Recommendation]

    decision_rules:
        # Rules are evaluated IN ORDER. First rule that yields a candidate wins.
        # Each rule returns (candidate, confidence, reason) or None.

        RULE 1: URGENT_REVIEW
            "If any node has state = NEEDS_REVISION and was correct >3 times before,
             recommend that node for review. Confidence = 0.9. It's the highest-leverage action."
            Priority override: Review candidates are returned separately from new concepts.

        RULE 2: REINFORCE_WEAK
            "If any recently learned node has confidence < 0.3 and its assessment score < 0.5,
             recommend that node for reinforcement. Confidence = 0.8."

        RULE 3: CONTINUE_STREAK
            "If the learner is in state LEARNING or PRACTICING on any node and has worked on
             it in the last 3 days, continue that node first. Confidence = 0.75."

        RULE 4: CAREER_REQUIREMENT
            "If any node is in state UNKNOWN and is a required node for the learner's active
             career path, and its prerequisites are all satisfied, recommend it.
             Confidence = 0.7. Reason: 'Required for your X career path.'"

        RULE 5: UNLOCK_POTENTIAL
            "Among all UNKNOWN or INTRODUCED nodes with satisfied prerequisites,
             recommend the one that unlocks the MOST other nodes.
             Confidence = 0.6."

        RULE 6: WIDEST_DEPENDENCY
            "Among remaining candidates, recommend the one with the highest
             dependent count (most downstream nodes depend on it).
             Confidence = 0.5."

        RULE 7: SHORTEST_TIME
            "Among remaining candidates, recommend the one with the shortest
             estimated learning time that fits the available time budget.
             Confidence = 0.4."

        RULE 8: EASIEST_FIRST
            "Recommend the lowest-difficulty candidate.
             Confidence = 0.3."

    # Decision trees are more maintainable than weighted formulas.
    # Engineers can add, remove, or reorder rules without retuning constants.
    # Every recommendation is explainable: "Rule 4 fired because career_path=X."
    # Rules can be disabled per-learner for A/B testing.

    events_subscribed:
        - StateTransitioned → invalidate candidate cache
        - CareerSelected → recompute career-relevant candidates

    cache: Candidates cached per learner for 5 minutes.
```

---

#### 5.14 Scheduling Engine

**Responsibility**: Given recommendations from the Recommendation Engine, decide WHEN to study each item. Scheduling is distinct from recommendation.

**Single responsibility**: Optimal time allocation for learning activities.

```python
Engine SchedulingEngine:
    depends_on: RecommendationEngine, StateEngine, RevisionEngine

    capabilities:
        - generate_daily_plan(learner_id: UserID, available_minutes: int, preferences: SchedulePrefs) -> DailyPlan
        - generate_weekly_plan(learner_id: UserID, daily_budget: int, preferences: SchedulePrefs) -> WeeklyPlan
        - generate_semester_plan(learner_id: UserID, career_id: CareerID, weeks: int) -> SemesterPlan
        - reschedule(learner_id: UserID, missed_days: list[date]) -> RevisedPlan
        - estimate_semester_completion(learner_id: UserID, career_id: CareerID, hours_per_week: int) -> TimeEstimate

    algorithm:
        INPUT:
            - recommended_nodes: list[NodeID] (from RecommendationEngine)
            - review_nodes: list[NodeID] (from RevisionEngine)
            - daily_budget: int (minutes available per day)
            - preferences: SchedulePrefs

        1. Merge recommended + review candidates
        2. Priority sort:
            a. Review due today (from RevisionEngine) — highest priority
            b. Career-required nodes with satisfied prerequisites
            c. Nodes in LEARNING state (continue streak)
            d. New nodes by unlock potential
        3. Fit into time budget:
            a. Take highest-priority item
            b. Subtract estimated time from budget
            c. Repeat until budget exhausted
        4. Return ordered plan with time allocations

    events_subscribed:
        - PlanCompleted(learner_id, plan_id) → mark plan as used
        - PlanDeviation(learner_id, plan_id, deviation) → suggest reschedule

    persistence: PostgreSQL (learning_plans, plan_items)
```

---

#### 5.15 Revision Engine

**Responsibility**: Generate revision schedules based on forgetting curves, knowledge state, and assessment scores.

**Single responsibility**: Spaced repetition scheduling for knowledge retention.

```python
Engine RevisionEngine:
    depends_on: StateEngine, AssessmentEngine

    capabilities:
        - get_due_reviews(learner_id: UserID, date: date) -> list[ReviewItem]
        - generate_schedule(learner_id: UserID, horizon_days: int) -> RevisionSchedule
        - adjust_schedule(learner_id: UserID, event: DomainEvent) -> RevisionSchedule
        - compute_retention(learner_id: UserID, node_id: NodeID) -> float
        - get_review_history(learner_id: UserID, node_id: NodeID) -> list[ReviewRecord]

    forgetting_curve:
        - New node: review after 1 day, 3 days, 7 days, 14 days, 30 days
        - Correct review: double the interval
        - Incorrect review: halve the interval, reset to next-day review
        - Mastered: review after 30, 60, 120 days (maintenance only)

    events_subscribed:
        - ReviewCompleted(learner_id, node_id, correct) → adjust interval
        - AssessmentSubmitted(learner_id, node_id, score) → if score < 0.7, schedule review
        - StateTransitioned → if to_state = FORGOTTEN, schedule urgent review
```

---

#### 5.16 Assessment Engine

**Responsibility**: Manage assessments, assessment results, and mastery verification.

**Single responsibility**: Validating learner knowledge through assessments.

```python
Engine AssessmentEngine:
    depends_on: KnowledgeEngine, StateEngine

    capabilities:
        - get_assessments(node_id: NodeID, type: AssessmentType) -> list[Assessment]
        - submit(learner_id: UserID, assessment_id: AssessmentID, result: AssessmentResult) -> AssessmentOutcome
        - get_history(learner_id: UserID, node_id: NodeID) -> list[AssessmentRecord]
        - verify_mastery(learner_id: UserID, node_id: NodeID) -> MasteryVerdict
        - recommend_assessment(learner_id: UserID, node_id: NodeID) -> AssessmentRecommendation
        - calibrate_difficulty(assessment_id: AssessmentID) -> Difficulty

    events_published:
        - AssessmentSubmitted(learner_id, node_id, assessment_id, score, max_score)

    events_subscribed:
        - NodeStudied → if studying for >20 min, suggest an assessment
```

---

#### 5.17 Project Engine

**Responsibility**: Manage projects, project-node mappings, and project-level framework.

**Single responsibility**: Project-based learning recommendations.

```python
Engine ProjectEngine:
    depends_on: KnowledgeEngine, StateEngine

    capabilities:
        - list_projects(filters: ProjectFilter) -> list[Project]
        - get_projects_for_node(node_id: NodeID) -> list[Project]
        - recommend_project(learner_id: UserID, node_id: NodeID) -> ProjectRecommendation
        - generate_project_roadmap(career_id: CareerID, leaner_id: UserID) -> list[Project]
        - estimate_readiness(learner_id: UserID, project_id: ProjectID) -> ReadinessScore
        - get_project_levels() -> list[ProjectLevel]
```

---

#### 5.18 Simulator Engine

**Responsibility**: Manage simulator definitions, node-simulator mappings, and simulator feasibility.

**Single responsibility**: Interactive simulation recommendations.

```python
Engine SimulatorEngine:
    depends_on: KnowledgeEngine

    capabilities:
        - list_simulators(filters: SimulatorFilter) -> list[Simulator]
        - get_simulators_for_node(node_id: NodeID) -> list[Simulator]
        - recommend_simulator(learner_id: UserID, node_id: NodeID) -> SimulatorRecommendation
        - get_implementation_effort(simulator_id: SimulatorID) -> EffortEstimate
```

---

#### 5.19 Analytics Engine

**Responsibility**: Learner-level analytics — velocity, patterns, forecasts.

**Single responsibility**: Understanding how learners learn.

```python
Engine AnalyticsEngine:
    depends_on: StateEngine, CareerEngine, EventEngine

    capabilities:
        - get_learner_stats(learner_id: UserID) -> LearnerStats
        - get_velocity(learner_id: UserID, days: int) -> LearningVelocity
        - get_completion_forecast(learner_id: UserID, goal_id: NodeID) -> CompletionForecast
        - get_weekly_activity(learner_id: UserID, weeks: int) -> list[WeeklySnapshot]
        - get_category_mastery(learner_id: UserID) -> dict[str, float]
        - get_streak(learner_id: UserID) -> LearningStreak
        - get_difficulty_progression(learner_id: UserID) -> list[DifficultySnapshot]
        - identify_patterns(learner_id: UserID) -> LearningPatterns

    events_subscribed: All events (for metric computation)
```

---

#### 5.20 Validation Engine (separate entry for clarity)

The Validation Engine is defined in 5.7 above. It is a single engine with four validation modes:

| Mode        | Trigger                       | Scope            | Cost   | When                     |
| ----------- | ----------------------------- | ---------------- | ------ | ------------------------ |
| Incremental | Every edge/node mutation      | Single mutation  | O(1)   | Request path             |
| Full        | Import complete, API call     | Entire graph     | O(V+E) | After import, on demand  |
| Background  | Scheduled (every 24h)         | Entire graph     | O(V+E) | Async, non-blocking      |
| Continuous  | Event-driven on graph changes | Changed subgraph | O(k)   | Real-time, idle-priority |

---

#### 5.21 Event Engine (separate entry for clarity)

The Event Engine is defined in 5.4 above. Key design:

**Event ordering**: Events from the same aggregate (e.g., same learner, same node) are delivered in publication order. Events from different aggregates have no ordering guarantee.

**Replay**: The `replay` method reads from the append-only event store and re-publishes events. Replayed events have `is_replay: true` in metadata so handlers can distinguish live events from replays.

**Future event sourcing**: The event store is designed for eventual event sourcing of critical state (learner progress, graph mutations). Every state-changing operation is already recorded as an event. A future EventSourcingEngine could rebuild state from events without modifying the event store schema.

---

### 6. Engine Dependency Graph (Complete)

```
LAYER 0 — Infrastructure
    EventEngine                     (foundation — no deps, starts first)

LAYER 1 — Graph & Content
    GraphEngine                     (depends on: nothing)
    KnowledgeEngine                 (depends on: GraphEngine)
    SearchEngine                    (depends on: KnowledgeEngine)

LAYER 2 — Graph Algorithms
    TraversalEngine                 (depends on: GraphEngine)
    ValidationEngine                (depends on: GraphEngine, TraversalEngine)

LAYER 3 — Learner State
    StateEngine                     (depends on: GraphEngine, EventEngine)
    DependencyEngine                (depends on: GraphEngine, TraversalEngine)
    PrerequisiteSolver              (depends on: GraphEngine, DependencyEngine, StateEngine)

LAYER 4 — Domain Engines
    SkillEngine                     (depends on: GraphEngine, KnowledgeEngine)
    CareerEngine                    (depends on: GraphEngine, SkillEngine, StateEngine)
    AssessmentEngine                (depends on: KnowledgeEngine, StateEngine)
    ProjectEngine                   (depends on: KnowledgeEngine, StateEngine)
    SimulatorEngine                 (depends on: KnowledgeEngine)

LAYER 5 — Learning Engines
    LearningPathEngine              (depends on: Graph, Traversal, Dependency, State, Career)
    RevisionEngine                  (depends on: State, Assessment)
    AnalyticsEngine                 (depends on: State, Career, Event)
    SchedulingEngine                (depends on: Recommendation, State, Revision)

LAYER 6 — Decision Engines
    RecommendationEngine            (depends on: State, Dependency, Career, Knowledge, PrereqSolver)

LAYER 7 — Import/Export/Versioning
    ValidationEngine (also here for import validation)
    VersioningEngine                (depends on: GraphEngine)
    ImportEngine                    (depends on: Validation, Versioning, Graph, Knowledge, Career, Simulator)
    ExportEngine                    (depends on: Graph, Knowledge, Career)
```

**Why each dependency exists:**

| Edge                                      | Why                                            |
| ----------------------------------------- | ---------------------------------------------- |
| StateEngine → GraphEngine                 | Validates node_id exists before creating state |
| StateEngine → EventEngine                 | Publishes StateTransitioned events             |
| CareerEngine → SkillEngine                | Career gap analysis uses skill→node mappings   |
| CareerEngine → StateEngine                | Needs learner state to compute gaps            |
| RecommendationEngine → StateEngine        | Primary input: learner knowledge state         |
| RecommendationEngine → DependencyEngine   | Needs unlock chains and dependency depth       |
| RecommendationEngine → CareerEngine       | Needs active career goals                      |
| RecommendationEngine → PrerequisiteSolver | Needs readiness scores                         |
| SchedulingEngine → RecommendationEngine   | Consumes recommendation candidates             |
| SchedulingEngine → RevisionEngine         | Needs review candidates                        |
| ImportEngine → ValidationEngine           | Validates before every import commit           |
| ImportEngine → VersioningEngine           | Creates version snapshots on import            |

**No circular dependencies**: The graph is strictly layered. Layer N engines depend only on Layer < N engines. The only exception is ValidationEngine appearing in both Layer 2 (incremental) and Layer 7 (import), but these are different capabilities of the same engine, not a cycle.

---

### 7. Engine Startup Order

```
1. EventEngine          (communication backbone must exist first)
2. GraphEngine          (foundation for all graph-dependent engines)
3. KnowledgeEngine      (content layer)
4. SearchEngine         (indexing, no cross-deps)
5. TraversalEngine      (algorithms, no cross-deps)
6. ValidationEngine     (validates graph after load)
7. StateEngine          (learner state)
8. DependencyEngine     (dependencies)
9. PrerequisiteSolver   (ordering)
10. SkillEngine         (skills)
11. CareerEngine        (careers)
12. AssessmentEngine    (assessments)
13. ProjectEngine       (projects)
14. SimulatorEngine     (simulators)
15. LearningPathEngine  (paths)
16. RevisionEngine      (revision)
17. AnalyticsEngine     (analytics)
18. RecommendationEngine (recommendations)
19. SchedulingEngine    (scheduling)
20. VersioningEngine    (versioning)
21. ImportEngine        (import)
22. ExportEngine        (export)

Step 1-6: Sequentially (each builds on previous)
Step 7-14: In parallel (no cross-dependencies in this group)
Step 15-19: Sequentially (each builds on previous groups)
Step 20-22: In parallel (independent)
```

---

## Part III: Domain Model

### 8. Complete Domain Object Catalog

Every domain object in SV-OS, its purpose, lifecycle, ownership, relationships, and persistence.

---

#### 8.1 KnowledgeNode

**Purpose**: A single learnable concept in the knowledge graph.

**Lifecycle**: Created via import → Updated via content edits → Marked deprecated → Soft-deleted.

**Owned by**: GraphEngine (structure) + KnowledgeEngine (content). These are two facets of the same object.

**Relationships**:

- Prerequisites: directed edges to other KnowledgeNodes
- Unlocks: derived inverse of prerequisites
- Cross-domain connections: typed edges to other KnowledgeNodes
- Content blocks: 0..N ContentBlocks
- Skills: 0..N Skills (through Skill-node mapping)
- Assessments: 0..N Assessments
- Simulators: 0..N Simulators (through node-simulator mapping)
- Projects: 0..N Projects (through project-requirement mapping)
- Careers: 0..N Careers (through career-requirement mapping)
- Learner states: 0..N KnowledgeStates (one per learner who has encountered it)

**Persistence**: PostgreSQL `knowledge_nodes` table. Content in `content_blocks` table. Graph engine keeps structure in memory.

---

#### 8.2 KnowledgeEdge

**Purpose**: A typed, directed relationship between two KnowledgeNodes.

**Types**: `prerequisite`, `cross_domain_connection`, `hidden_relationship`

**Lifecycle**: Created via import → Deleted via graph edit.

**Owned by**: GraphEngine.

**Persistence**: PostgreSQL `knowledge_edges` (prerequisites + cross-domain) + `hidden_relationships` (hidden relationships).

---

#### 8.3 ContentBlock

**Purpose**: A single piece of educational content attached to a node.

**Types**: `theory`, `example`, `visualization`, `flashcard`, `mini_project`, `major_project`, `code_playground`, `assessment`, `simulator_ref`, `resource`, `interview_question`, `coding_challenge`, `learning_objective`, `learning_outcome`, `tag`, `ai_tutor_context`

**Lifecycle**: Created via import → Edited → Deleted.

**Owned by**: KnowledgeEngine.

**Persistence**: PostgreSQL `content_blocks` table (node_id, block_type, content JSONB, order_index).

---

#### 8.4 Career

**Purpose**: A professional career path with required knowledge nodes and seniority progression.

**Lifecycle**: Created via import → Updated → Published/unpublished.

**Owned by**: CareerEngine.

**Relationships**:

- Required nodes: 0..N KnowledgeNodes (through career_requirements)
- Optional nodes: 0..N KnowledgeNodes
- Seniority levels: 1..10 SeniorityLevels (through career_seniority_nodes)

**Persistence**: PostgreSQL `careers`, `career_requirements`, `career_seniority_nodes`, `seniority_levels`.

---

#### 8.5 SeniorityLevel

**Purpose**: A level in the 10-level seniority ladder (Complete Beginner → Innovator).

**Lifecycle**: Defined in config, extended per career.

**Owned by**: CareerEngine.

**Persistence**: PostgreSQL `seniority_levels` (lookup data).

---

#### 8.6 Skill

**Purpose**: A cross-cutting ability that may be taught by multiple knowledge nodes.

**Lifecycle**: Created via import → Updated → Deleted.

**Owned by**: SkillEngine.

**Relationships**:

- Knowledge nodes: 0..N KnowledgeNodes (through skill-node mapping)
- Other skills: 0..N Skills (through skill_relationships)

**Persistence**: PostgreSQL `skills`, `skill_relationships`, `skill_node_mappings`.

---

#### 8.7 Project

**Purpose**: A hands-on exercise that applies knowledge from one or more nodes.

**Levels**: Tiny Exercise, Mini Project, Intermediate Project, Portfolio Project, Production Project, Industry-scale Project, Startup-level Project, Research Project.

**Lifecycle**: Defined in data → Assigned recommended by engine.

**Owned by**: ProjectEngine.

**Persistence**: PostgreSQL `projects`, `project_requirements`.

---

#### 8.8 Simulator

**Purpose**: An interactive simulation that lets a learner manipulate a concept visually.

**Lifecycle**: Defined in data → Assigned recommended by engine.

**Owned by**: SimulatorEngine.

**Persistence**: PostgreSQL `simulators`, `node_simulators`.

---

#### 8.9 Assessment

**Purpose**: A question, exercise, or challenge that validates knowledge of a node.

**Types**: `quiz`, `coding_challenge`, `interview_question`, `practice_exercise`, `flashcard`, `project`

**Lifecycle**: Created → Taken by learners → Results tracked.

**Owned by**: AssessmentEngine.

**Persistence**: PostgreSQL `assessments`, `assessment_records`.

---

#### 8.10 KnowledgeState

**Purpose**: A learner's current relationship to a knowledge node.

**Possible values**: UNKNOWN, INTRODUCED, LEARNING, PRACTICING, APPLIED, MASTERED, TEACHING, FORGOTTEN, NEEDS_REVISION, DEPRECATED

**Lifecycle**: Created on first encounter → Transitions through state machine → Archived on deprecation.

**Owned by**: StateEngine.

**Persistence**: PostgreSQL `learner_knowledge_states` (partitioned by learner_id % 16).

For the complete state machine, see Part IV.

---

#### 8.11 LearnerState

**Purpose**: Aggregation of all KnowledgeStates for a single learner, plus learner-level metadata.

**Lifecycle**: Created on first user activity → Updated on every state transition.

**Owned by**: StateEngine.

**Persistence**: Redis cache + PostgreSQL snapshot.

---

#### 8.12 LearningPath

**Purpose**: An ordered sequence of nodes from a learner's current state to a goal.

**Lifecycle**: Generated → Used → Re-optimized → Completed.

**Owned by**: LearningPathEngine.

**Persistence**: PostgreSQL `learning_paths`, `learning_path_nodes`.

---

#### 8.13 DailyPlan

**Purpose**: A day's learning schedule for a learner.

**Lifecycle**: Generated at start of day → Updated as learner completes items.

**Owned by**: SchedulingEngine.

**Persistence**: PostgreSQL `daily_plans`, `plan_items` (transient; archived after 90 days).

---

#### 8.14 WeeklyPlan

**Purpose**: A week's learning schedule.

**Owned by**: SchedulingEngine.

---

#### 8.15 SemesterPlan

**Purpose**: A multi-week learning plan toward a career goal.

**Owned by**: SchedulingEngine.

---

#### 8.16 RevisionPlan

**Purpose**: A schedule of review items based on forgetting curves.

**Owned by**: RevisionEngine.

**Persistence**: Computed; cached in Redis; not stored permanently.

---

#### 8.17 Recommendation

**Purpose**: A single recommendation output by the RecommendationEngine.

**Lifecycle**: Generated per request → Explained if needed → Discarded.

**Owned by**: RecommendationEngine.

**Persistence**: None (computed on demand; optionally logged for analytics).

---

#### 8.18 DomainEvent

**Purpose**: A record of something that happened in the system.

**Lifecycle**: Published → Delivered to subscribers → Archived.

**Owned by**: EventEngine.

**Persistence**: PostgreSQL `event_store` (append-only, immutable, partitioned by month).

---

#### 8.19 GraphVersion

**Purpose**: A snapshot of the knowledge graph at a point in time.

**Lifecycle**: Created on import → Diffed → Rolled back to if needed.

**Owned by**: VersioningEngine.

**Persistence**: PostgreSQL `graph_versions` (snapshot JSONB, metadata).

---

#### 8.20 ValidationReport

**Purpose**: Output of a full graph validation.

**Lifecycle**: Generated → Reviewed → Archived.

**Owned by**: ValidationEngine.

**Persistence**: Optional; cached in Redis for 24 hours.

---

#### 8.21 GraphHealthScore

**Purpose**: A numeric measure of graph quality (0.0-1.0).

**Lifecycle**: Computed on validation → Updated on significant changes.

**Owned by**: ValidationEngine.

---

#### 8.22 CareerComparison

**Purpose**: The result of comparing two careers (common nodes, unique nodes).

**Lifecycle**: Computed on request → Discarded.

**Owned by**: CareerEngine.

---

#### 8.23 SkillGap

**Purpose**: The skills (and their nodes) a learner is missing for a career.

**Lifecycle**: Computed on request → Cached for 1 hour.

**Owned by**: SkillEngine, CareerEngine.

---

#### 8.24 LearnerGoal

**Purpose**: A goal a learner has set for themselves (target career, target node, target skill).

**Lifecycle**: Created by learner → Updated → Achieved → Replaced.

**Owned by**: StateEngine.

**Persistence**: PostgreSQL `learner_goals`.

---

#### 8.25 Milestone

**Purpose**: A named checkpoint within a LearningPath.

**Owned by**: LearningPathEngine (as a structural element of a path).

---

#### 8.26 ConceptDecomposition

**Purpose**: The hierarchical breakdown of a node into modules → topics → concepts → micro-concepts → atomic knowledge units.

**Owned by**: KnowledgeEngine.

**Persistence**: PostgreSQL `concept_decomposition` table.

---

## Part IV: Event Model

### 9. Complete Event Catalog

Every event in the system, organized by publisher.

```
EVENT CATALOG
══════════════

LEARNING EVENTS (published by Frontend or API layer)
─────────────────────────────────────────────────────
NodeEncountered
    - learner_id, node_id, source (search|path|recommendation|browse|external)
    - Trigger: Learner views a node for the first time
    - State effect: UNKNOWN → INTRODUCED

NodeStudied
    - learner_id, node_id, duration_minutes, method (read|watch|code|interactive)
    - Trigger: Learner completes a study session on a node
    - State effect: INTRODUCED → LEARNING (if first study)

NodePracticed
    - learner_id, node_id, project_id | simulator_id, duration_minutes
    - Trigger: Learner completes a project or simulator exercise
    - State effect: LEARNING → PRACTICING

NodeApplied
    - learner_id, node_id, context (real_world|project|internship|work)
    - Trigger: Learner uses knowledge in real-world context
    - State effect: PRACTICING → APPLIED

AssessmentSubmitted
    - learner_id, node_id, assessment_id, score, max_score, time_taken_minutes
    - Trigger: Learner completes an assessment
    - State effect: If score >= mastery_threshold: APPLIED → MASTERED
                   If score < threshold: current_state → NEEDS_REVISION

NodeTaught
    - learner_id, node_id, audience, context
    - Trigger: Learner teaches the concept to others
    - State effect: MASTERED → TEACHING

ReviewCompleted
    - learner_id, node_id, correct (bool), review_type
    - Trigger: Learner completes a review session
    - State effect: If correct: NEEDS_REVISION → APPLIED or FORGOTTEN → LEARNING
                   If incorrect: remains NEEDS_REVISION

TimeDecay
    - learner_id, node_id, days_since_last_review
    - Trigger: Scheduled background job (daily)
    - State effect: If MASTERED and days > threshold: MASTERED → FORGOTTEN
                   If APPLIED and days > threshold: APPLIED → FORGOTTEN

GRAPH EVENTS (published by ValidationEngine, ImportEngine)
──────────────────────────────────────────────────────────
NodeCreated
    - node_id, node_data
    - Trigger: New node imported

NodeUpdated
    - node_id, changes
    - Trigger: Node content or metadata updated

NodeDeleted
    - node_id
    - Trigger: Node removed from graph

EdgeCreated
    - source_id, target_id, edge_type
    - Trigger: New edge created

EdgeDeleted
    - source_id, target_id, edge_type
    - Trigger: Edge removed

GraphImported
    - version_id, node_count, edge_count, health_score
    - Trigger: Import completed successfully

GraphValidationFailed
    - version_id, errors, severity
    - Trigger: Import validation failed

LEARNER EVENTS (published by Frontend or API layer)
────────────────────────────────────────────────────
LearnerOnboarded
    - learner_id, preferences

GoalCreated
    - learner_id, goal (career_id | node_id | skill_id), target_level

GoalUpdated
    - learner_id, goal_id, changes

GoalAchieved
    - learner_id, goal_id

CareerSelected
    - learner_id, career_id, target_seniority_level

SYSTEM EVENTS (published by engines)
────────────────────────────────────
StateTransitioned
    - learner_id, node_id, from_state, to_state, trigger, confidence_after

ConfidenceUpdated
    - learner_id, node_id, new_confidence, reason

PlanCompleted
    - learner_id, plan_id, plan_type (daily|weekly|semester)

PlanDeviation
    - learner_id, plan_id, deviation_type (missed|extra|abandoned)

ReviewDue
    - learner_id, node_id, scheduled_date

HealthScoreComputed
    - score, breakdown, graph_version_id
```

---

## Part V: Knowledge State Model

### 10. Complete State Machine

```
10 States. 15 Allowed transitions (out of 90 possible).

States:
    U = UNKNOWN          I = INTRODUCED       L = LEARNING
    P = PRACTICING       A = APPLIED          M = MASTERED
    T = TEACHING         F = FORGOTTEN        R = NEEDS_REVISION
    D = DEPRECATED

Transitions:
    U ──encounter──→ I
    I ──study──→ L
    L ──practice──→ P
    P ──apply──→ A
    A ──master──→ M
    M ──teach──→ T
    M ──decay──→ F
    A ──decay──→ F
    F ──review_pass──→ Learning  (not Applied — needs rebuilding)
    F ──assessment_fail──→ R
    R ──review_pass──→ A
    R ──review_fail──→ L
    L ──assessment_fail──→ R
    A ──assessment_fail──→ R
    any ──deprecate──→ D

Transitions NOT allowed (with rationale):
    U → M: Cannot master what you haven't encountered
    U → A: Cannot apply what you don't know
    M → U: Mastery is never revoked by time alone (decay goes to Forgotten)
    L → M: Must practice and apply before mastery
    T → F: Teaching is active use; decay is paused
    D → any: Deprecated is terminal. Future knowledge replaces it via a new node.
```

### 11. Transition Costs

Each transition has a cost representing the estimated effort to move from one state to the next:

| Transition | Cost Factor | Rationale                                               |
| ---------- | ----------- | ------------------------------------------------------- |
| U → I      | 0.1         | Single encounter (view a page)                          |
| I → L      | 0.3         | Read/watch/study session                                |
| L → P      | 0.5         | Complete exercises or simulator                         |
| P → A      | 0.7         | Real-world application or project                       |
| A → M      | 0.9         | Demonstrate expertise (teach, pass advanced assessment) |
| M → T      | 0.2         | Teach (low effort if already mastered)                  |
| M → F      | 0.0         | Automatic (time decay, no effort)                       |
| F → L      | 0.4         | Re-study (partial retention reduces cost)               |
| F → R      | 0.0         | Automatic (assessment failure)                          |
| R → A      | 0.3         | Review and re-apply (cheaper than full re-study)        |
| R → L      | 0.5         | Re-learn from scratch                                   |
| L → R      | 0.0         | Automatic (assessment failure)                          |
| any → D    | 0.0         | Automatic (deprecation)                                 |

**Application in Recommendation Engine**: The Recommendation Engine uses transition costs to prioritize: all else equal, prefer the CHEAPEST transition. Moving R → A (cost 0.3) is preferred over I → L (cost 0.3) because R → A also unlocks dependent nodes faster.

### 12. Confidence Evolution

Confidence is a float [0.0, 1.0] that evolves independently of state:

```
Initial confidence on INTRODUCED: 0.05
On each correct study session:   confidence += (1.0 - confidence) * 0.15
On each passed assessment:        confidence += (1.0 - confidence) * 0.30
On each failed assessment:        confidence *= 0.5
On each day without review:       confidence *= 0.995  (daily decay)

Mastery threshold:               confidence >= 0.85 AND passed assessment
```

### 13. Knowledge Decay

Decay simulates the forgetting curve. Parameters:

```
For MASTERED nodes:
    - Review after 30 days: if skipped, confidence *= 0.9 per day
    - After 7 days of skipped reviews: MASTERED → FORGOTTEN

For APPLIED nodes:
    - Review after 14 days: if skipped, confidence *= 0.85 per day
    - After 14 days of skipped reviews: APPLIED → FORGOTTEN

For all other states:
    - Confidence decays at 0.5% per day
    - State transitions are only triggered by explicitly recorded events
```

---

## Part VI: Graph Query Language

### 13. GQL Specification

The Graph Query Language (GQL) is a domain-specific query language for expressing graph operations. It is implemented in stages:

- **v1**: No parser. Each query type has a dedicated RPC endpoint. (POST /graph/query with type="find_path" param)
- **v2**: Full parser, AST, optimizer, executor. Composition, projection, filtering.
- **v3**: Persistent query caches, named queries, query libraries.

#### Grammar (v2)

```
query       = command "(" args ")" [ "RETURN" projection ] [ "WHERE" filter ] [ "LIMIT" n ] [ "OFFSET" n ] [ "ORDER BY" ordering ]
command     = "FIND" | "COMPARE" | "ANALYZE" | "EXPLAIN"
args        = arg ( "," arg )*
arg         = identifier "=" value
value       = string | number | boolean | list | subquery
subquery    = command "(" args ")"
projection  = identifier ( "," identifier )*
filter      = condition ( "AND" condition )*
condition   = identifier operator value
operator    = "=" | "!=" | "<" | ">" | "IN" | "NOT IN" | "CONTAINS"
ordering    = identifier ( "ASC" | "DESC" )
list        = "[" value ( "," value )* "]"
```

#### Commands

```
FIND path(source, target [, max_depth=10, via=EDGE_TYPE])
    → ordered list of NodeIDs

FIND prereq_chain(node_id [, max_depth=10])
    → list of NodeIDs in topological order (prerequisites first)

FIND unlock_chain(node_id [, max_depth=10])
    → list of NodeIDs (derived from prerequisites)

FIND related(node_id [, depth=1, type=EDGE_TYPE])
    → list of {node_id, relationship_type}

FIND reachable(starts=[ids], max_depth=10, via=EDGE_TYPE)
    → list of NodeIDs

FIND careers(node_id)
    → list of CareerIDs

FIND projects(node_id)
    → list of ProjectIDs

FIND simulators(node_id)
    → list of SimulatorIDs

FIND hidden(node_id [, type=RELATIONSHIP_TYPE])
    → list of {from_node, to_node, type, note}

FIND common(set_a, set_b)
    → list of NodeIDs (intersection of two sets)

FIND unique(set_a, set_b)
    → {a_only: [NodeIDs], b_only: [NodeIDs]}

FIND bottlenecks([category, limit=20])
    → list of {node_id, dependent_count}

FIND decomposition(node_id, [level=DECOMPOSITION_LEVEL])
    → tree of DecompositionNodes

FIND shortest_path(source, target [, via=EDGE_TYPE, max_depth=10])
    → ordered list of NodeIDs

FIND gaps(career_id, learner_id)
    → list of missing NodeIDs

FIND similar(node_id [, metric=METRIC, limit=10])
    → list of {node_id, similarity_score}

COMPARE careers(a, b)
    → {common: [NodeIDs], a_only: [NodeIDs], b_only: [NodeIDs]}

COMPARE versions(a, b)
    → {added: [NodeIDs], removed: [NodeIDs], modified: [NodeIDs]}

ANALYZE density()
    → {total_nodes, total_edges, density, max_possible_edges}

ANALYZE depth_distribution()
    → {min, max, avg, distribution: {depth: count}}

ANALYZE health()
    → {score, structural, coverage, connectivity, career}

EXPLAIN recommendation(learner_id)
    → [{rule, candidate, confidence, reason}]

EXPLAIN path(path_id)
    → {nodes, total_time, strategy, alternatives}
```

#### Example Queries

```gql
-- What do I need to study before Virtual Memory?
FIND prereq_chain("OS-005", max_depth=5)
    RETURN id, name, difficulty
    ORDER BY difficulty ASC

-- Common and unique nodes between two careers
COMPARE careers("CAR-AI-ENGINEER", "CAR-BACKEND")
    RETURN common, a_only, b_only

-- What gaps do I have for Backend Engineer?
FIND gaps("CAR-BACKEND", current_learner)
    RETURN id, name, difficulty, estimated_hours
    ORDER BY difficulty ASC
    LIMIT 20

-- What nodes unlock the most other nodes?
FIND bottlenecks("All", limit=10)
    RETURN id, name, dependent_count
    ORDER BY dependent_count DESC

-- Hidden relationships of Virtual Memory
FIND hidden("OS-005")
    RETURN from_node.name, to_node.name, type, note
    WHERE type IN ("structural_analogy", "shared_theory")

-- How healthy is the graph?
ANALYZE health()
```

#### Execution Pipeline (v2+)

```
Query String
    │
    ▼
Parser (PEG-based, hand-written)
    │  Produces AST
    ▼
Validator (type-check args, validate identifiers)
    │
    ▼
Optimizer (reorder filters, push down projections, cache common subqueries)
    │
    ▼
Executor (compose engine capabilities)
    │  E.g., FIND prereq_chain("OS-005") calls DependencyEngine.get_prerequisites("OS-005")
    │
    ▼
Result formatter (apply projection, sorting, pagination)
    │
    ▼
Response
```

---

## Part VII: Storage Architecture

### 14. Storage Tiers

SV-OS uses four storage tiers:

| Tier             | Technology               | What                                                                                            | Why                                                                                    |
| ---------------- | ------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Graph Cache**  | In-memory (Python dicts) | All nodes, all edges, topological order index                                                   | Sub-millisecond graph queries. 30MB for 10K nodes, 300MB for 100K nodes.               |
| **Primary**      | PostgreSQL               | All persisted data — nodes, edges, content, careers, states, events, users                      | Reliable, ACID, known operational model, full-text search, JSONB for flexible schemas. |
| **Cache**        | Redis                    | Learner states (24h TTL), query results (5min TTL), validation results (5min TTL), session data | Sub-millisecond key-value lookups. Reduces PostgreSQL load for hot data.               |
| **Object Store** | S3-compatible (MinIO/S3) | Archived data, graph version snapshots, static content exports                                  | Cost-effective cold storage for data that is accessed rarely.                          |

### 15. Data Flow Between Tiers

```
                 WRITE PATH
                 ═══════════
    API/Frontend
         │
         ▼
    EventEngine ──→ PostgreSQL (event_store, append-only)
         │
         ▼
    Engines (consumers)
         │
         ├──→ PostgreSQL (their tables)
         ├──→ Redis (invalidate caches)
         └──→ In-memory (update graph cache)


                 READ PATH
                 ═════════
    API/Frontend
         │
         ▼
    Engine
         │
         ├──→ In-memory (graph queries — fastest)
         ├──→ Redis (learner states, cached results)
         └──→ PostgreSQL (everything else)


                 CACHE INVALIDATION
                 ══════════════════
    On Event: NodeUpdated
        → In-memory: update node in graph cache
        → Redis: invalidate queries involving this node
        → No action: PostgreSQL is always current

    On Event: StateTransitioned
        → Redis: invalidate learner state cache
        → In-memory: no change (learner state is not in graph cache)

    On Event: GraphImported
        → In-memory: reload graph cache
        → Redis: flush all query caches
        → PostgreSQL: no action (data is already committed)
```

### 16. Synchronization Strategy

| Scenario                    | Strategy                                                                     |
| --------------------------- | ---------------------------------------------------------------------------- |
| Graph write → graph cache   | Write-through: after PostgreSQL commit, update in-memory cache synchronously |
| Learner state write → Redis | Write-through: after PostgreSQL commit, update Redis synchronously           |
| Cache miss → PostgreSQL     | Read-through: on cache miss, load from PostgreSQL, populate cache, return    |
| Full graph reload           | Event-driven: on GraphImported, all engine instances reload in-memory graph  |
| Graph version rollback      | Rollback: restore PostgreSQL snapshot, reload graph cache, flush Redis       |

---

## Part VIII: Scalability Strategy

### 17. Scaling Targets

| Dimension               | Target        | Current |
| ----------------------- | ------------- | ------- |
| Knowledge nodes         | 100,000       | 204     |
| Relationships (edges)   | 50,000,000    | ~5,000  |
| Content blocks          | 5,000,000     | 0       |
| Categories              | 500           | 39      |
| Careers                 | 50            | 12      |
| Learners                | 10,000,000    | 0       |
| Learner-node states     | 1,000,000,000 | 0       |
| Monthly active learners | 1,000,000     | 0       |

### 18. Partitioning Strategy

| Table                    | Partition Key   | Partitions            | Rationale                           |
| ------------------------ | --------------- | --------------------- | ----------------------------------- |
| learner_knowledge_states | learner_id % 16 | 16                    | Even distribution, no hot spots     |
| event_store              | event_month     | Monthly by created_at | Time-range queries, easy archival   |
| content_blocks           | node_id % 32    | 32                    | Even distribution                   |
| assessment_records       | learner_id % 16 | 16                    | Per-learner queries are most common |

### 19. Hot/Cold Storage

| Data                       | Hot (in-memory/Redis) | Warm (PostgreSQL)     | Cold (S3)            |
| -------------------------- | --------------------- | --------------------- | -------------------- |
| Graph nodes                | ✅ All (30-300MB)     | ✅ Primary            | ✅ Archived versions |
| Graph edges                | ✅ All (20-200MB)     | ✅ Primary            | ✅ Archived versions |
| Active learner states      | ✅ 24h TTL            | ✅ Primary            | ❌                   |
| Deprecated/archived states | ❌                    | ✅ Retention: 90 days | ✅ After 90 days     |
| Events (last 30 days)      | ❌                    | ✅ Partitioned        | ✅ After 30 days     |
| Graph versions             | ✅ Latest             | ✅ All                | ✅ After 1 year      |

### 20. Graph Loading Strategy

1. **Startup**: Load all nodes (SELECT * FROM knowledge_nodes WHERE is_deleted=false). Load all edges (SELECT * FROM knowledge_edges WHERE is_deleted=false). Build in-memory adjacency lists. Compute topological order index.
2. **Scale to 100K nodes**: Same strategy. Estimated memory: 300MB for nodes, 200MB for edges, 50MB for indices = 550MB. Acceptable for a single server.
3. **Scale to 1M nodes**: Move to Neo4j or Memgraph. The engine interface abstracts backend; no consumer changes needed.
4. **Lazy loading**: Node content (ContentBlocks) is NOT loaded into memory on startup. It's lazy-loaded on demand and cached in an LRU with 10,000 entries.

---

## Part IX: Consistency Model

### 21. Eventual Consistency with Sagas

SV-OS uses an **event-driven saga pattern** for all cross-engine operations:

```
Example: "Complete Assessment" operation

1. Frontend submits assessment result → POST /assessments/submit
2. API layer publishes AssessmentSubmitted event
3. EventEngine delivers to subscribers:
   a. AssessmentEngine: records result, computes mastery verdict
   b. StateEngine: transitions state (APPLIED→MASTERED or →NEEDS_REVISION)
   c. RevisionEngine: adjusts review schedule
   d. AnalyticsEngine: updates metrics
   e. SchedulingEngine: adjusts daily plan

   Each subscriber processes INDEPENDENTLY.
   If (c) fails, (a), (b), (d), (e) are NOT rolled back.
   Failed events go to dead letter queue with retry.
```

**Transaction boundaries**:

- Each event handler is a single database transaction
- No distributed transactions across handlers
- Event publication is atomic with the initial write (outbox pattern)

**Why not two-phase commit?** Two-phase commit (2PC) locks resources, has poor failure modes, and doesn't scale. Eventual consistency with sagas gives better availability and simpler failure recovery.

### 22. Outbox Pattern

To ensure atomicity of "write to database + publish event":

```python
# Transaction 1: Write to database and insert into event_outbox
async with transaction:
    assessment_record = await assessment_repo.create(...)
    event_outbox.add(AssessmentSubmitted(learner_id, node_id, ...))

# Background: Publish from outbox
async def publish_from_outbox():
    events = await event_outbox.get_pending()
    for event in events:
        await event_engine.publish(event)
        await event_outbox.mark_published(event.event_id)
```

This ensures no event is lost even if the publisher crashes after the database write.

### 23. Idempotency

Every event has a `event_id` (UUID v4). Every handler stores processed event_ids:

```python
async def handle_state_transition(event: AssessmentSubmitted):
    if await event_id_already_processed(event.event_id):
        return  # Idempotent — skip duplicate
    # Process event
    await state_engine.transition(...)
    await mark_event_processed(event.event_id)
```

### 24. Dead Letter Queue

Events that fail after 3 retries go to the dead letter queue. Dead letters are:

1. Visible in the admin dashboard
2. Can be manually retried
3. Automatically retried after engine deployment (if the error was transient)
4. Archived after 30 days if never resolved

---

## Part X: API Capability Model

### 25. Capability Catalog

The API exposes capabilities, not CRUD operations. Each capability is a single, meaningful operation.

```
LEARNER CAPABILITIES
═════════════════════
    plan_daily                 → DailyPlan
    plan_weekly                → WeeklyPlan
    plan_semester              → SemesterPlan
    get_next_concept           → Recommendation
    get_next_n_concepts        → list[Recommendation]
    get_review_plan            → RevisionPlan
    get_career_recommendation  → list[CareerRecommendation]
    get_career_gap             → SkillGap
    get_career_path            → LearningPath
    generate_path_to_goal      → LearningPath
    get_learner_stats          → LearnerStats
    get_forecast               → CompletionForecast
    compare_careers            → CareerComparison
    get_explanation            → Explanation
    get_assessment             → Assessment
    submit_assessment          → AssessmentOutcome
    find_shortest_path         → PathResult
    find_prerequisite_chain    → list[NodeID]
    find_hidden_relationships  → list[Relationship]
    search_nodes               → SearchResult
    explore_graph              → Subgraph
    get_learner_state          → LearnerState
    set_goal                   → Goal
    update_state               → StateTransition
    recommend_project          → ProjectRecommendation
    recommend_simulator        → SimulatorRecommendation
    get_decomposition          → DecompositionTree

ADMIN CAPABILITIES
══════════════════
    import_graph              → ImportResult
    validate_import           → ValidationReport
    validate_graph            → ValidationReport
    get_graph_health          → GraphHealthScore
    get_graph_versions        → list[GraphVersion]
    rollback_graph            → GraphVersion
    diff_graph_versions       → GraphDiff
    get_validation_cache      → dict
    get_dead_letters          → list[FailedEvent]
    retry_dead_letter         → bool
```

---

## Part XI: Folder Architecture

### 26. Backend Folder Structure

```
apps/api/
├── app/
│   ├── engines/                      # 22 engines
│   │   ├── __init__.py
│   │   ├── contract.py               # EngineInterface, Capability, HealthStatus
│   │   ├── event/                    # EventEngine (starts first)
│   │   ├── graph/                    # GraphEngine
│   │   ├── knowledge/                # KnowledgeEngine
│   │   ├── traversal/                # TraversalEngine
│   │   ├── validation/               # ValidationEngine
│   │   ├── state/                    # StateEngine
│   │   ├── dependency/               # DependencyEngine
│   │   ├── search/                   # SearchEngine
│   │   ├── skill/                    # SkillEngine
│   │   ├── career/                   # CareerEngine
│   │   ├── learning_path/            # LearningPathEngine
│   │   ├── prerequisite_solver/      # PrerequisiteSolver
│   │   ├── recommendation/           # RecommendationEngine
│   │   ├── scheduling/              # SchedulingEngine
│   │   ├── revision/                 # RevisionEngine
│   │   ├── assessment/               # AssessmentEngine
│   │   ├── project/                  # ProjectEngine
│   │   ├── simulator/                # SimulatorEngine
│   │   ├── analytics/                # AnalyticsEngine
│   │   ├── versioning/               # VersioningEngine
│   │   ├── import_export/           # ImportEngine + ExportEngine
│   │   └── cache/                    # CacheManager (NOT an engine — infrastructure)
│   │
│   ├── services/                     # Thin orchestration
│   │   ├── __init__.py
│   │   ├── capability_service.py     # Routes capabilities to engines
│   │   └── admin_service.py          # Admin orchestration
│   │
│   ├── api/                          # API layer
│   │   ├── deps.py                   # DI
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── capabilities.py   # All /capabilities/* endpoints
│   │           ├── learner.py        # Learner state endpoints
│   │           ├── admin.py          # Admin endpoints
│   │           ├── graph.py          # Graph exploration
│   │           ├── search.py         # Search
│   │           └── ...
│   │
│   ├── data/                         # Domain models
│   │   └── models.py                 # All domain objects (dataclasses)
│   │
│   ├── stores/                       # Persistence — repositories
│   │   ├── base.py
│   │   ├── unit_of_work.py
│   │   └── repositories/
│   │       ├── graph_repo.py
│   │       ├── state_repo.py
│   │       └── ...
│   │
│   ├── models/                       # SQLAlchemy models (keep existing)
│   ├── schemas/                      # Pydantic schemas (keep existing)
│   ├── core/                         # Config, logging, database (keep existing)
│   ├── middleware/                   # Keep existing
│   └── utils/                        # Keep existing
│
├── alembic/                          # Keep existing
├── tests/
│   ├── engines/                      # Pure unit tests per engine
│   ├── api/                          # API integration tests
│   └── stores/                       # Repository tests
└── ...
```

---

## Part XII: Risks and Tradeoffs

### 27. Risks

| Risk                                                                            | Likelihood            | Impact | Mitigation                                                                                                                       |
| ------------------------------------------------------------------------------- | --------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Graph in-memory > available RAM at 100K+ nodes                                  | Low (300MB estimated) | Medium | Monitor memory; switch to Neo4j backend if >2GB. Interface abstraction makes this safe.                                          |
| Event Engine becomes SPOF                                                       | Medium                | High   | Event Engine is in-process for v1. Future: Kafka adapter. No data loss (event outbox).                                           |
| State machine complexity overwhelms new contributors                            | Medium                | Medium | State machine is documented as a table. All transitions are explicit. Confidence evolution is the only complex part.             |
| 10M learners × 100 states = 1B rows in learner_knowledge_states                 | Low (years away)      | High   | Partitioning by learner_id. Hot/cold storage. Archival of deprecated states.                                                     |
| Recommendation Engine rules produce suboptimal results                          | Medium                | Medium | Rules are parameterized per learner. A/B testing framework enables data-driven rule selection. Explainability enables debugging. |
| Engines with >5 dependencies (Recommendation, Scheduling) become hard to modify | Medium                | Medium | Dependency injection. Each dependency is an interface, not a concrete implementation.                                            |

### 28. Tradeoffs

| Decision                                   | Tradeoff                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 22 engines (vs. fewer, larger engines)     | Clearer responsibilities → more files, more interfaces to maintain                            |
| Decision rules (vs. weighted scoring)      | Harder to implement → easier to explain, debug, and extend                                    |
| In-memory graph (vs. always-database)      | Faster queries → memory cost. Acceptable up to 100K nodes.                                    |
| Event-driven consistency (vs. synchronous) | Simpler failure recovery → eventual consistency window                                        |
| GQL (vs. REST-only)                        | More expressive → more implementation work. Staged: v1=RPC, v2=GQL.                           |
| PostgreSQL (vs. Neo4j)                     | Simpler operations, existing infra → slower graph queries at scale. Acceptable to 100K nodes. |
| 10-state model (vs. 4-state)               | Richer learner insight → more complex state machine                                           |

---

## Part XIII: Implementation Roadmap

### 29. Milestones

Each milestone produces a WORKING, RELEASABLE system. No milestone depends on a future milestone.

```
MILESTONE 0: Foundation (Weeks 1-4)
    Risk: HIGHEST — everything depends on this
    Deliverables:
        - EventEngine + event store tables
        - GraphEngine (in-memory) + graph tables
        - KnowledgeEngine + content_blocks tables
        - TraversalEngine (BFS, DFS, shortest path)
        - ValidationEngine (incremental cycle detection only)
        - Graph loading from persistence on startup
    Dependencies: None
    Test signal: Start server, load 204-node JSON, query any node, traverse any path

MILESTONE 1: Learner State (Weeks 5-7)
    Risk: HIGH — state machine is complex
    Deliverables:
        - StateEngine + learner_knowledge_states table (partitioned)
        - 10-state machine with all transitions
        - Confidence evolution
        - State persistence and cache (Redis)
    Depends on: Milestone 0
    Test signal: Create learner, transition through all states, verify persistence

MILESTONE 2: Domain Models (Weeks 7-9)
    Risk: LOW — straightforward CRUD over well-defined schemas
    Deliverables:
        - CareerEngine + career tables
        - SkillEngine + skill tables
        - ProjectEngine + project tables
        - SimulatorEngine + simulator tables
        - SearchEngine (tsvector full-text)
    Depends on: Milestone 0
    Test signal: Import careers, skills, projects; search across all content

MILESTONE 3: Learning Path (Weeks 9-11)
    Risk: MEDIUM — path generation must handle complex dependency graphs
    Deliverables:
        - DependencyEngine
        - PrerequisiteSolver
        - LearningPathEngine (basic path generation)
        - CareerEngine gap analysis
    Depends on: Milestones 0, 1, 2
    Test signal: Generate learning path from learner state to career goal

MILESTONE 4: Recommendations (Weeks 11-13)
    Risk: MEDIUM — decision rules must be tuned
    Deliverables:
        - RecommendationEngine (8 decision rules)
        - RevisionEngine (forgetting curve)
        - SchedulingEngine (daily/weekly planning)
        - AssessmentEngine (submissions, mastery verification)
    Depends on: Milestones 1, 3
    Test signal: Create learner with partial progress, get next concept recommendation

MILESTONE 5: Import & Versioning (Weeks 13-15)
    Risk: MEDIUM — import must validate at scale
    Deliverables:
        - ValidationEngine (full + background validation)
        - ImportEngine (JSON import with validation pipeline)
        - VersioningEngine (snapshots, diff)
        - ExportEngine
    Depends on: Milestones 0, 2
    Test signal: Import 204-node JSON, validate, create version, export

MILESTONE 6: Analytics & Visualization (Weeks 15-17)
    Risk: LOW — analytics reads state; visualization reads graph
    Deliverables:
        - AnalyticsEngine
        - VisualizationEngine (layout computation)
        - Full API capability surface
        - Background validation jobs
    Depends on: Milestones 1, 4

MILESTONE 7: GQL & Advanced (Weeks 17-20)
    Risk: LOW — additive; everything works without GQL
    Deliverables:
        - GQL parser, AST, executor (v2)
        - RelationshipDiscoveryEngine
        - Performance optimization at 10K+ nodes
    Depends on: Milestones 0-6

MILESTONE 8: Scale (Weeks 20-24)
    Risk: MEDIUM — may reveal architecture issues
    Deliverables:
        - Neo4j backend adapter for GraphEngine
        - Read replicas for PostgreSQL
        - Partitioning validation at 100K nodes
        - Load testing
    Depends on: Milestones 0-7
```

---

## Part XIV: Architecture Decision Records

### ADR-001: Event Engine as Communication Backbone

**Context**: Multiple engines need to react to the same events (e.g., assessment submission triggers state change, revision reschedule, analytics update, plan adjustment). Direct engine-to-engine calls create circular dependencies and make testing impossible.

**Decision**: All cross-engine communication for state-changing operations goes through the Event Engine. Read-only queries are exempt.

**Consequences**: +testability, +decoupling, -latency (events are async). The event outbox pattern ensures no data loss.

### ADR-002: Decision Rules Over Weighted Scoring

**Context**: The previous architecture used linear weighted scoring (0.30 * prereq_score + 0.25 * distance_score + ...). Weights were arbitrary, difficult to tune, and produced unexplainable results.

**Decision**: Recommendation uses deterministic decision rules evaluated in priority order. Each rule returns a candidate or None. The first rule that matches wins.

**Consequences**: +explainability, +maintainability, +testability. -potential for "brittle" rules if ordering is wrong. Mitigated by per-learner rule ordering and A/B testing.

### ADR-003: In-Memory Graph Cache

**Context**: Every engine query needs graph data. Database queries for every traversal would be too slow at 100K nodes.

**Decision**: Load all nodes and edges into memory on startup. Use PostgreSQL as the write-back store. At 1M+ nodes, migrate to Neo4j with the same engine interface.

**Consequences**: +1000x query speed, -memory cost (300MB at 100K nodes). Acceptable.

### ADR-004: 10-State Model

**Context**: The existing 4-state model (not_started, learning, completed, mastered) cannot express forgetting, revision needs, or teaching. It makes spaced repetition and intelligent recommendations impossible.

**Decision**: 10 states with explicit transitions, costs, and triggers.

**Consequences**: +richer learner insight, +better recommendations. -complexity. Mitigated by automated transitions (most state changes are event-driven, not manual).

### ADR-005: Capability-Based API

**Context**: REST CRUD endpoints encourage frontend to think in terms of database operations. The system should be used through its capabilities, not its data model.

**Decision**: APIs are named after capabilities (plan_daily, get_next_concept, compare_careers). The internal data model is never directly exposed.

**Consequences**: +intuitive API, +decoupled frontend from backend data model. -extra mapping layer between capabilities and internal operations.

---

## Part XV: Final Recommendations

### 30. For Implementation Teams

1. **Build Milestone 0 first and make it rock-solid**. Every other engine depends on the Event Engine, Graph Engine, and Traversal Engine. These must have 100% test coverage and documented performance characteristics before anything else is built.

2. **Don't optimize prematurely**. The stated scaling targets (100K nodes, 50M relationships, 10M users) are YEARS away. Build for correctness first, then profile, then optimize. The architecture is designed to handle scale without changing the engine interfaces.

3. **Every engine must have a test that proves it works independently**. Mock the Event Engine and Graph Engine. Test each engine's capabilities in isolation. This is non-negotiable.

4. **The first import of the 204-node JSON file is the integration test**. If Milestone 0 can import all 204 nodes, validate all edges, and answer graph queries, the foundation is solid.

5. **Document every decision rule with a rationale**. The Recommendation Engine's rules will be questioned by product, by engineering, and by learners. Each rule must have a written justification.

### 31. For Future Architects

1. **The architecture is designed for evolution, not perfection**. No architecture survives contact with real users unchanged. The engine interfaces, event model, and storage abstractions are designed to absorb change without requiring rewrites.

2. **When the in-memory graph becomes too large (1M+ nodes), switch to Neo4j**. The Graph Engine interface is designed for this. No other engine needs to change.

3. **When the Event Engine becomes a throughput bottleneck, switch to Kafka**. The Event Engine interface is designed for this. No other engine needs to change.

4. **When the Recommendation Engine needs ML, add a ScoringRule that calls an ML model**. The rule-based architecture makes ML additive, not foundational. A `MachineLearningRule` can be inserted at any priority position.

5. **When the 10-state model proves insufficient, add more states**. New states and transitions are additive. Existing transitions are unaffected.

---

This is the definitive SV-OS Architecture Specification. It supersedes all previous architecture documents. All implementation work must conform to this specification.

**End of Document**
