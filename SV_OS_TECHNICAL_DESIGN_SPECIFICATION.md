# SV-OS Technical Design Specification (TDS)

## Document Status

- Version: 1.0
- Status: Master specification for implementation
- Scope: Consolidation of all approved architecture documents into one implementation contract
- Constraint: No architectural redesign. No removal of approved systems. No simplification of existing decisions.

---

# Part 1 — Executive Summary

## 1.1 Vision

SV-OS is a Knowledge Operating System for computer science learning. It provides a structured, queryable, versioned knowledge graph that powers discovery, planning, assessment, recommendation, visualization, and simulation for learners and educators.

## 1.2 Mission

SV-OS exists to make all relevant computer science knowledge navigable, learnable, and measurable through a graph-driven platform that supports personalized learning journeys and explainable progression.

## 1.3 Core Philosophy

The knowledge graph is the foundation of the product. Every experience, capability, and workflow is derived from graph operations and learner state. The architecture is built around engines, capabilities, explicit events, and durable persistence.

## 1.4 Architectural Principles

1. The knowledge graph is the source of truth.
2. Engines own logic; services orchestrate.
3. State is explicit and modeled as first-class domain state.
4. Validation occurs before mutation.
5. Deterministic behavior is preferred by default.
6. Events are the backbone of cross-engine coordination.
7. APIs expose capabilities, not CRUD operations.
8. The system is designed to scale without changing the core architecture.

## 1.5 Non-Goals

- SV-OS is not a CMS.
- SV-OS is not a general LMS.
- SV-OS is not a CRUD application with AI bolted on.
- SV-OS is not a generic social network or content marketplace.

## 1.6 Design Constraints

- The architecture must remain engine-centric.
- The graph must remain the primary abstraction.
- All meaningful state changes must pass through validation and event flow.
- Persistence must remain PostgreSQL-backed with graph-based semantics expressed through relational structures and versioning.
- Frontend and backend must stay aligned around the same capability contracts.

---

# Part 2 — System Overview

## 2.1 High-Level Architecture

```text
Frontend
  └── Capability APIs
        └── Capability Layer
              └── Engine Layer
                    ├── Graph Engine
                    ├── Knowledge Engine
                    ├── Traversal Engine
                    ├── State Engine
                    ├── Dependency Engine
                    ├── Validation Engine
                    ├── Search Engine
                    ├── Recommendation Engine
                    ├── Learning Path Engine
                    ├── Career Engine
                    ├── Project Engine
                    ├── Assessment Engine
                    ├── Simulator Engine
                    ├── Import Engine
                    ├── Event Engine
                    └── Analytics / Export / Roadmap / Knowledge Health Engines

Infrastructure
  ├── Authentication
  ├── Telemetry
  ├── Logging
  ├── Background Jobs
  └── Caching

Persistence
  ├── PostgreSQL
  ├── Redis
  └── Event Store / Import Job State
```

## 2.2 Knowledge Graph

The knowledge graph is the central abstraction of the platform. It stores concepts, dependencies, career objectives, assessments, projects, skills, resources, and simulator relationships. The graph is the root source for traversal, recommendation, roadmap generation, validation, search, visualization, and dependency explanation.

## 2.3 Knowledge Engine

The knowledge engine manages the complete content model for graph nodes. It stores the enriched content associated with concepts and map objects, including resources, assessments, tags, blocks, and metadata.

## 2.4 Capability Layer

Capabilities are the product-facing workflows that orchestrate one or more engines and produce user-visible outcomes. Examples include roadmap generation, next-concept recommendation, career comparison, and dependency explanation.

## 2.5 Engine Layer

The engine layer contains the business logic for graph operations, learning progression, recommendation ranking, validation, and workflow orchestration. Engines are deterministic, testable, and replaceable from an interface perspective.

## 2.6 Infrastructure

Infrastructure provides support for authentication, event transport, metrics, tracing, background processing, and cross-cutting services. It enables the engine layer to remain focused on domain behavior.

## 2.7 Persistence

PostgreSQL is the primary persistence system. It stores graph data, learner state, content, assessments, import jobs, and event history. Redis supports hot caches for learner state and frequently accessed graph results.

## 2.8 Frontend

The frontend offers interactive surfaces for exploration, recommendation, roadmap planning, assessment, simulation, search, and visualization. It consumes capability APIs and presents graph-backed experiences with a modern, performant interface.

---

# Part 3 — Complete Engine Catalog

## 3.1 Graph Engine

Purpose: Maintain the authoritative structural representation of the knowledge graph.

Responsibilities:

- Store nodes and edges
- Provide subgraph and adjacency access
- Maintain graph metadata
- Support node and edge existence checks

Public Interface:

- get_node
- get_nodes
- get_edge
- get_neighbors
- get_subgraph
- node_exists
- edge_exists
- count
- refresh

Inputs:

- node_id, edge identifiers, filters, subgraph depth

Outputs:

- node records, edge records, subgraph snapshots, counts

Dependencies:

- Persistence adapter
- Validation engine for mutation integrity

Published Events:

- NodeCreated
- NodeUpdated
- NodeDeleted
- EdgeCreated
- EdgeDeleted
- GraphReloaded

Subscribed Events:

- GraphImported
- ImportCommitted

Failure Modes:

- Missing node references
- Invalid edge operations
- Cache desynchronization

Performance Targets:

- Node lookup: sub-millisecond local
- Neighbor lookup: bounded by degree
- Full graph reload: acceptable only during import or startup

Future Extensions:

- Graph database backend swap
- Distributed adjacency indexing

## 3.2 Knowledge Engine

Purpose: Own the enriched content attached to graph nodes.

Responsibilities:

- Manage node content blocks
- Maintain resources, tags, skills, assessments, and metadata
- Expose content retrieval by node and type

Public Interface:

- get_content
- get_content_blocks
- get_categories
- get_nodes_by_category
- get_tags
- get_resources
- get_skills_for_node
- get_assessments_for_node

Inputs:

- node_id, block_type, category, tag

Outputs:

- node content payloads, categories, tags, resources, assessments

Dependencies:

- Graph engine
- Persistence layer

Published Events:

