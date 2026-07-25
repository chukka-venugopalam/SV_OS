# SV-OS — Silicon Valley Learning OS

<div align="center">

**Google Maps for Computer Science Learning**

[![CI](https://github.com/sv-os/sv-os/actions/workflows/ci.yml/badge.svg)](https://github.com/sv-os/sv-os/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 Overview

SV-OS is an interactive visual operating system that maps Computer Science concepts, technologies, projects, and careers into an explorable **knowledge graph**. It answers four critical questions:

- **What** should I learn next?
- **Why** should I learn it?
- **What projects** use it?
- **Which careers** require it?

### Key Features

| Feature                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| 🗺️ **Knowledge Graph**   | Interactive graph visualization of 100+ connected CS concepts |
| 🧭 **Career Navigator**  | Personalized learning roadmaps for 9+ CS careers              |
| 📊 **Progress Tracking** | Track learning status across all concepts                     |
| 🔍 **Full-Text Search**  | Search across all nodes with ranked results                   |
| 🌙 **Dark Mode**         | Beautiful dark-first design system                            |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                     │
│  Next.js 15 · TypeScript · Tailwind · React Query       │
│  Zustand · Framer Motion · React Flow · shadcn/ui       │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (React Query)
┌────────────────────▼────────────────────────────────────┐
│                   Backend (Render)                       │
│  FastAPI · Python 3.12 · SQLAlchemy · Pydantic          │
│  Clean Architecture: Routes → Services → Repositories   │
└────────────────────┬────────────────────────────────────┘
                     │ Async Database
┌────────────────────▼────────────────────────────────────┐
│                Database (Supabase/Docker)                │
│  PostgreSQL 16 · Adjacency List Graph Model             │
│  Recursive CTEs · Full-Text Search · Row-Level Security │
└─────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
sv-os/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # FastAPI backend
├── packages/
│   ├── ui/           # Design system
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared constants
│   ├── eslint-config/# ESLint configuration
│   └── tsconfig/     # TypeScript configuration
├── database/         # PostgreSQL schema + seed data
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ · **pnpm** 9+ · **Python** 3.12+ · **PostgreSQL** 16+ (or Docker)

### 1. Install

```bash
git clone https://github.com/sv-os/sv-os.git
cd sv-os

# Frontend dependencies
pnpm install

# Backend (Python)
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cd ../..
```

### 2. Database

```bash
# Using Docker (recommended)
docker compose up -d postgres

# Or use local PostgreSQL
createdb svos
psql -d svos -f database/schema.sql
bash scripts/seed.sh
```

### 3. Configure

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# Edit both files with your credentials
```

### 4. Run

```bash
# Terminal 1: Backend API
cd apps/api && uvicorn app.main:app --reload

# Terminal 2: Frontend
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000) for the app and [http://localhost:8000/docs](http://localhost:8000/docs) for API docs.

---

## 🛠 Development

### Commands

| Command          | Description              |
| ---------------- | ------------------------ |
| `pnpm dev`       | Start all apps           |
| `pnpm build`     | Build all apps           |
| `pnpm lint`      | Lint all apps            |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test`      | Run all tests            |
| `pnpm format`    | Format all files         |

### Stack

| Layer        | Technology              | Purpose                          |
| ------------ | ----------------------- | -------------------------------- |
| Framework    | Next.js 15 (App Router) | React framework with SSR         |
| Styling      | Tailwind CSS v4         | Utility-first CSS                |
| UI           | shadcn/ui + Radix       | Accessible component primitives  |
| Server State | TanStack React Query    | API data caching & sync          |
| Client State | Zustand                 | UI state management              |
| Forms        | React Hook Form + Zod   | Typed form validation            |
| Graph        | React Flow              | Knowledge graph visualization    |
| Animation    | Framer Motion           | Micro-interactions & transitions |
| Backend      | FastAPI                 | Async Python REST API            |
| ORM          | SQLAlchemy 2.0 (async)  | Database access                  |
| Database     | PostgreSQL 16           | Primary data store               |
| Auth         | Supabase Auth           | Authentication & RLS             |

---

## 📚 Documentation

### Essential

| Document                              | Description                  |
| ------------------------------------- | ---------------------------- |
| [Project Memory](PROJECT_MEMORY.md)   | Permanent AI onboarding file |
| [Project Handoff](PROJECT_HANDOFF.md) | AI assistant handoff guide   |

### Architecture & Design

| Document                                                  | Description                  |
| --------------------------------------------------------- | ---------------------------- |
| [Architecture](docs/Architecture/ARCHITECTURE.md)         | System architecture overview |
| [Backend Blueprint](docs/Backend/BACKEND_BLUEPRINT.md)    | Backend stack & design       |
| [Frontend Blueprint](docs/Frontend/FRONTEND_BLUEPRINT.md) | Frontend stack & design      |
| [Database Blueprint](docs/Database/DATABASE_BLUEPRINT.md) | Database schema design       |
| [API Blueprint](docs/Architecture/API_BLUEPRINT.md)       | REST API specification       |

### Knowledge Engine

| Document                                                                     | Description                         |
| ---------------------------------------------------------------------------- | ----------------------------------- |
| [Master Context](docs/Knowledge/PHASE5_MASTER_CONTEXT.md)                    | Full knowledge engine specification |
| [Knowledge Graph Design](docs/Knowledge/KNOWLEDGE_GRAPH_DESIGN.md)           | Graph philosophy & schema           |
| [Stage 5.2 Query Engine](docs/Knowledge/STAGE_5_2_KNOWLEDGE_QUERY_ENGINE.md) | Query & navigation API docs         |
| [Stage 5.3 Blueprint](docs/Knowledge/STAGE_5_3_BLUEPRINT.md)                 | Content layer design                |
| [Search Architecture](docs/Knowledge/SEARCH_ARCHITECTURE.md)                 | Search system design                |
| [Recommendation Engine](docs/Knowledge/RECOMMENDATION_ENGINE.md)             | Recommendation system               |

### Learning System

| Document                                                      | Description                   |
| ------------------------------------------------------------- | ----------------------------- |
| [Learning Engine](docs/Learning/LEARNING_ENGINE.md)           | Full learning engine spec     |
| [Learning Philosophy](docs/Learning/LEARNING_PHILOSOPHY.md)   | Learning design philosophy    |
| [Cognitive Model](docs/Learning/COGNITIVE_MODEL.md)           | Cognitive science principles  |
| [Mastery Model](docs/Learning/MASTERY_MODEL.md)               | Mastery scoring & progression |
| [Journey Design](docs/Learning/JOURNEY_DESIGN.md)             | Learner journey design        |
| [Project Engine](docs/Learning/PROJECT_ENGINE.md)             | Project-based learning engine |
| [Simulation Framework](docs/Learning/SIMULATION_FRAMEWORK.md) | Simulation system design      |

### Infrastructure & Operations

| Document                                                      | Description                   |
| ------------------------------------------------------------- | ----------------------------- |
| [Database Schema](docs/Database/DATABASE.md)                  | Schema design & relationships |
| [DB Migration Plan](docs/Database/DATABASE_MIGRATION_PLAN.md) | Render to Neon migration      |
| [Deployment](docs/Deployment/DEPLOYMENT.md)                   | Production deployment guide   |
| [Security](docs/Security/SECURITY_GUIDE.md)                   | Security policies & auth      |
| [Testing Strategy](docs/Testing/TESTING_STRATEGY.md)          | Testing approach & coverage   |
| [Performance Guide](docs/Reference/PERFORMANCE_GUIDE.md)      | Performance optimization      |

### Reference

| Document                                                         | Description                      |
| ---------------------------------------------------------------- | -------------------------------- |
| [Engineering Standards](docs/Reference/ENGINEERING_STANDARDS.md) | Coding standards & conventions   |
| [Implementation Guide](docs/Reference/IMPLEMENTATION_GUIDE.md)   | Implementation guidelines        |
| [Tech Decisions](docs/Reference/TECH_DECISIONS.md)               | Technology decisions & rationale |
| [Product Evolution](docs/Reference/PRODUCT_EVOLUTION.md)         | Product roadmap & evolution      |
| [Cleanup Report](docs/Reference/DOCUMENTATION_CLEANUP_REPORT.md) | Documentation classification     |
| [Reorganization Report](docs/Reference/REORGANIZATION_REPORT.md) | Reorganization summary           |

### Guides

| Document                                       | Description             |
| ---------------------------------------------- | ----------------------- |
| [Contributing](docs/Guides/Contributing.md)    | Contribution guidelines |
| [Setup Guide](docs/Guides/SETUP.md)            | Local development setup |
| [Monorepo Guide](docs/Guides/MonorepoGuide.md) | Turborepo & pnpm usage  |
| [Runbook](docs/Guides/Runbook.md)              | Operational procedures  |

### Archive

Historical documents preserved in [docs/archive/](docs/archive/) — not needed for daily development.

---

## 🗺 Knowledge Graph

### Node Types

| Type       | Description               | Color     |
| ---------- | ------------------------- | --------- |
| Subject    | Academic discipline       | 🟣 Purple |
| Concept    | Core CS concept           | 🔵 Blue   |
| Technology | Language, framework, tool | 🟢 Green  |
| Tool       | Development tool          | 🟡 Amber  |
| Career     | Job role                  | 🔴 Red    |
| Project    | Real-world project        | 🩷 Pink   |

### Edge Types

`prerequisite` · `depends_on` · `uses` · `enables` · `part_of` · `related_to` · `leads_to` · `requires`

---

## 🤝 Contributing

See [Contributing Guide](docs/Guides/Contributing.md).

## 📄 License

MIT — See [LICENSE](LICENSE).
