# Setup Guide

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Python** 3.12+ ([download](https://www.python.org/))
- **PostgreSQL** 16+ or **Docker** Desktop
- **Git** 2.40+

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/sv-os.git
cd sv-os
pnpm install
```

### 2. Backend Setup

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your database URL and Supabase credentials
```

### 3. Database

```bash
# Using Docker (recommended)
docker compose up -d postgres
```

### 4. Environment Files

```bash
cp apps/web/.env.local.example apps/web/.env.local
# Edit with your Supabase credentials
```

### 5. Run

```bash
# Terminal 1: Backend
cd apps/api && uvicorn app.main:app --reload

# Terminal 2: Frontend
pnpm dev:web
```

Open http://localhost:3000 for the frontend and http://localhost:8000/docs for the API docs.
