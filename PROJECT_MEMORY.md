# SV-OS — Project Memory

> **Purpose**: Single-source-of-truth for every AI agent working on this project.
> **Last updated**: July 25, 2026 | **Version**: 1.0
> **Read this first**: Any AI entering this repository must read this file before making changes.

---

## 1. Project Overview

### Vision

Be the **Google Maps for Computer Science** — an interactive knowledge graph that maps every CS concept, technology, project, and career into an explorable, navigable graph. Learners don't follow a fixed curriculum; they navigate knowledge space adaptively based on where they are, where they want to go, and how they learn best.

### Mission

Turn isolated computer science topics into a connected, navigable knowledge ecosystem where every node knows its prerequisites, unlocks downstream content, connects to real projects, and maps to real careers.

### Learning Philosophy (5 tenets)

1. **Connected, not isolated** — No subject exists in isolation. Every concept connects to others.
2. **Journey, not course** — Learning is a journey through knowledge space, not a checklist of courses.
3. **Adaptive, not fixed** — The path changes based on learner velocity, confidence, and goals.
4. **Applied, not abstract** — Every concept has a project, simulator, or problem that makes it tangible.
5. **Contextual, not generic** — Why you need this knowledge is as important as the knowledge itself.

### Core Architecture

Clean Architecture with strict layering:

```
Frontend (Next.js 15) → REST API → Service Layer → Engine Layer → Repository Layer → PostgreSQL 16
```

### Knowledge Graph Philosophy

- **Adjacency list** stored in PostgreSQL (not Neo4j) — relational, not graph-native
- **DAG by construction** — the import pipeline rejects cyclic prerequisite graphs using Kahn's algorithm
- **Edges are typed** — prerequisite, depends_on, uses, enables, part_of, related_to, leads_to, requires
- **Unlocks is ALWAYS derived** — never stored. Computed by reversing prerequisite edges.
- **Traversal via recursive CTEs** — with depth limits to prevent runaway queries

### Engine System (22 engines)

Core: Event, Graph
Second-layer: Knowledge, Dependency, Traversal, Query, State, Recommendation, LearningPath, Assessment, Career, Versioning, Export, Scheduler, Revision, Analytics, Plugin, Validation, Import, Simulator, Search

Each engine has: `initialize → start → health → stop` lifecycle. Engines are registered in `PlatformContainer` with dependency declarations so the EngineRegistry validates the dependency graph at startup.

---

## 2. Repository Structure

```
sv-os/
├── apps/
│   ├── web/              # Next.js 15 (App Router, TypeScript, Tailwind)
│   │   ├── src/app/      # Pages & layouts (26 routes)
│   │   ├── src/components/# React components (auth, graph, layout, shared)
│   │   ├── src/hooks/    # Custom hooks
│   │   ├── src/lib/      # API client, validators, env
│   │   ├── src/providers/# Context providers (7 total)
│   │   ├── src/services/ # API service functions
│   │   └── src/stores/   # Zustand stores (ui, graph, learning, platform)
│   └── api/              # FastAPI (Clean Architecture, Python 3.12)
│       ├── app/
│       │   ├── api/v1/endpoints/   # 26 endpoint groups
│       │   ├── core/               # Config, database, logging
│       │   ├── engines/            # 22 engine files
│       │   ├── events/bus/         # EventBus
│       │   ├── exceptions/         # Error hierarchy
│       │   ├── infrastructure/     # Container, cache, registries, runtime
│       │   ├── middleware/         # 9 middleware layers
│       │   ├── models/             # SQLAlchemy ORM (22 models)
│       │   ├── repositories/       # 18+ repository classes
│       │   ├── schemas/            # Pydantic v2 schemas
│       │   └── services/           # Business logic (23 services)
│       ├── alembic/                # Migrations
│       └── tests/                  # pytest tests
├── packages/
│   ├── ui/               # shadcn/ui + Radix components
│   ├── types/            # Shared TypeScript interfaces
│   ├── config/           # Shared constants
│   ├── eslint-config/    # ESLint presets
│   └── tsconfig/         # TypeScript config presets
├── database/
│   ├── schema.sql        # Canonical schema
│   ├── seeds/            # Seed data SQL
│   └── scripts/          # Backup, restore, seed, reset
├── docs/                 # Documentation
└── .github/workflows/    # CI pipeline
```

---

## 3. Current Progress

### Completed Phases

| Phase                     | Status         | Contents                                                          |
| ------------------------- | -------------- | ----------------------------------------------------------------- |
| Phase 1: Foundation       | ✅ Complete    | Monorepo setup, Next.js 15, FastAPI, PostgreSQL, Docker           |
| Phase 2: Core Features    | ✅ Complete    | Auth (JWT), Graph CRUD, Search, User system, Engine architecture  |
| Phase 3: Learning System  | ✅ Complete    | Learning paths, Progress tracking, Recommendations                |
| Phase 4: Knowledge System | ✅ Complete    | Knowledge import pipeline (40 nodes live), Cycle detection        |
| Phase 5: Knowledge Engine | 🟡 In Progress | Stage 5.1 (done), Stage 5.2 engines (done), Stage 5.3 (blueprint) |

