#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SV-OS — Database Seed Script
# Loads seed data files in order into the svos database.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SEEDS_DIR="$PROJECT_DIR/database/seeds"

DB_NAME="${DB_NAME:-svos}"
DB_USER="${DB_USER:-svos}"

echo "🌱 Seeding database '$DB_NAME'..."

for seed_file in "$SEEDS_DIR"/*.sql; do
  filename=$(basename "$seed_file")
  echo "  Loading $filename..."
  psql -U "$DB_USER" -d "$DB_NAME" -f "$seed_file"
done

echo "✅ Seed complete."

# Verify
echo ""
echo "📊 Verification:"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'knowledge_nodes' as table_name, count(*) from knowledge_nodes"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'knowledge_edges' as table_name, count(*) from knowledge_edges"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'careers' as table_name, count(*) from careers"
psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'projects' as table_name, count(*) from projects"
