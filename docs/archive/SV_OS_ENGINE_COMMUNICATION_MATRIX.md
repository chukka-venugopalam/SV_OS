# SV-OS Engine Communication Matrix

## Document Status

- Version: 1.0
- Status: Implementation planning package
- Purpose: Document engine-to-engine interactions, events, and contracts

---

## Communication Model

The system uses a capability-oriented architecture with event-driven coordination between engines. The Event Engine is the shared backbone for asynchronous domain communication.

---

## Matrix

| Producer              | Consumer              | Mechanism            | Trigger                       | Payload            | Notes                                              |
| --------------------- | --------------------- | -------------------- | ----------------------------- | ------------------ | -------------------------------------------------- |
| Graph Engine          | Validation Engine     | Synchronous call     | Before mutation               | GraphChangeRequest | Validation must complete before persistence        |
| Graph Engine          | Event Engine          | Async publish        | After mutation                | DomainEvent        | Publishes node and edge events                     |
| Validation Engine     | Event Engine          | Async publish        | Validation failure or success | ValidationReport   | Supports import and mutation workflows             |
| State Engine          | Dependency Engine     | Synchronous call     | Readiness calculation         | LearnerState       | Dependency engine consumes learner state           |
| Dependency Engine     | Recommendation Engine | Synchronous call     | Recommendation generation     | ReadinessResult    | Recommendation engine uses readiness signals       |
| Recommendation Engine | Learning Path Engine  | Synchronous call     | Roadmap generation            | Recommendation     | Learning path consumes recommendations             |
| Learning Path Engine  | Event Engine          | Async publish        | Roadmap generated             | RoadmapEvent       | Enables downstream UI updates                      |
| State Engine          | Career Engine         | Synchronous call     | Career match calculation      | LearnerState       | Career engine evaluates current state              |
| State Engine          | Assessment Engine     | Synchronous call     | Assessment scoring            | LearnerState       | Assessment output may influence learner state      |
| Knowledge Engine      | Search Engine         | Synchronous or async | Index refresh                 | KnowledgeContent   | Search engine indexes content changes              |
| Import Engine         | Validation Engine     | Synchronous call     | Pre-import validation         | ImportPayload      | Import cannot proceed without validation           |
| Import Engine         | Graph Engine          | Synchronous call     | Commit import                 | ImportPayload      | Import writes into graph data layer                |
| Import Engine         | Event Engine          | Async publish        | Import completion/failure     | ImportEvent        | Supports observability and downstream coordination |
| Simulator Engine      | State Engine          | Synchronous call     | Scenario execution            | SimulationRequest  | Updates state based on scenario outcomes           |
| Simulator Engine      | Event Engine          | Async publish        | Scenario result               | SimulationEvent    | Supports monitoring and orchestration              |

---

## Event Topics

- graph.node.created
- graph.node.updated
- graph.edge.created
- graph.edge.updated
- validation.failed
- validation.passed
- state.updated
- state.completed
- dependency.readiness.updated
- recommendation.generated
- roadmap.generated
- assessment.submitted
- assessment.scored
- import.started
- import.completed
- import.failed
- import.rollback.requested
- simulator.completed

---

## Coordination Rules

1. Graph mutations must pass validation before persistence.
2. State changes should trigger dependency and recommendation recalculation.
3. Import workflows should publish events for progress and completion.
4. Search indexing should occur after knowledge or graph updates.
5. Event publication should be idempotent and replay-safe.

---

## Integration Considerations

- All asynchronous events should include correlation IDs.
- Retry policies should be configurable per topic.
- Event consumers should be resilient to duplicate deliveries.
- Critical workflows should keep an audit trail of event deliveries.