### Completed Features

- ✅ 26 API endpoint groups fully implemented
- ✅ 22 engines registered and operational
- ✅ 19+ repositories with UnitOfWork pattern
- ✅ JWT authentication (custom, not Supabase Auth)
- ✅ PostgreSQL 16 with adjacency list graph model
- ✅ Full-text search (TSVECTOR) + SearchEngine (in-memory)
- ✅ Knowledge import pipeline (40-node dataset live)
- ✅ Cycle detection (Kahn's algorithm)
- ✅ Docker compose (dev + prod)
- ✅ CI pipeline (Ruff, mypy, pytest, TypeScript, Docker builds)
- ✅ 40 core CS nodes with 288 prerequisite edges designed
- ✅ 12 careers designed, 9 seeded
- ✅ 9 real projects
- ✅ Query, Traversal, Recommendation, LearningPath, Career engines

### Not Yet Started / Incomplete

- ❌ Stage 5.2 full graph import (181 nodes, designed but not imported)
- ❌ Stage 5.3 content layer (flashcards, glossary, simulators — blueprint done)
- ❌ Simulator implementation (20 designed, 0 built)
- ❌ Learning resources expansion (only 6 of 221 nodes have real resources)
- ❌ Frontend graph visualization polish
- ❌ AI content embedding (infrastructure exists, no content to embed)

---

## 4. Current Tech Stack

| Layer               | Technology                    | Version         | Purpose                          |
| ------------------- | ----------------------------- | --------------- | -------------------------------- |
| Frontend            | Next.js                       | 15 (App Router) | React framework with SSR         |
| Styling             | Tailwind CSS                  | v4              | Utility-first CSS                |
| UI                  | shadcn/ui + Radix             | latest          | Accessible component primitives  |
| Server State        | TanStack React Query          | latest          | API data caching & sync          |
| Client State        | Zustand                       | latest          | UI state management              |
| Forms               | React Hook Form + Zod         | latest          | Typed form validation            |
| Graph Visualization | React Flow                    | latest          | Knowledge graph visualization    |
| Animation           | Framer Motion                 | latest          | Micro-interactions & transitions |
| Backend             | FastAPI                       | 0.115           | Async Python REST API            |
| ORM                 | SQLAlchemy                    | 2.0 (async)     | Database access                  |
| Database            | PostgreSQL                    | 16              | Primary data store               |
| Auth                | Custom JWT                    | —               | Access + refresh token pattern   |
| Migrations          | Alembic                       | latest          | Schema migrations                |
| Validation          | Pydantic                      | v2              | Request/response validation      |
| Caching             | Custom CacheBackend           | —               | In-memory + Redis-ready          |
| Search              | PostgreSQL FTS + SearchEngine | —               | Hybrid search                    |
| AI Providers        | OpenAI / Gemini / Ollama      | —               | Phase 2.4 (built, idle)          |
| Embedding           | Phase 2.4                     | —               | Vector search infrastructure     |
| RAG                 | Phase 2.4                     | —               | RAG pipeline exists              |
| Deployment          | Docker Compose                | —               | Dev + Production                 |
| CI                  | GitHub Actions                | —               | Ruff, mypy, pytest, tsc, Docker  |
| Package Manager     | pnpm                          | 9+              | Monorepo management              |
| Build System        | Turborepo                     | latest          | Build orchestration              |
| Linting             | Ruff (Python) + ESLint (TS)   | latest          | Code quality                     |
| Type Checking       | mypy (Python) + tsc (TS)      | latest          | Static type analysis             |

---

## 5. Coding Standards

### Naming Conventions

- **Python**: `snake_case` for functions/variables, `PascalCase` for classes/models
- **TypeScript**: `camelCase` for functions/variables, `PascalCase` for components/types
- **Files**: `snake_case.py`, `kebab-case.tsx`
- **API routes**: `kebab-case` (e.g., `/knowledge/node/{slug}`)
- **Database columns**: `snake_case`
- **JSON fields**: `snake_case`

### Architecture Rules (Clean Architecture)

1. **Services** import repositories, never ORM models
2. **Engines** never access persistence directly — use repository interfaces
3. **API endpoints** never call repositories directly — go through services
4. **All DB access** through UnitOfWork pattern
5. **No circular imports** between services, repositories, or engines
6. **Pydantic** validates at the boundary — schemas are not models

### Testing Standards

- **Backend**: pytest with async fixtures, repository tests use real DB sessions
- **Frontend**: Vitest with React Testing Library
- **Coverage target**: 80%+ for services, 90%+ for utilities
- **Tests required** for: repositories, services, API endpoints, utilities

### Error Handling

- Exceptions in `app/exceptions/` — typed error hierarchy
- API responses use unified envelope: `{ success, message, data, errors, timestamp, request_id }`
- Repositories raise `EntityNotFoundError` for missing entities
- Services raise domain-specific errors

### Logging

- `structlog` for structured logging (Python)
- `console.log` only in development (frontend)
- Correlation IDs on every request

### Validation

- **Schema validation**: Pydantic v2 at API boundary
- **Business validation**: Service layer
- **Graph validation**: Kahn's algorithm for cycle detection
- **Referential integrity**: Import pipeline validates all cross-references

---

## 6. Important Design Decisions

### Why unlocks is computed, never stored

`unlocks` is the inverse of `prerequisites`. If stored independently, editing a prerequisite edge would silently drift the `unlocks` data. Computing it from `knowledge_edges` (filtered by `relationship_type='prerequisite'`) guarantees consistency regardless of how edges are modified. This was enforced in the Stage 5.1 import and must never be violated.

### Why the graph is a DAG

The knowledge graph is a Directed Acyclic Graph by construction. The import pipeline runs Kahn's algorithm (topological sort) before any write commits. A cyclic prerequisite graph is rejected — no partial imports. This makes "longest path" tractable (one pass over topological order) and guarantees the learning path can always be computed.

### Why recommendations are deterministic, not AI-based

The `RecommendationEngine` uses 8 priority-based rules (urgent review → reinforce weak → continue streak → career requirement → unlock max → highest dependency → shortest time → easiest first). No scores, weights, ML, or AI. Each recommendation includes a human-readable reason. AI enhances the engine later (content generation, alternative explanations) but never drives the core recommendation logic.

### Why graph traversal engines exist separately

GraphEngine handles structural state (nodes, edges, adjacency). TraversalEngine handles algorithms (BFS, DFS, shortest path, cycles). QueryEngine provides RPC-style query functions combining both. This separation follows Single Responsibility and allows independent testing and optimization.

### Why learning paths are graph-driven, not hardcoded

Learning paths are computed by traversing the knowledge graph from start node to goal node using the prerequisite edge structure. There are no hardcoded curricula. Path strategies (fastest, complete, project-first, theory-first, exam-focused) are different traversal algorithms over the same graph, not separate datasets.

### Why projects connect concepts (not standalone)

Projects in SV-OS are explicitly linked to knowledge nodes they require. This means the system can answer "what projects teach this concept?" and "what concepts do I need to start this project?" — enabling project-first learning paths.

---

## 7. Known Issues

1. **Stage 5.2 full graph NOT imported** — 181 nodes designed and validated but not in the live database. The file `stage5_2_import_refactored.json` is ready to import. Run the import pipeline to land it.
2. **Learning goals table migration** — The `LearningGoal` model and repository exist but the migration may not have been applied. Verify with `alembic history`.
3. **`categories` table missing** — The refactored 40-domain taxonomy was designed but no `categories` table exists in the DB. Needed by the 181-node import which uses `domain_id` FKs.
4. **Async tests require PostgreSQL** — 3 test cases in `test_knowledge_import.py` need a running database. They're deselected in CI-equivalent local runs.
5. **Render PostgreSQL discontinuing free tier** — Migration to Neon or Supabase needed (see `docs/DATABASE_MIGRATION_PLAN.md` if it exists).
6. **Next.js build fails on Windows** — EPERM symlink errors in `.next/standalone`. This is a Windows-only issue and does not affect CI (Ubuntu).

---

## 8. Phase Roadmap

### Phase 1: Foundation ✅

Monorepo, Next.js + FastAPI + PostgreSQL, Docker, CI/CD

### Phase 2: Core Features ✅

Auth, Graph CRUD, Search, Users, Engines

### Phase 3: Learning System ✅

Learning paths, Progress, Recommendations

### Phase 4: Knowledge System ✅

Import pipeline, Cycle detection, 40-node import

### Phase 5: Knowledge Engine 🟡 In Progress

| Sub-stage                               | Status                    |
| --------------------------------------- | ------------------------- |
| 5.1 — 40-node reference import          | ✅ Complete               |
| 5.2 — Query & Navigation engines        | ✅ Complete (22 engines)  |
| 5.2 — Full 181-node graph import        | ⚠️ Designed, not imported |
| 5.3 — Content layer (flashcards, etc.)  | 📋 Blueprint designed     |
| 5.4 — AI content embedding              | 🔲 Not started            |
| 5.5 — Simulators, Practice, Assessments | 🔲 Not started            |

### Phase 6: Production Readiness 🔲

Performance optimization, monitoring, load testing

### Phase 7: Mobile & Extensions 🔲

Mobile app, API marketplace, third-party integrations

---

_End of Project Memory. Keep this file updated as the project evolves._
