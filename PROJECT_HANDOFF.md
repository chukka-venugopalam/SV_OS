# SV-OS — Project Handoff

> **Purpose**: Official handoff document for future AI assistants.
> **Date**: July 25, 2026 | **Version**: 1.0
> **For AI agents**: Read PROJECT_MEMORY.md first, then this file for operational details.

---

## 1. Repository Overview

**URL**: `https://github.com/chukka-venugopalam/SV_OS`
**Branch**: `main`
**Current commit**: `234d65b`
**Current tag**: Not tagged (use `HEAD`)

### Folder Map

| Path                 | What it is          | AI should care about                   |
| -------------------- | ------------------- | -------------------------------------- |
| `apps/api/`          | FastAPI backend     | Core business logic, engines, services |
| `apps/web/`          | Next.js 15 frontend | UI, routes, providers                  |
| `packages/ui/`       | Design system       | Shared React components                |
| `packages/types/`    | TypeScript types    | Shared interfaces                      |
| `packages/config/`   | Shared config       | Constants, env helpers                 |
| `database/`          | SQL schema + seeds  | Schema reference, seed data            |
| `docs/`              | Documentation       | Architecture, guides, specs            |
| `.github/workflows/` | CI pipeline         | Quality gates                          |
| `docker-compose.yml` | Dev environment     | Local development setup                |

---

## 2. Development Workflow

### Running Locally

```bash
# 1. Database
docker compose up -d postgres

# 2. Backend
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload  # Starts at :8000

# 3. Frontend
cd apps/web
pnpm install
pnpm dev  # Starts at :3000
```

### Important Commands

```bash
# Backend lint + format
cd apps/api && ruff check . && ruff format --check .

# Backend type check
cd apps/api && mypy apps/api

# Backend tests (sync only, no DB)
cd apps/api && python -m pytest tests/services/test_knowledge_import.py -q -k "not async"

# Backend tests (all, requires PostgreSQL)
cd apps/api && python -m pytest tests/

# Frontend type check
cd apps/web && npx tsc --noEmit

# Frontend lint
cd apps/web && npx eslint .

# Frontend build
cd apps/web && npx next build

# Full CI (requires pnpm)
pnpm typecheck && pnpm lint && pnpm build
```

### Docker

```bash
# Build API image
docker build -f Dockerfile.api -t sv-os-api:ci .

# Build Web image
docker build -f Dockerfile.web -t sv-os-web:ci .

# Full environment
docker compose up --build
```

### Database Migration Commands

```bash
cd apps/api
alembic upgrade head          # Apply all pending migrations
alembic downgrade -1          # Rollback one migration
alembic history               # View migration history
alembic revision --autogenerate -m "description"  # Create new migration
```

---

## 3. Current Status

### What's Complete

