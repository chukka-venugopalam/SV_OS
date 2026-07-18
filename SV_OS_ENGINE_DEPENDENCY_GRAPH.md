# SV-OS Engine Dependency Graph

## Document Status

- Version: 1.0
- Status: Implementation planning package
- Purpose: Describe engine dependencies, event flows, and initialization order

---

## Engine Inventory

### 1. Graph Engine

Purpose:

- Owns graph mutation and traversal workflows.

Dependencies:

- Knowledge Engine
- Validation Engine
- Event Engine

Consumes:

- Graph repository
- Node and edge persistence

Produces:

- Graph domain events
- Traversal results

Initialization Order:

- 1. Repository layer
- 2. Graph engine
- 3. Graph capability services

Shutdown Order:

- 1. Disable graph capabilities
- 2. Stop engine workers
- 3. Close repository connections

Key Events:

- graph.node.created
- graph.node.updated
- graph.edge.created
- graph.edge.updated

---

### 2. Knowledge Engine

Purpose:

- Owns content retrieval and knowledge representation.

Dependencies:

- Graph Engine
- Event Engine

Consumes:

- Knowledge repository
- Graph metadata

Produces:

- Knowledge content payloads
- Knowledge update events

Initialization Order:

- 1. Knowledge repository
- 2. Knowledge engine

Shutdown Order:

- 1. Stop content serving
- 2. Close repository connections

Key Events:

- knowledge.content.updated
- knowledge.content.revalidated

---

### 3. Validation Engine

Purpose:

- Validates mutations and content imports before persistence.

Dependencies:

- Graph Engine
- Knowledge Engine
- Event Engine

Consumes:

- Validation rules
- Existing graph state
- Import payloads

Produces:

- Validation reports
- Validation failure events

Initialization Order:

- 1. Rule registry
- 2. Validation engine
- 3. Rule hooks

Shutdown Order:

- 1. Disable validation hooks
- 2. Stop background validation workers

Key Events:

- validation.failed
- validation.passed

---

### 4. Event Engine

Purpose:

- Provides domain-event backbone and orchestration signals.

Dependencies:

- None

Consumes:

- Event publishers and subscribers
- Event store

Produces:

- Domain events
- Retry and dead-letter notifications

Initialization Order:

- 1. Event store
- 2. Publisher registry
- 3. Event worker pool

Shutdown Order:

- 1. Stop event workers
- 2. Flush pending events
- 3. Close event store

Key Events:

- event.delivered
- event.retried
- event.dead_lettered

---

### 5. State Engine

Purpose:

- Tracks learner progression and state transitions.

Dependencies:

- Graph Engine
- Event Engine

Consumes:

- Learner state repository
- Graph context

Produces:

- State transitions
- Progress snapshots

Initialization Order:

- 1. State repository
- 2. State engine

Shutdown Order:

- 1. Stop state processors
- 2. Close repository connections

Key Events:

- state.updated
- state.completed
- state.blocked

---

### 6. Dependency Engine

Purpose:

- Computes prerequisites, blockers, and readiness.

Dependencies:

- Graph Engine
- State Engine

Consumes:

- Graph dependency data
- Learner state

Produces:

- Readiness indicators
- Blocker and unlock info

Initialization Order:

- 1. Dependency rules
- 2. Dependency engine

Shutdown Order:

- 1. Stop readiness calculation tasks

Key Events:

- dependency.readiness.updated
- dependency.blocker.detected

---

### 7. Recommendation Engine

Purpose:

- Produces deterministic next-step recommendations.

Dependencies:

- Dependency Engine
- State Engine
- Graph Engine

Consumes:

- Learner state
- Dependency readiness
- Graph context

Produces:

- Recommendation payloads
- Explanation metadata

Initialization Order:

- 1. Recommendation policy configuration
- 2. Recommendation engine

Shutdown Order:

- 1. Stop recommendation workers

Key Events:

