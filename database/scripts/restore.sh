#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SV-OS — Database Restore Script
# =============================================================================
# Usage:
#   ./database/scripts/restore.sh /path/to/backup.dump
# =============================================================================

if [ $# -eq 0 ]; then
    echo "❌ Error: No backup file specified."
    echo "Usage: ./database/scripts/restore.sh /path/to/backup.dump"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

DB_NAME="${DB_NAME:-svos}"
DB_USER="${DB_USER:-svos}"

echo "♻️  Restoring database '$DB_NAME' from '$BACKUP_FILE'..."
echo "⚠️  WARNING: This will replace the current database contents!"
read -p "Continue? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ Restore cancelled."
    exit 0
fi

# Drop and recreate the database
echo "🗑️  Dropping database..."
dropdb --if-exists -U "$DB_USER" "$DB_NAME"
echo "🏗️  Creating database..."
createdb -U "$DB_USER" "$DB_NAME"

# Restore from backup
echo "♻️  Restoring from backup..."
pg_restore -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --exit-on-error \
    "$BACKUP_FILE"

echo "✅ Restore complete!"
