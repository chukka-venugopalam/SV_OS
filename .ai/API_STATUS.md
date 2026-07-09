# API Status

## Infrastructure Endpoints (Phase 2.3 — Implemented)

| Endpoint              | Method | Auth | Purpose                                     | Status         | Tests           |
| --------------------- | ------ | ---- | ------------------------------------------- | -------------- | --------------- |
| /api/v1/              | GET    | No   | API metadata (name, version, docs)          | ✅ Implemented | ✅ Covered      |
| /api/v1/health        | GET    | No   | Unified health check with dependency status | ✅ Implemented | ✅ 6 assertions |
| /api/v1/health/live   | GET    | No   | Liveness probe (minimal)                    | ✅ Implemented | ✅ 2 assertions |
| /api/v1/health/ready  | GET    | No   | Readiness probe (checks database)           | ✅ Implemented | ✅ 2 assertions |
| /api/v1/health/checks | GET    | No   | Detailed health check results               | ✅ Implemented | ✅ 1 assertion  |
| /health               | GET    | No   | Legacy backward-compatible health           | ✅ Implemented | ✅ 2 assertions |
| /                     | GET    | No   | Legacy backward-compatible root             | ✅ Implemented | ✅ 1 assertion  |

## Business Endpoints (Phase 3 — Implemented)

### Auth (7 endpoints)

| Endpoint              | Method | Auth | Status |
| --------------------- | ------ | ---- | ------ |
| /auth/register        | POST   | No   | ✅     |
| /auth/login           | POST   | No   | ✅     |
| /auth/refresh         | POST   | No   | ✅     |
| /auth/me              | GET    | Yes  | ✅     |
| /auth/me              | PUT    | Yes  | ✅     |
| /auth/change-password | POST   | Yes  | ✅     |
| /auth/logout          | POST   | No   | ✅     |

### Nodes (8 endpoints)

| Endpoint                    | Method | Auth | Status |
| --------------------------- | ------ | ---- | ------ |
| /nodes                      | GET    | No   | ✅     |
| /nodes/search               | GET    | No   | ✅     |
| /nodes/popular              | GET    | No   | ✅     |
| /nodes/{slug}               | GET    | No   | ✅     |
| /nodes/{slug}/prerequisites | GET    | No   | ✅     |
| /nodes/{slug}/related       | GET    | No   | ✅     |
| /nodes/{slug}/resources     | GET    | No   | ✅     |
| /nodes/{slug}/careers       | GET    | No   | ✅     |

### Graph (4 endpoints)

| Endpoint                  | Method | Auth | Status |
| ------------------------- | ------ | ---- | ------ |
| /graph/explore            | GET    | No   | ✅     |
| /graph/path               | GET    | No   | ✅     |
| /graph/statistics         | GET    | No   | ✅     |
| /graph/prerequisite-chain | GET    | No   | ✅     |

### Careers (4 endpoints)

| Endpoint                | Method | Auth | Status |
| ----------------------- | ------ | ---- | ------ |
| /careers                | GET    | No   | ✅     |
| /careers/{slug}         | GET    | No   | ✅     |
| /careers/{slug}/roadmap | GET    | No   | ✅     |
| /careers/{slug}/nodes   | GET    | No   | ✅     |

### Projects (3 endpoints)

| Endpoint                      | Method | Auth | Status |
| ----------------------------- | ------ | ---- | ------ |
| /projects                     | GET    | No   | ✅     |
| /projects/{slug}              | GET    | No   | ✅     |
| /projects/{slug}/requirements | GET    | No   | ✅     |

### Skills (4 endpoints)

| Endpoint                         | Method | Auth | Status |
| -------------------------------- | ------ | ---- | ------ |
| /skills                          | GET    | No   | ✅     |
| /skills/categories               | GET    | No   | ✅     |
| /skills/{skill_id}               | GET    | No   | ✅     |
| /skills/{skill_id}/relationships | GET    | No   | ✅     |