- NodeContentUpdated
- ContentBlockAdded
- ContentBlockRemoved

Subscribed Events:

- NodeCreated
- NodeUpdated

Failure Modes:

- Missing content blocks
- Invalid metadata schemas
- Stale content cache

Performance Targets:

- Content fetch for a single node: under 200ms p95

Future Extensions:

- Rich content model variants
- Custom block types

## 3.3 Traversal Engine

Purpose: Provide graph traversal and algorithmic operations.

Responsibilities:

- BFS and DFS traversal
- Shortest path computation
- Reachability and connected-component analysis
- Cycle detection
- Topological ordering

Public Interface:

- bfs
- dfs
- shortest_path
- multi_source_bfs
- reachable_nodes
- detect_cycles
- find_connected_components

Inputs:

- start node, target node, depth, edge types, filter sets

Outputs:

- traversal results, path results, connectivity results

Dependencies:

- Graph engine

Published Events:

- None

Subscribed Events:

- None

Failure Modes:

- Path not found
- Cycle-induced ambiguity
- Depth limit breach

Performance Targets:

- BFS/DFS: $O(V + E)$
- Shortest path: $O(V + E)$ on unweighted graphs

Future Extensions:

- Weighted traversal strategies
- Community detection

## 3.4 Event Engine

Purpose: Manage event publication, delivery, replay, retries, and dead-letter handling.

Responsibilities:

- Publish immutable domain events
- Deliver to subscribers
- Track history and replay
- Support idempotency and failure handling

Public Interface:

- publish
- subscribe
- unsubscribe
- replay
- get_history
- get_dead_letters
- retry_dead_letter

Inputs:

- event payloads, subscription metadata, replay windows

Outputs:

- delivery acknowledgements, history windows, dead-letter reports

Dependencies:

- Persistence layer
- Infrastructure transport adapters

Published Events:

- EventPublished
- EventDelivered
- EventFailed

Subscribed Events:

- None

Failure Modes:

- Duplicate delivery
- Retry exhaustion
- Consumer crash

Performance Targets:

- Event publish path: under 100ms p95

Future Extensions:

- Broker-backed transport
- Partition-based distributed delivery

## 3.5 State Engine

Purpose: Manage learner knowledge state across concepts and learning journeys.

Responsibilities:

- Track node-level learner state
- Manage transition rules between states
- Update confidence and progression metadata
- Support streak and velocity calculations

Public Interface:

- get_learner_state
- get_node_state
- get_batch_states
- transition
- set_confidence
- get_completed_ids
- get_terminal_ids
- get_velocity
- get_streak

Inputs:

- learner_id, node_id, transition trigger, confidence values

Outputs:

- learner state snapshots, transition results, streaks, velocity metrics

Dependencies:

- Graph engine
- Event engine

Published Events:

- StateTransitioned
- ConfidenceUpdated
- LearningMilestoneReached

Subscribed Events:

- AssessmentSubmitted
- SimulatorCompleted
- PathGenerated
- NodeContentUpdated

Failure Modes:

- Invalid transition
- Stale state after concurrent updates
- Missing state baseline

Performance Targets:

- State transition: under 250ms p95

Future Extensions:

- Longitudinal state models
- Multi-dimensional mastery representations

## 3.6 Dependency Engine

Purpose: Calculate dependency relationships and readiness conditions.

Responsibilities:

- Resolve prerequisites and dependents
- Identify blockers and unlocks
- Determine whether a node is ready for a learner
- Analyze downstream impact

Public Interface:

- get_prerequisites
- get_dependents
- get_unlocks
- find_blockers
- find_downstream
- compute_depth
- is_ready
- get_prerequisite_graph

Inputs:

- node_id, learner_id, depth, graph constraints

Outputs:

- prerequisite lists, blocker lists, readiness results, dependency subgraphs

Dependencies:

- Graph engine
- Traversal engine

Published Events:

- None

Subscribed Events:

- None

Failure Modes:

- Cyclic dependency graphs
- Missing prerequisite metadata
- Unknown learner state

Performance Targets:

- Dependency lookup: under 300ms p95 for common cases

Future Extensions:

- Impact analysis for bulk graph changes

## 3.7 Validation Engine

Purpose: Validate graph integrity before and after mutation.

Responsibilities:

- Validate node and edge structures
- Detect invalid relationships and cycles
- Compute graph health scores
- Support full and incremental validation

Public Interface:

- validate_node
- validate_edge
- validate_full_graph
- validate_import
- start_background_validation
- get_validation_status
- compute_health_score

Inputs:

- node payloads, edge payloads, raw import data

Outputs:

- validation reports, issues, health scores

Dependencies:

- Graph engine
- Traversal engine

Published Events:

- ValidationWarning
- ValidationFailed
- HealthScoreComputed

Subscribed Events:

- EdgeCreated
- EdgeDeleted
- NodeCreated
- GraphImported

Failure Modes:

- Structural inconsistency
- Semantic mismatch
- Validation timeouts on large imports

Performance Targets:

- Incremental validation: near real-time for each mutation
- Full validation: batch-oriented

Future Extensions:

- Domain-specific semantic validators

## 3.8 Search Engine

Purpose: Provide full-text and faceted search over the knowledge graph.

Responsibilities:

- Index text and metadata
- Support autocomplete
- Support filtering and ranking
- Track recent search history

Public Interface:

- search
- suggest
- search_by_type
- search_by_category
- get_trending
- record_search
- get_history

Inputs:

- query text, filters, page information

Outputs:

- search results, suggestions, trending terms

Dependencies:

- Knowledge engine

Published Events:

- NodeIndexed
- NodeRemoved
- SearchRecorded

Subscribed Events:

- NodeCreated
- NodeContentUpdated
- NodeDeleted

Failure Modes:

- Stale index
- Search ranking regressions
- Empty index contents

Performance Targets:

- Search responses under 300ms p95 for common queries

Future Extensions:

- Hybrid ranking with semantics

## 3.9 Recommendation Engine

Purpose: Recommend the next concept, review target, project, or study item.

Responsibilities:

- Score learning opportunities
- Support deterministic recommendations
- Explain why a recommendation was produced
- Provide daily plans and revision candidates

Public Interface:

