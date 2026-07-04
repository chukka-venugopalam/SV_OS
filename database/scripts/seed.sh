#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SV-OS — Database Seed Script
# Loads all seed data files in dependency order into the database.
# =============================================================================
# Usage:
#   ./database/scripts/seed.sh
#   DB_NAME=svos DB_USER=svos ./database/scripts/seed.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEEDS_DIR="$(dirname "$SCRIPT_DIR")/seeds"

DB_NAME="${DB_NAME:-svos}"
DB_USER="${DB_USER:-svos}"

echo "🌱 Seeding database '$DB_NAME'..."
echo ""

# Seed files are executed in sorted order (01_, 02_, ..., 09_)
# which respects dependency ordering for foreign keys.
for seed_file in "$SEEDS_DIR"/*.sql; do
    filename=$(basename "$seed_file")
    echo "  ⏳ Loading $filename..."
    psql -U "$DB_USER" -d "$DB_NAME" -f "$seed_file" > /dev/null
    echo "  ✅ $filename loaded."
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Seed complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Verification ──────────────────────────────────────────────────
echo "📊 Record counts:"
declare -A TABLES=(
    ["knowledge_nodes"]="Knowledge Nodes"
    ["knowledge_edges"]="Knowledge Edges"
    ["careers"]="Careers"
    ["projects"]="Projects"
    ["learning_resources"]="Learning Resources"
    ["skills"]="Skills"
    ["tags"]="Tags"
)

for table in "${!TABLES[@]}"; do
    count=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM $table" | tr -d ' ')
    printf "  %-25s %s\n" "${TABLES[$table]}:" "$count"
done
