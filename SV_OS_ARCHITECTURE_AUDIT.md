# SV-OS Architecture Audit

## 1. Executive Summary

The SV-OS architecture has a strong conceptual foundation and a clear product identity, but it is not yet fully consistent enough to be certified as implementation-ready. The system is well described at a high level, but the architecture set currently contains overlapping terminology, conflicting structural assumptions, partially defined contracts, and unresolved cross-cutting concerns.

The architecture is strongest where it defines the product intent: graph-first thinking, engine-centric business logic, explicit state, validation-before-mutation, and capability-oriented APIs. The architecture is weakest where it lacks a single canonical definition for implementation boundaries, plugin behavior, event contracts, dependency rules, and module ownership.

## 2. Overall Architecture Score

Score: 72/100

## 3. Strengths

- The product vision is coherent and distinctive: a graph-driven knowledge operating system rather than a generic CRUD application.
- The core architectural direction is consistent around the knowledge graph as the source of truth.
- Engine-centric decomposition is a strong fit for the system’s domain complexity.
- Validation-before-mutation is a solid architectural safeguard.
- The architecture explicitly favors deterministic behavior and explainable workflows.
- The monorepo structure and separation between frontend, backend, shared packages, and data assets are generally sound.

## 4. Weaknesses

- The architecture is spread across multiple documents with different levels of detail and different structural assumptions.
- The backend architecture documents are not aligned on the primary architectural style; one uses a service-repository pattern while others use engine-capability layering.
- The engine catalog contains drift: some documents introduce engines or subsystems that are not consistently adopted elsewhere.
- The event model exists conceptually but is not fully canonicalized into one consistent contract model.
- The plugin system is mentioned but not fully specified as a first-class architecture component.
- The domain model is not fully consolidated into one authoritative set of entities, value objects, and lifecycle rules.
- The API contract model is partially capability-driven but still lacks one authoritative canonical contract catalog.
- The dependency model is directionally correct but not fully formalized, especially around write-path coordination and startup/shutdown sequencing.
- The architecture lacks a single authoritative implementation boundary for telemetry, caching, auth, and background processing.

## 5. Conflicts

### 5.1 Terminology and Scope Conflicts

- The architecture uses both “Learning Path Engine” and “Roadmap” as if they were distinct architectural units, but the meaning overlaps.
- “Project Engine” appears in some documents as a first-class engine, but the broader architecture treats projects as domain concepts rather than core engine responsibilities.
- “Analytics” and “Learning Analytics” appear in some documents, but they are not consistently adopted as part of the canonical implementation scope.
- “Revision Engine” appears in the more expansive architecture description but is not consistently carried into the later planning and implementation documents.

### 5.2 Structural Conflicts

- The backend architecture documentation uses a service-repository pattern with layers such as routes, services, repositories, and models.
- The engineering and implementation specifications use an engine-capability pattern with modules such as capabilities, engines, domain, persistence, infrastructure, and events.
- These are not merely different naming choices; they represent different architectural foundations.

### 5.3 Dependency and Communication Conflicts

- The architecture principle says engines should communicate through events for write operations.
- Some later dependency and communication documents still describe synchronous engine-to-engine calls in operational flows.
- This creates an architectural contradiction that must be resolved before implementation begins.

### 5.4 Repository Structure Conflicts

- The architecture documents propose a more structured backend layout with capabilities, engines, domain, persistence, events, and infrastructure.
- The present workspace already contains a more conventional layout with core, services, repositories, models, and middleware.
- That means the architecture is not yet fully reconciled with the repository as it exists today.

## 6. Missing Components

The following components are not fully defined as canonical architecture elements:

- A single canonical plugin interface contract
- A single canonical event contract catalog
- A single canonical domain object catalog
- A single canonical DTO catalog for backend and frontend
- A single canonical capability contract catalog
- A single canonical repository contract set for all engines
- A single canonical caching interface contract
- A single canonical telemetry contract for health, metrics, tracing, and diagnostics
- A single canonical authentication and authorization boundary
- A single canonical lifecycle contract for startup, initialization, shutdown, and health probes
- A single canonical testing strategy mapped to the engine and capability architecture
- A single canonical import pipeline contract covering dry-run, commit, rollback, and progress reporting

## 7. Duplicate Components

The following concepts appear in duplicate or overlapping forms:

- Roadmap capability versus learning path engine versus project roadmap concept
- Project Engine versus project domain concept
- Analytics capability versus learning analytics subsystem
- Export capability versus import/export pipeline concepts
- Validation rules and import validation responsibilities overlap across multiple documents
- Event concepts appear in multiple forms without one authoritative schema
- The repository structure contains overlapping names such as services, repositories, and capabilities without a single ownership map

## 8. Dependency Issues

### 8.1 Engine Dependencies

The engine dependencies are directionally sensible, but they are not yet fully canonicalized. The architecture should clearly distinguish between:

- read-only dependencies, which may be direct
- write-path dependencies, which must flow through the event model

### 8.2 Capability Dependencies

Capability dependencies are implied but not fully formalized. The architecture should define which capabilities may orchestrate which engines and which capability responses are allowed to depend on other capability responses.

### 8.3 Package Dependencies

Package dependencies are broadly reasonable, but the architecture should make explicit that:

- packages/types should hold shared contracts
- packages/config should hold environment and feature configuration only
- packages/ui should remain free of domain logic
- application packages should not depend on UI packages for business logic

### 8.4 Module Dependencies

The module dependency direction is conceptually sound, but it is not fully enforced by the architecture set. The key rule should be:

- API layer depends on capabilities
- Capabilities depend on engines and domain services
- Engines depend on domain models and infrastructure adapters
- Domain layer should not depend on infrastructure or persistence directly

