#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SV-OS — Database Reset Script
# Drops and recreates the database, then runs all migrations and seeds.
# =============================================================================
# Usage:
#   ./database/scripts/reset.sh                          # Uses env vars
#   DB_NAME=svos DB_USER=svos ./database/scripts/reset.sh  # Override defaults
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

DB_NAME="${DB_NAME:-svos}"
DB_USER="${DB_USER:-svos}"

echo "🗑️  Dropping database '$DB_NAME'..."
dropdb --if-exists -U "$DB_USER" "$DB_NAME"

echo "🏗️  Creating database '$DB_NAME'..."
createdb -U "$DB_USER" "$DB_NAME"

echo "📦 Running Alembic migrations..."
cd "$PROJECT_DIR/../apps/api"
.venv/Scripts/python -m alembic upgrade head

echo "🌱 Seeding database..."
cd "$PROJECT_DIR"
for seed_file in "$PROJECT_DIR"/seeds/*.sql; do
    filename=$(basename "$seed_file")
    echo "  Loading $filename..."
    psql -U "$DB_USER" -d "$DB_NAME" -f "$seed_file"
done

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📊 Verification:"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'knowledge_nodes' as table_name, count(*) from knowledge_nodes"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'knowledge_edges' as table_name, count(*) from knowledge_edges"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'skills' as table_name, count(*) from skills"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'tags' as table_name, count(*) from tags"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'careers' as table_name, count(*) from careers"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'projects' as table_name, count(*) from projects"
