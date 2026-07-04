#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SV-OS — Full Project Setup Script
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "🚀 SV-OS Setup — Starting..."

# --- Check Prerequisites ---
echo ""
echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install via: npm install -g pnpm"; exit 1; }
command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1 || { echo "❌ Python 3.12+ is required."; exit 1; }
command -v psql >/dev/null 2>&1 || echo "⚠️  psql not found. Install PostgreSQL or use Docker."
command -v docker >/dev/null 2>&1 || echo "⚠️  Docker not found. Use local PostgreSQL instead."

echo "✅ All prerequisites checked."

# --- Database Setup ---
echo ""
echo "🗄️  Setting up database..."

if command -v docker >/dev/null 2>&1; then
  echo "Starting PostgreSQL via Docker..."
  docker compose up -d postgres
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 5
else
  echo "Using local PostgreSQL..."
  createdb svos 2>/dev/null || echo "Database 'svos' already exists."
  psql -d svos -f database/schema.sql
  bash scripts/seed.sh
fi

echo "✅ Database ready."

# --- Frontend Setup ---
echo ""
echo "🌐 Setting up frontend..."

pnpm install

if [ ! -f apps/web/.env.local ]; then
  cp apps/web/.env.local.example apps/web/.env.local
  echo "⚠️  Edit apps/web/.env.local with your Supabase credentials."
fi

echo "✅ Frontend dependencies installed."

# --- Backend Setup ---
echo ""
echo "⚙️  Setting up backend..."

cd apps/api

if [ ! -d .venv ]; then
  python -m venv .venv
fi

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  source .venv/Scripts/activate
else
  source .venv/bin/activate
fi

pip install -e ".[dev]"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Edit apps/api/.env with your database URL."
fi

cd "$PROJECT_DIR"

echo "✅ Backend dependencies installed."

# --- Completion ---
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ SV-OS Setup Complete!"
echo ""
echo "  📝 Edit environment files:"
echo "     apps/web/.env.local    — Supabase credentials"
echo "     apps/api/.env          — Database & Supabase credentials"
echo ""
echo "  🚀 Start development:"
echo "     Terminal 1: cd apps/api && uvicorn app.main:app --reload"
echo "     Terminal 2: pnpm dev:web"
echo ""
echo "  📖 Open:"
echo "     http://localhost:3000  — Frontend"
echo "     http://localhost:8000/docs — API Docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