### 8.5 Import Order, Initialization, Startup, and Shutdown

These are not fully specified as canonical sequence rules. The architecture needs a single, authoritative ordering model for:

- module import order
- engine initialization order
- startup sequence
- shutdown sequence
- background worker startup and cleanup

### 8.6 Circular Dependency Risk

The main circular dependency risk is not the graph model itself, but the inconsistent use of direct engine-to-engine calls for write flows. That should be eliminated in favor of event-driven coordination.

## 9. Recommended Fixes

The following fixes are necessary before implementation begins:

1. Select one canonical backend architectural style and keep it consistent throughout the architecture set.
2. Adopt one canonical engine catalog and remove or clearly demote overlapping engines and capabilities.
3. Define one canonical event contract model with event topics, payload shape, correlation identifiers, and delivery semantics.
4. Define one canonical capability contract catalog and keep it separate from engine implementation details.
5. Define one canonical domain model catalog covering nodes, edges, content, learner state, validation reports, import jobs, and events.
6. Define one canonical repository and persistence boundary for each engine.
7. Define one canonical plugin contract if plugin extensibility is part of the implementation target.
8. Define one canonical dependency rule set covering read-only vs write-path dependencies, import order, startup order, and shutdown order.
9. Define one canonical testing strategy for engines, capabilities, APIs, and frontend modules.
10. Define one canonical operational model for telemetry, logging, tracing, caching, and health monitoring.

These are not redesign steps; they are clarification and consolidation steps required to make the architecture implementation-ready.

## 10. Canonical Architecture Decisions

### 10.1 Repository Structure

The canonical repository structure is the monorepo structure defined by the engineering blueprint and implementation specification:

- apps/api for backend runtime
- apps/web for frontend runtime
- packages/ui, packages/types, packages/config, packages/eslint-config, packages/tsconfig for shared concerns
- database for migrations, schema, seeds, and scripts
- docs and scripts for supporting material and developer tooling

### 10.2 Folder Structure

The canonical backend folder structure is:

- apps/api/app/api for API routing and request parsing
- apps/api/app/capabilities for orchestration workflows
- apps/api/app/engines for engine implementations
- apps/api/app/domain for domain models and policies
- apps/api/app/persistence for repositories and persistence adapters
- apps/api/app/events for event contracts and handlers
- apps/api/app/infrastructure for cross-cutting services
- apps/api/app/config, app/utils, app/middleware, app/startup, app/telemetry, app/exceptions

The canonical frontend folder structure is:

- apps/web/src/app for route entry points
- apps/web/src/features for feature compositions
- apps/web/src/components for reusable UI building blocks
- apps/web/src/hooks, providers, stores, services, lib, types, utils

### 10.3 Engine Architecture

The canonical engine set should be:

- Graph Engine
- Knowledge Engine
- Traversal Engine
- Event Engine
- State Engine
- Dependency Engine
- Validation Engine
- Search Engine
- Recommendation Engine
- Learning Path Engine
- Career Engine
- Assessment Engine
- Import Engine
- Simulator Engine

The following concepts should not be treated as first-class core engines unless a separate decision explicitly reintroduces them:

- Project Engine
- Roadmap Engine
- Export Engine
- Analytics Engine

These should be treated as capabilities, domain concepts, or future extensions rather than core architecture engines.

### 10.4 Domain Model

The canonical domain model should include:

- Knowledge nodes and edges
- Content blocks and metadata
- Learner state and progression
- Validation issues and reports
- Assessment submissions and outcomes
- Import jobs and rollback artifacts
- Domain events

### 10.5 Event Model

The canonical event model should be event-driven, with a single event backbone and event payloads that include at least:

- event identifier
- topic
- payload
- occurred-at timestamp
- correlation identifier

### 10.6 API Contracts

The canonical API model should be capability-based rather than CRUD-based. The system should expose stable capability endpoints for:

- graph access
- learner state and readiness
- recommendations
- roadmaps
- career comparison
- search
- assessment submission
- import workflows

### 10.7 Capability Contracts

Capabilities should remain thin orchestrators over engines and should not contain business logic directly. Their outputs should be stable contract objects consumed by APIs and frontend services.

### 10.8 Plugin System

The canonical plugin system should be treated as an optional extension layer, not as part of the core implementation contract until it is formally specified. If used, it should be manifest-driven, versioned, and isolated from the core engine interfaces.

### 10.9 Database Mapping

The canonical persistence model should remain PostgreSQL-backed and should map the graph, learner state, content, import job state, and event history into stable relational structures with clear ownership boundaries.

### 10.10 Import Pipeline

The canonical import pipeline should include:

- import request intake
- validation
- dry-run support
- commit or rollback support
- progress reporting
- event publication

### 10.11 Graph Model

The canonical graph model is a relational, versioned graph representation centered on nodes, edges, and content, with traversal and validation derived from that graph.

### 10.12 State Model

The canonical state model should be explicit and should cover learner readiness, confidence, progression, and revision needs rather than a simplistic completed/incomplete state set.

### 10.13 Recommendation System

The canonical recommendation system should be deterministic, explainable, and derived from graph context, learner state, and dependency readiness.

### 10.14 Validation System

The canonical validation system should be mandatory for every mutation path and should produce reports that are shared by both graph mutations and import workflows.

## 11. Readiness Percentage

Estimated readiness for implementation: 61%

## 12. Final Verdict

SV-OS REQUIRES THE FOLLOWING CHANGES BEFORE IMPLEMENTATION

The architecture has a strong conceptual base, but it is not yet fully consolidated enough to be considered implementation-certified. The system should not proceed into implementation until the canonical boundaries, contracts, event model, dependency rules, and module ownership are unified across the architecture set.
