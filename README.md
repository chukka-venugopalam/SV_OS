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

| Feature | Description |
|---------|-------------|
| 🗺️ **Knowledge Graph** | Interactive graph visualization of 100+ connected CS concepts |
| 🧭 **Career Navigator** | Personalized learning roadmaps for 9+ CS careers |
| 📊 **Progress Tracking** | Track learning status across all concepts |
| 🔍 **Full-Text Search** | Search across all nodes with ranked results |
| 🌙 **Dark Mode** | Beautiful dark-first design system |

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

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm format` | Format all files |

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | React framework with SSR |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| UI | shadcn/ui + Radix | Accessible component primitives |
| Server State | TanStack React Query | API data caching & sync |
| Client State | Zustand | UI state management |
| Forms | React Hook Form + Zod | Typed form validation |
| Graph | React Flow | Knowledge graph visualization |
| Animation | Framer Motion | Micro-interactions & transitions |
| Backend | FastAPI | Async Python REST API |
| ORM | SQLAlchemy 2.0 (async) | Database access |
| Database | PostgreSQL 16 | Primary data store |
| Auth | Supabase Auth | Authentication & RLS |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/Architecture.md) | System architecture overview |
| [Development](docs/Development.md) | Development patterns & conventions |
| [Setup Guide](docs/Setup.md) | Local development setup |
| [Contributing](docs/Contributing.md) | Contribution guidelines |
| [Coding Standards](docs/CodingStandards.md) | Code style & conventions |
| [Folder Structure](docs/FolderStructure.md) | Complete directory tree |
| [Monorepo Guide](docs/MonorepoGuide.md) | Turborepo & pnpm usage |
| [Database](docs/DATABASE.md) | Schema design & relationships |
| [API](docs/API.md) | REST API reference |

---

## 🗺 Knowledge Graph

### Node Types

| Type | Description | Color |
|------|-------------|-------|
| Subject | Academic discipline | 🟣 Purple |
| Concept | Core CS concept | 🔵 Blue |
| Technology | Language, framework, tool | 🟢 Green |
| Tool | Development tool | 🟡 Amber |
| Career | Job role | 🔴 Red |
| Project | Real-world project | 🩷 Pink |

### Edge Types

`prerequisite` · `depends_on` · `uses` · `enables` · `part_of` · `related_to` · `leads_to` · `requires`

---

## 🤝 Contributing

See [Contributing Guide](docs/Contributing.md).

## 📄 License

MIT — See [LICENSE](LICENSE).
