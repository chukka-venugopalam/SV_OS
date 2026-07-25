# SV-OS Build Order

## Document Status

- Version: 1.0
- Status: Implementation planning package
- Purpose: Sequence delivery in a practical build order with critical path visibility

---

## Principle

Build the system in layers:

1. Foundation and delivery platform
2. Core graph and knowledge persistence
3. Validation and event backbone
4. Learner intelligence and recommendations
5. Experience surfaces and capability APIs
6. Import, admin, and simulation extensions
7. Hardening and release readiness

---

## Phase 0 — Repository Bootstrap and Tooling

Duration: 1 week

Objectives:

- Stand up monorepo
- Configure CI and developer workflows
- Establish test harnesses and health checks

Deliverables:

- App shells for API and web
- Shared packages
- CI pipeline
- Basic health endpoints

Critical Path:

- None; this unlocks all workstreams

---

## Phase 1 — Core Data and Graph Foundation

Duration: 2 weeks

Objectives:

- Create persistence model for nodes, edges, and content
- Implement graph and knowledge reads
- Establish stable APIs for graph exploration

Deliverables:

- Graph repository and engine
- Knowledge engine
- Graph traversal APIs
- Initial graph explorer UI

Critical Path:

- Graph and knowledge foundation is the base for all downstream intelligence

---

## Phase 2 — Safety and Coordination Backbone

Duration: 1.5 weeks

Objectives:

- Introduce validation and event-driven coordination
- Ensure mutations are safe and observable

Deliverables:

- Validation engine
- Event engine
- Mutation validation hooks
- Admin validation views

Critical Path:

- Required before import and advanced state flows

---

## Phase 3 — Learner State and Dependency Intelligence

Duration: 2 weeks

Objectives:

- Model learner progression and readiness
- Connect graph state to dependency logic

Deliverables:

- State engine
- Dependency engine
- Progress and readiness APIs
- Dashboard UI

Critical Path:

- Required before recommendations and learning paths

---

## Phase 4 — Recommendation and Learning Pathing

Duration: 2 weeks

Objectives:

- Deliver deterministic recommendation and roadmap generation

Deliverables:

- Recommendation engine
- Learning path engine
- Roadmap capability services
- Learning path UI

Critical Path:

- Depends on Phase 3

---

## Phase 5 — Career, Assessment, and Search

Duration: 2 weeks

Objectives:

- Deliver career, assessment, and search experiences

Deliverables:

- Career engine
- Assessment engine
- Search engine
- Capability services
- Career and assessment UI

Critical Path:

- Depends on Phase 1 and Phase 3

---

## Phase 6 — Full Learner Experience Delivery

Duration: 2 weeks

Objectives:

- Connect all capability APIs into route-level experience surfaces
- Implement shared UI patterns and data flow

Deliverables:

- Fully navigable learner experience
- Shared UI components
- Route-level state handling

Critical Path:

- Depends on Phases 4 and 5

---

## Phase 7 — Import, Administration, and Operations

Duration: 2 weeks

Objectives:

- Deliver admin import workflows and operational control

Deliverables:

- Import engine
- Import APIs and admin UI
- Rollback and versioning support

Critical Path:

- Depends on Phases 2 and 6

---

## Phase 8 — Simulator and Extension Layer

Duration: 1 week

Objectives:

- Add simulator and plugin readiness

Deliverables:

- Simulator engine
- Plugin registry
- Simulator UI entry points

Critical Path:

- Depends on Phase 3

---

## Phase 9 — Hardening and Release Readiness

Duration: 1 week

Objectives:

- Performance, security, monitoring, and deployment

Deliverables:

- Observability
- Security hardening
- Load and resilience tests
- Release documentation

Critical Path:

- Final release gate

---

## Critical Path Summary

The critical path is:

1. Repository bootstrap
2. Graph and knowledge foundation
3. Validation and event backbone
4. State and dependency intelligence
5. Recommendation and learning pathing
6. Learner experience delivery
7. Import and admin operations
8. Release hardening

## Suggested Team Allocation

- Backend core team: Phases 0–5, 7–9
- Frontend experience team: Phases 0, 1, 3, 4, 5, 6, 7, 8
- Platform and DevOps team: Phases 0 and 9
- QA and release team: Phases 5–9