- recommendation.generated
- recommendation.explained

---

### 8. Learning Path Engine

Purpose:

- Builds roadmaps and milestone plans.

Dependencies:

- Recommendation Engine
- Dependency Engine
- Graph Engine

Consumes:

- Recommendation set
- Dependency graph
- Learner state

Produces:

- Roadmaps
- Learning milestones

Initialization Order:

- 1. Learning path policy rules
- 2. Learning path engine

Shutdown Order:

- 1. Stop path generation jobs

Key Events:

- roadmap.generated
- milestone.updated

---

### 9. Career Engine

Purpose:

- Maps learner progress to career opportunities and gaps.

Dependencies:

- Graph Engine
- State Engine

Consumes:

- Career metadata
- Learner state
- Skill graph data

Produces:

- Career matches
- Skill-gap analyses

Initialization Order:

- 1. Career definitions store
- 2. Career engine

Shutdown Order:

- 1. Stop career computations

Key Events:

- career.match.updated
- career.gap.calculated

---

### 10. Assessment Engine

Purpose:

- Handles assessment definitions, scoring, and submission outcomes.

Dependencies:

- State Engine
- Validation Engine

Consumes:

- Assessment definitions
- Learner state
- Validation rules

Produces:

- Assessment scores
- Submission outcomes

Initialization Order:

- 1. Assessment repository
- 2. Assessment engine

Shutdown Order:

- 1. Stop submission processors

Key Events:

- assessment.submitted
- assessment.scored

---

### 11. Search Engine

Purpose:

- Delivers search indexing and ranking.

Dependencies:

- Knowledge Engine
- Graph Engine

Consumes:

- Graph and knowledge content
- Search index store

Produces:

- Ranked search results
- Autocomplete results

Initialization Order:

- 1. Search index store
- 2. Search engine

Shutdown Order:

- 1. Stop index refresh workers

Key Events:

- search.index.updated
- search.query.completed

---

### 12. Import Engine

Purpose:

- Parses, validates, and imports external content into the graph.

Dependencies:

- Validation Engine
- Event Engine
- Graph Engine
- Knowledge Engine

Consumes:

- Import payloads
- Transformation rules
- Existing graph state

Produces:

- Import jobs
- Import reports
- Rollback artifacts

Initialization Order:

- 1. Import job store
- 2. Import engine

Shutdown Order:

- 1. Stop import workers
- 2. Preserve job state

Key Events:

- import.started
- import.completed
- import.failed
- import.rollback.requested

---

### 13. Simulator Engine

Purpose:

- Executes simulations and scenario outcomes.

Dependencies:

- State Engine
- Event Engine

Consumes:

- Scenario definitions
- Learner state

Produces:

- Simulation results
- Scenario events

Initialization Order:

- 1. Scenario definitions store
- 2. Simulator engine

Shutdown Order:

- 1. Stop scenario workers

Key Events:

- simulator.started
- simulator.completed

---

## Cross-Engine Communication Summary

- The Event Engine is the central coordination layer.
- Graph mutations trigger validation and event publication.
- Learner state changes trigger dependency and recommendation recalculation.
- Search relies on content visibility and indexing events.
- Imports depend on validation and publish the resulting graph updates as domain events.

## Recommended Startup Order

1. Event Engine
2. Graph Engine
3. Knowledge Engine
4. Validation Engine
5. State Engine
6. Dependency Engine
7. Recommendation Engine
8. Learning Path Engine
9. Career Engine
10. Assessment Engine
11. Search Engine
12. Import Engine
13. Simulator Engine

## Recommended Shutdown Order

1. Simulator Engine
2. Import Engine
3. Search Engine
4. Assessment Engine
5. Career Engine
6. Learning Path Engine
7. Recommendation Engine
8. Dependency Engine
9. State Engine
10. Validation Engine
11. Knowledge Engine
12. Graph Engine
13. Event Engine