- get_next_concept
- get_next_n_concepts
- get_review_candidates
- get_skip_candidates
- get_simulator_recommendation
- get_project_recommendation
- explain_recommendation
- get_daily_plan

Inputs:

- learner_state, recommendation context, goals, available hours

Outputs:

- recommendations, reasons, plans, alternatives

Dependencies:

- Graph engine
- Traversal engine
- State engine
- Career engine
- Dependency engine

Published Events:

- RecommendationGenerated

Subscribed Events:

- StateTransitioned
- ConfidenceUpdated
- AssessmentSubmitted

Failure Modes:

- No candidate found
- Insufficient context
- Inconsistent state snapshots

Performance Targets:

- Recommendation generation under 400ms p95

Future Extensions:

- Multi-objective ranking strategies

## 3.10 Learning Path Engine

Purpose: Build and optimize learning paths toward goals.

Responsibilities:

- Generate path from current state to goal
- Support alternative paths and path replanning
- Estimate duration and milestones
- Optimize for strategy and constraints

Public Interface:

- generate_path
- generate_career_path
- optimize_path
- replan_path
- generate_alternative_paths
- diff_paths
- estimate_completion
- recommend_path_strategy

Inputs:

- learner_state, goal_id, career_id, strategy, constraints

Outputs:

- learning paths, milestones, estimates, path diffs

Dependencies:

- Graph engine
- Traversal engine
- State engine
- Career engine

Published Events:

- PathGenerated
- PathReplanned

Subscribed Events:

- CareerGoalUpdated
- StateTransitioned

Failure Modes:

- Goals unreachable
- Overly long or cyclic paths
- Strategy mismatch

Performance Targets:

- Path generation under 600ms p95 for common paths

Future Extensions:

- Adaptive path revisions from live learner behavior

## 3.11 Career Engine

Purpose: Define and compare careers and their required knowledge.

Responsibilities:

- Manage career definitions
- Map careers to graph nodes and levels
- Compare careers and identify skill gaps
- Recommend careers based on learner state

Public Interface:

- get_career
- list_careers
- compare_careers
- get_career_gap
- get_career_path
- recommend_career
- get_seniority_progression
- get_nodes_for_level
- get_common_nodes
- get_unique_nodes

Inputs:

- career_id, learner_state, seniority level

Outputs:

- career definitions, comparisons, gaps, progression plans

Dependencies:

- Graph engine
- Knowledge engine

Published Events:

- CareerGoalUpdated
- CareerComparisonRequested

Subscribed Events:

- None

Failure Modes:

- Missing career mapping
- Invalid seniority progression
- Ambiguous career definition

Performance Targets:

- Career comparison under 350ms p95

Future Extensions:

- Career taxonomy expansion

## 3.12 Project Engine

Purpose: Manage project-based learning artifacts and recommend suitable projects.

Responsibilities:

- Link projects to nodes and skills
- Recommend projects by readiness
- Support project-based progression

Public Interface:

- recommend_project
- get_project_context
- get_project_recommendations

Inputs:

- learner_state, skill_set, project constraints

Outputs:

- project recommendations and context

Dependencies:

- State engine
- Knowledge engine

Published Events:

- ProjectRecommended

Subscribed Events:

- StateTransitioned

Failure Modes:

- Unavailable project mappings
- Project mismatch with learner readiness

Performance Targets:

- Project recommendation under 300ms p95

Future Extensions:

- Project templates and portfolios

## 3.13 Assessment Engine

Purpose: Run assessments and score learner responses.

Responsibilities:

- Serve assessment definitions
- Collect answers and scores
- Publish score and outcome data

Public Interface:

- get_assessment
- submit_assessment
- grade_assessment
- get_assessment_result

Inputs:

- assessment_id, learner_id, answers

Outputs:

- assessments, scored results, summary breakdown

Dependencies:

- Knowledge engine
- State engine

Published Events:

- AssessmentSubmitted
- AssessmentGraded

Subscribed Events:

- None

Failure Modes:

- Invalid answers
- Missing rubric definitions
- Score calculation inconsistencies

Performance Targets:

- Assessment scoring under 500ms p95

Future Extensions:

- Adaptive assessment flows

## 3.14 Simulator Engine

Purpose: Deliver structured practice and scenario-based learning experiences.

Responsibilities:

- Load simulator definitions
- Track simulator runs and outcomes
- Emit outcomes to state and recommendation systems

Public Interface:

- run_simulator
- get_simulator_result
- get_simulator
- get_run_history

Inputs:

- simulator_id, learner_id, context

Outputs:

- simulator run results, outcomes, logs

Dependencies:

- Knowledge engine
- State engine

Published Events:

- SimulatorCompleted

Subscribed Events:

- None

Failure Modes:

- Missing scenario config
- Timeout or incomplete run

Performance Targets:

- Simulator initialization under 400ms p95

Future Extensions:

- Multiplayer or live challenge modes

## 3.15 Import Engine

Purpose: Import content and graph material into the system.

Responsibilities:

- Parse source data
- Validate and transform content
- Build graph updates
- Support dry-run, versioning, rollback, and progress reporting

Public Interface:

- start_import
- dry_run_import
- commit_import
- rollback_import
- get_import_job
- get_import_progress

Inputs:

- source documents, formats, options, graph version metadata

Outputs:

- import jobs, validation reports, diff summaries, committed graph versions

Dependencies:

- Validation engine
- Event engine
- Persistence layer

Published Events:

- ImportStarted
- ImportCompleted
- ImportFailed
- ImportRolledBack

Subscribed Events:

- None

Failure Modes:

- Parse errors
- Validation failures
- Rollback need

Performance Targets:

- Import responsiveness should be bounded by job orchestration, not request path latency

Future Extensions:

- Incremental external source sync

---

# Part 4 — Capability Layer

## 4.1 Generate Roadmap

Purpose: Create a personalized learning roadmap.

Inputs:

- learner_id, career_id, target level, constraints

Outputs:

- ordered roadmap, milestones, estimated durations

Workflow:

- Load learner state
- Resolve career requirements
- Generate prerequisite-aware path
- Optimize for pacing and difficulty

Engine Orchestration:

- State Engine -> Learning Path Engine -> Career Engine -> Recommendation Engine

Failure Scenarios:

- Unreachable goal
- Missing guidance data
- Invalid learner state

Performance Expectations:

- Under 600ms p95 for standard roadmap creation

## 4.2 Recommend Next Concept

Purpose: Suggest the next concept or node based on learner state and goal context.

Inputs:

- learner_id, goal context, optional career target

Outputs:

- next concept, reasoning, blockers, alternatives

Workflow:

- Read learner state and readiness
- Evaluate candidate nodes
- Score by dependency and goal alignment

Engine Orchestration:

- State Engine -> Recommendation Engine -> Dependency Engine -> Graph Engine

Failure Scenarios:

- No valid next concept
- Conflicting prerequisites
- Sparse state history

Performance Expectations:

- Under 400ms p95

## 4.3 Compare Careers

Purpose: Compare two or more careers based on required knowledge and learner fit.

Inputs:

- career_ids, learner_state

Outputs:

- shared nodes, unique nodes, skill gaps, fit summary

Workflow:

- Resolve career requirement sets
- Compute differences and overlap
- Compare with learner state

Engine Orchestration:

- Career Engine -> Graph Engine -> Dependency Engine

Failure Scenarios:

- Unknown career definitions
- Missing node mappings

Performance Expectations:

- Under 350ms p95

## 4.4 Find Skill Gap

Purpose: Determine missing or weakly covered knowledge relative to a target career or milestone.

Inputs:

- learner_id, target career or milestone

Outputs:

- missing nodes, ranked gaps, explanation

Workflow:

- Load learner state
- Compare against target requirement set
- Generate prioritized missing concepts

Engine Orchestration:

- Career Engine -> State Engine -> Dependency Engine -> Recommendation Engine

Failure Scenarios:

- Missing target metadata
- Incomplete learner state

Performance Expectations:

- Under 400ms p95

## 4.5 Generate Revision Plan

Purpose: Create a concise review plan for concepts that need reinforcement.

Inputs:

- learner_id, available hours, review horizon

Outputs:

- revision plan and ranked review items

Workflow:

- Identify weak or stale nodes
- Resolve review priority
- Build review schedule

Engine Orchestration:

- Recommendation Engine -> State Engine -> Knowledge Engine

Failure Scenarios:

- No weak nodes identified
- Sparse interaction history

Performance Expectations:

- Under 400ms p95

## 4.6 Explain Dependency

Purpose: Explain why one concept depends on another and what blockers exist.

Inputs:

- source node, target node, learner_id

Outputs:

- dependency explanation, blockers, upstream chain

Workflow:

- Resolve dependency chain
- Read node content and context
- Produce explanation payload

Engine Orchestration:

- Dependency Engine -> Graph Engine -> Knowledge Engine

Failure Scenarios:

- Missing edge semantics
- Unclear dependency source

Performance Expectations:

- Under 300ms p95

## 4.7 Generate Semester Plan

Purpose: Build a semester-long plan with milestones and pacing.

Inputs:

- learner_id, goals, semester duration, constraints

Outputs:

- semester plan, milestone schedule, suggested workload

Workflow:

- Generate a path over a longer horizon
- Split into milestones
- Align to learner pacing and capacity

Engine Orchestration:

- Learning Path Engine -> State Engine -> Recommendation Engine

Failure Scenarios:

- Overly ambitious plan
- Goal mismatch

Performance Expectations:

- Under 700ms p95

## 4.8 Find Hidden Relationships

Purpose: Discover implicit relationships across concepts.

Inputs:

- node_id, relation type, depth

Outputs:

- discovered relationships, similarity groups, candidate links

Workflow:

- Traverse the neighborhood of a node
- Compare shared prerequisites and downstream outcomes
- Produce candidate relationships

Engine Orchestration:

- Traversal Engine -> Graph Engine -> Dependency Engine

Failure Scenarios:

- High graph noise
- No meaningful relationships

Performance Expectations:

- Under 500ms p95 for bounded depth

## 4.9 Generate Graph Visualization

Purpose: Produce view models for graph exploration and explanation.

Inputs:

- focus node, depth, filters

Outputs:

- subgraph payload, node layout hints, explanation metadata

Workflow:

- Build subgraph around focus node
- Resolve node content and metadata
- Shape response for visualization

Engine Orchestration:

- Graph Engine -> Traversal Engine -> Knowledge Engine

Failure Scenarios:

- Oversized graph request
- Invalid filter parameters

Performance Expectations:

- Under 400ms p95 for bounded subgraphs

---

# Part 5 — Domain Model

## 5.1 KnowledgeNode

Purpose: Represents a single concept, subject, technology, tool, project, or career-related node in the graph.

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

Relationships:

- Has many incoming and outgoing edges
- Has content blocks
- May be associated with skills, assessments, and resources

Lifecycle:

- Created, updated, deleted, versioned

Ownership:

- Graph engine owns structural lifecycle
- Knowledge engine owns content lifecycle

## 5.2 KnowledgeEdge

Purpose: Represents a dependency or relationship between nodes.

Fields:

- source_id
- target_id
- edge_type
- metadata
- version

Relationships:

- Connects two nodes
- Supports traversal and dependency logic

Lifecycle:

- Added, removed, versioned

Ownership:

- Graph engine

## 5.3 Career

Purpose: Represents a professional axis of progression.

Fields:

- id
- slug
- title
- seniority levels
- requirements
- metadata

Relationships:

- Maps to knowledge nodes
- Supports career path generation and comparison

Lifecycle:

- Defined, updated, mapped, compared

Ownership:

- Career engine

## 5.4 Skill

Purpose: Represents a cross-cutting competency that spans one or more nodes.

Fields:

- id
- slug
- title
- description
- category

Relationships:

- Mapped to nodes and used by recommendations and gap analysis

Lifecycle:

- Defined and linked

Ownership:

- Knowledge engine / skill-aware domain logic

## 5.5 Simulator

Purpose: Represents scenario-based learning or testing experiences.

Fields:

- id
- slug
- title
- type
- config
- metadata

Relationships:

- Associated with concepts and assessments

Lifecycle:

- Defined, run, scored

Ownership:

