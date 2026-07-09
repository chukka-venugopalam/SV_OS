# Architecture

## System Overview

SV-OS is a full-stack knowledge graph application following Clean Architecture principles.

```
Frontend (Next.js 15 + TypeScript)
    │  REST API calls via React Query
    ▼
Backend (FastAPI + Python 3.12)
    │  Clean Architecture layers
    ▼
PostgreSQL 16 (Adjacency List Graph Model)
```

## Repository Structure

```
sv-os/
├── apps/web/          — Next.js 15 (App Router)
├── apps/api/          — FastAPI (Clean Architecture)
├── packages/ui/       — Design system (shadcn/ui + Radix)
├── packages/types/    — Shared TypeScript types
├── packages/config/   — Shared constants
├── packages/eslint-config/ — Shared ESLint
├── packages/tsconfig/ — Shared TypeScript configs
├── database/          — Schema + seed data
└── docs/              — Project documentation
```

## Key Patterns

### Clean Architecture (Backend)

```
Routes (api/v1/) → Services → Repositories → Database
  ↑ HTTP layer    ↑ Business logic  ↑ Data access  ↑ PostgreSQL
```

### State Management (Frontend)

- **Server State**: TanStack React Query
- **Client State**: Zustand
- **Form State**: React Hook Form + Zod

### Graph Model

- **Pattern**: Adjacency list (relational, not Neo4j)
- **Traversal**: Recursive CTEs with depth limit of 10
- **Edge directions**: forward, bidirectional, unidirectional

### Response Format

Every API endpoint returns:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "errors": [],
  "timestamp": "2026-01-01T00:00:00Z",
  "request_id": "req_abc123"
}
```

## Deployment

| Component | Platform          |
| --------- | ----------------- |
| Frontend  | Vercel            |
| Backend   | Render / Docker   |
| Database  | Supabase / Docker |
| Auth      | Supabase Auth     |