### Learning Paths (2 endpoints)

| Endpoint                  | Method | Auth | Status |
| ------------------------- | ------ | ---- | ------ |
| /learning-paths           | GET    | No   | ✅     |
| /learning-paths/{path_id} | GET    | No   | ✅     |

### Progress (5 endpoints)

| Endpoint                     | Method | Auth | Status |
| ---------------------------- | ------ | ---- | ------ |
| /progress                    | GET    | Yes  | ✅     |
| /progress/stats              | GET    | Yes  | ✅     |
| /progress/{node_id}          | PUT    | Yes  | ✅     |
| /progress/{node_id}/start    | POST   | Yes  | ✅     |
| /progress/{node_id}/complete | POST   | Yes  | ✅     |

### Bookmarks (3 endpoints)

| Endpoint                   | Method | Auth | Status |
| -------------------------- | ------ | ---- | ------ |
| /bookmarks                 | GET    | Yes  | ✅     |
| /bookmarks/{node_id}       | POST   | Yes  | ✅     |
| /bookmarks/{node_id}/check | GET    | Yes  | ✅     |

### Favorites (4 endpoints)

| Endpoint                   | Method | Auth | Status |
| -------------------------- | ------ | ---- | ------ |
| /favorites                 | GET    | Yes  | ✅     |
| /favorites/{node_id}       | POST   | Yes  | ✅     |
| /favorites/{node_id}       | DELETE | Yes  | ✅     |
| /favorites/{node_id}/check | GET    | Yes  | ✅     |

### Search (5 endpoints)

| Endpoint            | Method | Auth | Status |
| ------------------- | ------ | ---- | ------ |
| /search             | GET    | No   | ✅     |
| /search/suggestions | GET    | No   | ✅     |
| /search/history     | GET    | Yes  | ✅     |
| /search/history     | DELETE | Yes  | ✅     |
| /search/trending    | GET    | No   | ✅     |

### Recommendations (3 endpoints)

| Endpoint                      | Method | Auth | Status |
| ----------------------------- | ------ | ---- | ------ |
| /recommendations              | GET    | Yes  | ✅     |
| /recommendations/popular      | GET    | No   | ✅     |
| /recommendations/{id}/dismiss | POST   | Yes  | ✅     |

**Total Endpoints: 55 (48 business + 7 infrastructure)**
**Implemented: 55 endpoints**
**Tested: 7 infrastructure + 29 auth service unit tests**

## Schema Contracts (Phase 2.6 — Complete)

### Complete API Contract Layer — 127 DTOs across 10 modules

| Module          | Files | DTOs | Purpose                                                   |
| --------------- | ----- | ---- | --------------------------------------------------------- |
| common/         | 4     | 13   | Pagination, errors, health, metadata                      |
| knowledge/      | 4     | 14   | Node cards, detail, search, dependencies, recommendations |
| graph/          | 5     | 11   | Nodes, edges, subgraph, paths, statistics                 |
| career/         | 4     | 12   | Cards, overview, roadmap, requirements, recommendations   |
| project/        | 3     | 8    | Cards, detail, requirements, outcomes, tech stack         |
| learning/       | 4     | 11   | Resources, paths, sessions, progress                      |
| user/           | 5     | 15   | Profile, bookmarks, favorites, history, dashboard         |
| search/         | 3     | 9    | Requests, results, highlights, suggestions, history       |
| skill/          | 2     | 9    | Summary, detail, relationships, graph                     |
| tag/            | 2     | 7    | Summary, detail, node-tag associations                    |
| recommendation/ | 2     | 5    | Summary, detail, dismiss, type counts                     |
| audit/          | 2     | 4    | Entries, detail, filters                                  |
| response.py     | 1     | 4    | APIResponse envelope, factory functions                   |

**Total: 32 files, 127 exported DTOs**