- ✅ Full backend with FastAPI, 22 engines, 19+ repositories, 23 services
- ✅ Full frontend with 26 routes, 7 providers, design system
- ✅ PostgreSQL 16 with 22 tables, adjacency list graph model
- ✅ JWT authentication (custom)
- ✅ Knowledge import pipeline (40 nodes live)
- ✅ 40-node reference dataset imported
- ✅ Cycle detection (Kahn's algorithm) on all imports
- ✅ CI pipeline (Ruff 0 errors, mypy 0 errors, tsc 0 errors, tests pass)
- ✅ Docker compose (dev + prod)
- ✅ All Stage 5.2 engines (Query, Traversal, Recommendation, Career, etc.)

### What's Incomplete

| Item                            | Status                               | Why It Matters                                                      |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| **181-node full graph import**  | ⚠️ Designed, validated, NOT imported | `stage5_2_import_refactored.json` (130KB) is ready — run the import |
| **Content layer (Stage 5.3)**   | 📋 Blueprint done                    | No flashcards, glossary, or simulators exist yet                    |
| **Learning resources**          | ⚠️ Sparse                            | Only 6 of 221 nodes have real resources                             |
| **Simulators**                  | ⚠️ 20 designed, 0 built              | No interactive learning tools yet                                   |
| **Render PostgreSQL migration** | ⚠️ Render free tier ending           | Need to migrate to Neon or Supabase                                 |

---

## 4. How to Safely Continue

### Golden Rules (NEVER break these)

1. **`unlocks` is ALWAYS derived, never stored.** If you see a column or field named `unlocks` anywhere, flag it as a bug — it must be removed. Unlocks are computed by reversing `knowledge_edges` where `relationship_type='prerequisite'`.

2. **The graph is a DAG.** The import pipeline rejects cyclic graphs using Kahn's algorithm. Never accept input that bypasses cycle detection. Never add edges that create cycles without going through cycle detection.

3. **Never rewrite existing models.** Extend them. The `KnowledgeNode` model has ~22 fields and 10 relationships. Adding a field is fine; renaming or removing breaks every downstream consumer.

4. **Never rename API endpoints.** The frontend depends on them. If you must change a route, add the new one first, update the frontend, then deprecate and remove the old one.

5. **Clean Architecture layers are strict.** Services → Repositories. Engines → Repositories. API Endpoints → Services. Never bypass a layer.

### Common Mistakes to Avoid

| Mistake                          | Why It's Bad                                         | Correct Approach                                    |
| -------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| Adding `unlocks` column          | Creates data drift that silently corrupts navigation | Compute from edges at query time                    |
| Creating new graph DB (Neo4j)    | Maintains two inconsistent graphs                    | Use existing PostgreSQL adjacency list              |
| Adding AI-driven recommendations | Undermines deterministic explanation system          | Enhance existing priority rules, don't replace them |
| Skipping cycle detection         | Creates impossible learning paths                    | Always run Kahn's algorithm before writes           |
| Renaming model fields            | Breaks all queries, serializers, and tests           | Add new field, deprecate old one                    |

---

## 5. Current Blockers

1. **No production PostgreSQL provider** — Render free tier is ending. Migration needed before deployment.
2. **Stage 5.2 full graph not imported** — Blocking all content-layer work that references the 181 designed nodes.
3. **`categories` table doesn't exist** — Needed by the 181-node import. Must create the migration first.

---

## 6. Immediate Next Task

**Recommended next task**: Import the Stage 5.2 full graph (`stage5_2_import_refactored.json`) using the existing `KnowledgeImportService`:

```bash
# From the repo root:
cd apps/api
python -c "
import asyncio, json
from app.services.knowledge_import import _run_cli_import
asyncio.run(_run_cli_import('../../knowledge/imports/stage5_2_import_refactored.json'))
"
```

Expected: 181 nodes imported, 288 prerequisite edges created, 0 errors, 0 warnings.

**Before doing this**, verify:

1. The `categories` table exists (or create it)
2. The `content_status` column exists on `knowledge_nodes`
3. The DB connection string is correct

---

## 7. Long-Term Roadmap

```
Now → Import 181-node full graph (stage-5.2-full-graph-import)
Next → Phase 5.3A Foundation (categories, content tables, APIs)
Next → Phase 5.3B Content authoring (flashcards, glossary, etc.)
Next → Phase 5.3C Import & integrate content
Next → Phase 5.3D Intelligent services (similarity, search extensions)
Next → Simulator implementation (20 designed simulators)
Next → AI content embedding (run existing pipeline on new content)
Next → Performance optimization + monitoring
Next → Production deployment (new PostgreSQL provider)
```

---

## 8. Architecture TL;DR (for quick AI onboarding)

```
Request Flow:
  Browser → Next.js → API Client → FastAPI → Middleware (9 layers)
    → Router → Endpoint Handler → Service → Engine (optional)
    → UnitOfWork → Repository → SQLAlchemy → PostgreSQL

Engine Lifecycle:
  register() → initialize() → start() → health() → stop()

Data Flow:
  knowledge_nodes (vertices) + knowledge_edges (directed, typed edges)
    → GraphEngine (structural state)
    → TraversalEngine (BFS, DFS, shortest path, cycles)
    → QueryEngine (RPC query functions)
    → RecommendationEngine (8 priority rules)
    → LearningPathEngine (7 strategies)
    → CareerEngine (skill gap, progression, similarity)
```

---

_End of Project Handoff. Update this file when project status changes significantly._