- Simulator engine

## 5.6 ContentBlock

Purpose: Represents a structured content unit attached to a node.

Fields:

- id
- node_id
- block_type
- body
- metadata

Relationships:

- Attached to a node

Lifecycle:

- Added, updated, removed

Ownership:

- Knowledge engine

## 5.7 Assessment

Purpose: Represents an assessment artifact linked to a graph node or skill.

Fields:

- id
- node_id
- rubric
- scoring_policy
- metadata

Relationships:

- Linked to nodes and learner submissions

Lifecycle:

- Created, submitted, graded

Ownership:

- Assessment engine

## 5.8 LearningState

Purpose: Represents the learner’s current state from the perspective of the graph.

Fields:

- learner_id
- node_id
- state
- confidence
- last_transition_at
- history

Relationships:

- Linked to nodes and journeys

Lifecycle:

- Updated by transitions and assessment outcomes

Ownership:

- State engine

## 5.9 Recommendation

Purpose: Represents a suggestion generated by the recommendation engine.

Fields:

- id
- learner_id
- target_node_id
- reason
- score
- metadata

Relationships:

- Derived from learner state and graph context

Lifecycle:

- Generated, consumed, invalidated

Ownership:

- Recommendation engine

## 5.10 Roadmap

Purpose: Represents a long-term learning plan.

Fields:

- id
- learner_id
- goal_id
- milestones
- metadata

Relationships:

- Composed of milestones and path steps

Lifecycle:

- Generated, revised, completed

Ownership:

- Learning path engine

## 5.11 Milestone

Purpose: A logical checkpoint within a roadmap or journey.

Fields:

- id
- roadmap_id
- title
- node_ids
- target_state

Relationships:

- Belongs to a roadmap

Lifecycle:

- Planned, completed, updated

Ownership:

- Learning path engine

## 5.12 Journey

Purpose: Represents the learner’s ongoing progression across time and goals.

Fields:

- id
- learner_id
- current_goal
- history

Relationships:

- Aggregates state, paths, milestones, and assessments

Lifecycle:

- Active, paused, completed

Ownership:

- State engine / capability layer

## 5.13 Artifact

Purpose: Represents generated outputs such as visualization payloads, roadmap snapshots, comparison results, or import reports.

Fields:

- id
- artifact_type
- payload
- generated_at

Relationships:

- Derived from capabilities and engines

Lifecycle:

- Generated, stored, referenced

Ownership:

- Capability layer and engine layer

## 5.14 GraphVersion

Purpose: Represents a versioned snapshot of the graph for import, rollback, and auditing.

Fields:

- id
- version
- created_at
- source
- metadata

Relationships:

- Parent to imported changes and rolled-back states

Lifecycle:

- Created, validated, committed, rolled back

Ownership:

- Import engine

## 5.15 ValidationReport

Purpose: Holds structural and semantic validation results.

Fields:

- id
- graph_version_id
- issues
- health_score
- generated_at

Relationships:

- Attached to graph versions and imports

Lifecycle:

- Generated, consumed, archived

Ownership:

- Validation engine

---

# Part 6 — Event Architecture

## 6.1 Event Model

Every state-changing workflow emits immutable domain events. Consumers must be idempotent.

## 6.2 Event Catalog

- NodeCreated
- NodeUpdated
- NodeDeleted
- EdgeCreated
- EdgeDeleted
- GraphImported
- StateTransitioned
- ConfidenceUpdated
- LearningMilestoneReached
- AssessmentSubmitted
- AssessmentGraded
- PathGenerated
- PathReplanned
- CareerGoalUpdated
- RecommendationGenerated
- ValidationWarning
- ValidationFailed
- HealthScoreComputed
- ImportStarted
- ImportCompleted
- ImportFailed
- ImportRolledBack
- SimulatorCompleted
- ProjectRecommended

## 6.3 Event Properties

Each event includes:

- event_id
- event_version
- occurred_at
- aggregate_id
- correlation_id
- causation_id
- payload

## 6.4 Delivery Semantics

- At-least-once delivery
- Idempotency enforced through event_id deduplication
- Ordering guaranteed per aggregate_id
- Cross-aggregate ordering is best-effort

## 6.5 Replay and History

- Replay is supported from event store by aggregate_id and time range
- Event history is available for debugging and reconstruction

## 6.6 Versioning

- Event schema changes must be additive
- Breaking changes require a new versioned event type

## 6.7 Dead-Letter Behavior

- Retries follow exponential backoff
- Failed events are moved to dead-letter storage after the configured retry count
- Dead letters can be inspected and retried manually

---

# Part 7 — Graph Architecture

## 7.1 Graph Model

The graph is a directed, typed relationship graph. Relationships represent dependencies, prerequisites, unlocks, similarity, and cross-domain links.

## 7.2 Relationship Types

- prerequisite
- unlocks
- depends_on
- related_to
- reinforces
- requires
- overlaps_with
- supports
- references

## 7.3 Traversal Semantics

- Traversal is bounded by depth limits for request-path operations
- Full-graph traversal is batch-oriented and validation-driven
- Shortest path uses unweighted traversal semantics

## 7.4 Indexes

- Node lookup index by id and slug
- Edge index by source/target/type
- Composite indexes for common traversal queries
- Metadata search indexes for content and tags

## 7.5 Cross-Domain Links

The graph links:

- concepts to skills
- concepts to assessments
- concepts to resources
- concepts to projects
- concepts to careers
- careers to milestones and prerequisites

## 7.6 Hidden Relationships

Hidden relationships are inferred from common prerequisites, shared outcomes, similarity, or dependency neighborhoods. They are treated as derived relationships and surfaced in discovery and explanation workflows.

## 7.7 Versioning

Graph snapshots are versioned for import, rollback, and audit needs.

## 7.8 Validation

Every mutation is validated structurally and semantically before commit.

## 7.9 Caching

- Hot graph views are cached in memory and Redis
- Graph subgraphs are cached per node and depth
- Cache invalidation occurs through domain events

## 7.10 Memory Model

The engine layer uses a graph abstraction that can be backed by in-memory structures for runtime and persisted storage for durability. The structure remains engine-friendly and backend-agnostic.

---

# Part 8 — API Specification

## 8.1 API Design Principles

- Capability APIs only
- No CRUD API surface as the primary interface
- Responses follow a normalized envelope

## 8.2 Common Response Envelope

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": null,
  "timestamp": "",
  "request_id": ""
}
```

## 8.3 Endpoint Catalog

### POST /api/v1/capabilities/next-concept

Purpose: Recommend the next concept for a learner.
Request: learner_id, context, optional career_target
Response: recommendation, reason, readiness, alternatives
Errors: invalid_context, no_candidate, unauthorized
Performance target: p95 < 400ms
Authorization: authenticated learner
Caching: 30 seconds
Idempotency: safe to retry with same request_id

### POST /api/v1/capabilities/roadmap

Purpose: Generate a roadmap for a learner.
Request: learner_id, career_id, level, constraints
Response: roadmap, milestones, plan summary
Errors: invalid_target, unreachable_goal
Performance target: p95 < 600ms
Authorization: authenticated learner
Caching: 5 minutes
Idempotency: safe to retry with same request_id

### POST /api/v1/capabilities/skill-gap

Purpose: Calculate missing knowledge relative to a target.
Request: learner_id, career_id or milestone
Response: gaps, blockers, priorities
Errors: missing_target
Performance target: p95 < 400ms
Authorization: authenticated learner
Caching: 5 minutes
Idempotency: safe to retry with same request_id

### POST /api/v1/capabilities/compare-careers

Purpose: Compare careers.
Request: career_ids, learner_context
Response: similarity, differences, fit summary
Errors: invalid_career_ids
Performance target: p95 < 350ms
Authorization: authenticated learner
Caching: 1 hour
Idempotency: safe to retry with same request_id

### POST /api/v1/capabilities/explain-dependency

Purpose: Explain dependency chain and blocker reasoning.
Request: source_node_id, target_node_id, learner_id
Response: explanation, chain, blockers
Errors: invalid_nodes
Performance target: p95 < 300ms
Authorization: authenticated learner
Caching: 1 hour
Idempotency: safe to retry with same request_id

### POST /api/v1/capabilities/visualize

Purpose: Generate graph subgraph for visualization.
Request: focus_node_id, depth, filters
Response: subgraph data, metadata
Errors: invalid_request
Performance target: p95 < 400ms
Authorization: authenticated learner
Caching: 10 minutes
Idempotency: safe to retry with same request_id

### POST /api/v1/capabilities/assessments/submit

Purpose: Submit an assessment result.
Request: assessment_id, learner_id, answers
Response: score, breakdown, next steps
Errors: invalid_submission
Performance target: p95 < 500ms
Authorization: authenticated learner
Caching: none
Idempotency: safe to retry with same submission_id

### GET /api/v1/graph/nodes/{id}

Purpose: Retrieve node details.
Request: path parameter node_id
Response: node content and metadata
Errors: not_found
Performance target: p95 < 200ms
Authorization: authenticated learner
Caching: 10 minutes
Idempotency: read-only

### GET /api/v1/search

Purpose: Search the graph content model.
Request: query, filters, pagination
Response: results, suggestions
Errors: invalid_query
Performance target: p95 < 300ms
Authorization: authenticated learner
Caching: 2 minutes
Idempotency: read-only

### POST /api/v1/imports/start

Purpose: Start an import job.
Request: source, format, options
Response: import_id, progress metadata
Errors: invalid_import
Performance target: p95 < 1s
Authorization: admin
Caching: none
Idempotency: safe to retry with import_id

---

# Part 9 — Persistence Mapping

## 9.1 Core Tables

The relational persistence model is the durable backing store for the graph and learner state.

### knowledge_nodes

Purpose: Stores node identity, type, slug, title, difficulty, and metadata.
Why it exists: It is the primary record for graph nodes.
Indexes: id, slug, node_type, difficulty.

### knowledge_edges

Purpose: Stores source target edges and relationship metadata.
Why it exists: It captures graph connectivity.
Indexes: source_id, target_id, edge_type, composite (source, target, type).

### content_blocks

Purpose: Stores text and structured content blocks attached to nodes.
Why it exists: It persists the enriched content model.
Indexes: node_id, block_type.

### learner_states

Purpose: Stores learner state per node.
Why it exists: It persists learning state for progression, assessment, and recommendation.
Indexes: learner_id, node_id, state.

### learner_profiles

Purpose: Stores learner-level preferences, goals, and profile metadata.
Why it exists: It supports long-lived learner context.
Indexes: learner_id.

### careers

Purpose: Stores career definitions.
Why it exists: It supports career-based roadmap and comparison workflows.
Indexes: id, slug.

### career_requirements

Purpose: Stores career-to-node mapping at different progression levels.
Why it exists: It expresses career expectations as graph-linked requirements.
Indexes: career_id, node_id, level.

### skills

Purpose: Stores skill definitions.
Why it exists: It supports competency-based reasoning.
Indexes: id, slug.

### skill_node_maps

Purpose: Maps skills to graph nodes.
Why it exists: It supports skill-to-concept linkage and gap analysis.
Indexes: skill_id, node_id.

### assessments

Purpose: Stores assessment definitions and scoring logic.
Why it exists: It is the durable object for assessments.
Indexes: id, node_id.

### assessment_results

Purpose: Stores learner submissions and scores.
Why it exists: It persists assessment outcomes.
Indexes: learner_id, assessment_id.

### import_jobs

Purpose: Stores import lifecycle and job status.
Why it exists: It enables import progress and rollback control.
Indexes: import_id, status, created_at.

### event_store

Purpose: Stores immutable event records for replay and recovery.
Why it exists: It supports event-driven behavior, recovery, and auditability.
Indexes: aggregate_id, event_id, occurred_at.

## 9.2 Partitioning

- event_store partitioned by month
- learner_states partitioned by learner hash or state category
- import_jobs partitioned by creation time

## 9.3 JSONB Usage

- Node metadata
- Content block payloads
- Plugin configuration
- Import source metadata
- Recommendation rationale

## 9.4 Migration Strategy

- Migrations are additive first
- Backfills are batched
- Rollback supports previous graph version snapshots
- Schema upgrades remain compatible with event-driven replay

## 9.5 Future Graph Database Migration Strategy

The relational model remains the current persistence standard. A future graph database migration may be introduced as a secondary execution engine, but the domain model and capability contracts must remain unchanged.

---

# Part 10 — Frontend Architecture

## 10.1 Routing

The frontend uses a route-based app shell with feature-specific routes:

- /dashboard
- /explore
- /careers
- /roadmap
- /simulator
- /assessment
- /search
- /settings
- /tutor

## 10.2 Features

- Graph visualization
- Knowledge explorer
- Career explorer
- Learning dashboard
- Simulator hub
- Assessment center
- Search experience
- AI tutor
- Roadmap viewer
- Settings

## 10.3 Pages

Each feature has a route-level page plus supporting components, hooks, and stores.

## 10.4 Providers

- AuthProvider
- ThemeProvider
- GraphProvider
- QueryProvider

## 10.5 Stores

- graphStore for interaction state
- uiPreferencesStore for display preferences
- searchStore for search context
- roadmapStore for roadmap session state

## 10.6 Caching

- React Query cache for API-backed data
- Local view-state persistence for graph viewport and filters
- Route-level suspense and skeleton states

## 10.7 Rendering

- Server components for data-rich pages where appropriate
- Client components for interactive graph features
- Lazy loading for heavy visualization and simulator modules

## 10.8 Plugin System

- Feature registry for optional plugins
- Runtime registration for renderers, simulators, importer adapters, and assessors

## 10.9 Simulator Loading

- Simulator modules load lazily by manifest
- Simulator metadata is fetched before initialization

---

# Part 11 — Plugin Architecture

## 11.1 Renderer Plugins

Purpose: Extend visualization capabilities.
Responsibilities: render nodes, edges, overlays, and context panels.

## 11.2 Simulator Plugins

Purpose: Add new scenario-based learning experiences.
Responsibilities: define run lifecycle, scoring, and outcomes.

## 11.3 Assessment Plugins

Purpose: Add new assessment types and scoring logic.
Responsibilities: produce score and feedback payloads.

## 11.4 Visualization Plugins

Purpose: Add alternate graph, dependency, and roadmap visualization modes.
Responsibilities: supply view model and render behavior.

## 11.5 Importer Plugins

Purpose: Introduce support for new content formats.
Responsibilities: parse and transform external payloads.

## 11.6 Exporter Plugins

Purpose: Export graph data or learning plans.
Responsibilities: format and emit content-pack or report outputs.

## 11.7 Validation Plugins

Purpose: Add domain-specific validation logic.
Responsibilities: validate semantic integrity and quality rules.

---

# Part 12 — Import System

## 12.1 Importer Pipeline

1. Parse source documents
2. Validate payload structure and semantics
3. Transform to domain objects
4. Build graph updates
5. Validate resulting graph state
6. Commit versioned graph change
7. Emit events and progress updates
8. Support rollback on failure

## 12.2 Validation

- Structural validation
- Semantic validation
- Dependency validation
- Health score evaluation

## 12.3 Rollback

- Roll back to the previous graph version if required
- Revert imported content and event side effects where possible

## 12.4 Versioning

- Import creates a graph version
- Previous versions remain available for comparison and rollback

## 12.5 Diff

- Import output includes a graph diff summary
- Diffs support review and acceptance workflows

## 12.6 Dry Run

- The system can validate an import without mutating state

## 12.7 Incremental Import

- Imports may be incremental and versioned
- Large imports are processed in batches with progress checkpoints

## 12.8 Large Graph Support

- Import is batch-oriented
- Progress reporting and resumability are part of the contract

---

# Part 13 — Performance Targets

## 13.1 Latency Budgets

- Node detail fetch: < 200ms p95
- Search: < 300ms p95
- Recommendation: < 400ms p95
- Path generation: < 600ms p95
- Assessment scoring: < 500ms p95

## 13.2 Memory Budgets

- Graph runtime memory should be bound by graph size and cache policy
- Hot caches should be bounded and configurable

## 13.3 Startup Targets

- API and web startup should complete without blocked initialization
- Engine startup should be idempotent and health-reporting

## 13.4 Scaling Assumptions

- The graph is expected to scale to large node counts and substantial learner state
- The architecture supports partitioning, caching, and incremental processing without changing core contracts

## 13.5 Caching Strategy

- Hot graph and state views use caching
- Cache TTLs are explicit per capability
- Cache invalidation is event-driven

## 13.6 Concurrency Model

- Read operations are concurrent and cached where appropriate
- Write operations are serialized per aggregate when needed
- Concurrent state transitions must remain safe and deterministic

---

# Part 14 — Security

## 14.1 Authentication

- Authenticated learners and admins are required for protected operations
- Identity and session handling are managed through infrastructure adapters

## 14.2 Authorization

- Learners access their own state, overview data, and eligible capabilities
- Admins access import and validation control surfaces

## 14.3 Audit Logs

- Audit trails are recorded for import operations, validation changes, and state transitions

## 14.4 Input Validation

- API requests are validated before engine execution
- Domain commands and queries are validated before mutation

## 14.5 Content Validation

- Imported content is checked for structural and semantic correctness
- Unsafe or malformed content is rejected or quarantined

## 14.6 Import Validation

- Import operations must pass validation before commit
- Dry-run and rollback procedures are available

## 14.7 Rate Limiting

- Public and authenticated API traffic is rate-limited based on capability sensitivity

---

# Part 15 — Testing Strategy

## 15.1 Unit Tests

Focus on pure logic, policies, and engine decision rules.

## 15.2 Integration Tests

Cover API-to-engine, engine-to-persistence, and event-delivery flows.

## 15.3 Engine Tests

Each engine must have behavior tests and interface conformance tests.

## 15.4 Capability Tests

Capabilities must be tested end-to-end with realistic input state.

## 15.5 Graph Tests

Tests should validate traversal correctness, cycle detection, dependency correctness, and graph integrity.

## 15.6 Performance Tests

Measure latency, memory usage, traversal efficiency, and recommendation execution under load.

## 15.7 Load Tests

Stress the system with large graph data and high concurrency.

## 15.8 Snapshot Tests

Use snapshots where the output contract is intentionally stable.

---

# Part 16 — Deployment

## 16.1 Local

- Local development uses containerized services and local environment settings
- The web and API apps run together with supporting data services

## 16.2 Docker

- Services are containerized for consistency across environments
- Docker Compose supports local orchestration and common integration workflows

## 16.3 Production

- Container-based deployment with observability and health checks
- PostgreSQL and Redis are managed as first-class services

## 16.4 CI/CD

- CI pipelines validate tests, linting, type checks, and packaging
- Deployments should be environment-aware and version-controlled

## 16.5 Monitoring

- Health checks, request metrics, error rates, and engine health are monitored

## 16.6 Logging

- Structured logs include request metadata, event metadata, and correlation IDs

## 16.7 Tracing

- Distributed tracing should cover capability execution, engine orchestration, and persistence interactions

## 16.8 Health Checks

- API, database, event store, and cache should expose health endpoints and readiness signals

---

# Part 17 — Engineering Standards

## 17.1 Folder Rules

- Feature modules remain grouped by domain and layer
- Shared packages are reused rather than duplicated
- Backend and frontend follow the same capability naming model

## 17.2 Dependency Rules

- API layer depends on capability layer and shared infrastructure
- Capabilities depend on engines and domain models
- Engines depend on domain models and infrastructure adapters
- Persistence and infrastructure must not leak into the domain layer

## 17.3 Naming Conventions

- Classes: PascalCase
- Methods and functions: camelCase in TypeScript, snake_case in Python
- Files: lowercase with descriptive names
- Events: past-tense names
- Commands and queries: suffix-based naming

## 17.4 Code Review Rules

- All changes must be reviewed for architecture alignment
- New capabilities require explicit contract documentation
- Changes to engines require tests and validation coverage

## 17.5 Documentation Rules

- Public contracts must be documented
- Domain events and capabilities must remain discoverable
- Architecture decisions must be recorded and preserved

## 17.6 Versioning Rules

- APIs, events, and plugin contracts are versioned
- Breaking changes require a new contract version

## 17.7 Deprecation Policy

- Deprecated APIs and events should remain supported for a defined period
- Deprecation notices should be documented and communicated

---

# Part 18 — Implementation Roadmap

## Milestone 1 — Foundation

Scope:

- Repository setup
- Backend and frontend shell
- Shared packages
- Health endpoints

Deliverables:

- Running monorepo
- Basic API and web shell

Acceptance Criteria:

- App boots locally
- Health checks pass

Dependencies:

- None

Risk:

- Under-scoping the initial shell

Estimated Effort:

- 1 week

## Milestone 2 — Core Graph and Persistence

Scope:

- Graph and knowledge engines
- PostgreSQL schema and migrations
- Basic graph read endpoints

Deliverables:

- Node and edge persistence
- Basic graph browsing

Acceptance Criteria:

- Nodes and edges can be stored and retrieved

Dependencies:

- Milestone 1

Risk:

- Graph model mismatch with content model

Estimated Effort:

- 1 week

## Milestone 3 — Validation and Events

Scope:

- Validation engine
- Event engine
- Event store and retries

Deliverables:

- Validated mutations and event flow

Acceptance Criteria:

- Graph mutations are validated and emitted as events

Dependencies:

- Milestone 2

Risk:

- Event delivery complexity

Estimated Effort:

- 1 week

## Milestone 4 — State and Dependency Model

Scope:

- State engine
- Dependency engine
- Learner progress persistence

Deliverables:

- Learner state transitions and dependency queries

Acceptance Criteria:

- Learner progression is stored and reasoned about

Dependencies:

- Milestone 3

Risk:

- State model complexity

Estimated Effort:

- 1 week

## Milestone 5 — Recommendations and Roadmaps

Scope:

- Recommendation engine
- Learning path engine
- Next concept and roadmap capabilities

Deliverables:

- Personalized learning suggestions and roadmap generation

Acceptance Criteria:

- Next concept and roadmap flows work end to end

Dependencies:

- Milestone 4

Risk:

- Recommendation quality and explainability

Estimated Effort:

- 1 week

## Milestone 6 — Careers and Assessment

Scope:

- Career engine
- Assessment engine
- Career comparison and assessment submission

Deliverables:

- Career-fit analysis and assessment flow

Acceptance Criteria:

- Careers can be compared and assessments can be submitted

Dependencies:

- Milestone 5

Risk:

- Incomplete scoring or career mapping

Estimated Effort:

- 1 week

## Milestone 7 — Search and Visualization

Scope:

- Search engine
- Graph exploration UI
- Visualization support

Deliverables:

- Search and graph exploration experience

Acceptance Criteria:

- Users can search and visualize graph content

Dependencies:

- Milestone 6

Risk:

- Visualization performance at graph scale

Estimated Effort:

- 1 week

## Milestone 8 — Import and Administration

Scope:

- Import engine
- Dry-run and rollback
- Import progress and validation

Deliverables:

- Safe import pipeline and admin workflow

Acceptance Criteria:

- Import jobs can be run, validated, and rolled back

Dependencies:

- Milestone 7

Risk:

- Data quality and rollback complexity

Estimated Effort:

- 1 week

## Milestone 9 — Simulators and Plugins

Scope:

- Simulator engine
- Plugin registry
- Additional capability surfaces

Deliverables:

- Runnable simulator workflows and plugin entry points

Acceptance Criteria:

- Plug-in-based simulator workflows are available

Dependencies:

- Milestone 8

Risk:

- Extension interface complexity

Estimated Effort:

- 1 week

## Milestone 10 — Hardening and Scale Readiness

Scope:

- Performance tuning
- Caching
- Observability
- Security hardening

Deliverables:

- Production-ready baseline

Acceptance Criteria:

- The platform meets performance and security expectations under pilot load

Dependencies:

- Milestone 9

Risk:

- Scaling bottlenecks and operational complexity

Estimated Effort:

- 1 week

---

## Final Note

This document consolidates the approved architecture into a single master implementation specification. It preserves the existing design decisions, organizes them into a complete engineering contract, and provides enough detail for an implementation team to build SV-OS from scratch without needing to refer back to older architecture fragments.
