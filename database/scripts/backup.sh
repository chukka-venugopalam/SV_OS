#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SV-OS — Database Backup Script
# =============================================================================
# Usage:
#   ./database/scripts/backup.sh                        # Default backup
#   ./database/scripts/backup.sh /path/to/backups       # Custom directory
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

DB_NAME="${DB_NAME:-svos}"
DB_USER="${DB_USER:-svos}"
BACKUP_DIR="${1:-$PROJECT_DIR/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/svos_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "🗄️  Backing up database '$DB_NAME'..."
echo "  Output: $BACKUP_FILE"

pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --format=custom \
    --verbose \
    --no-owner \
    --file="$BACKUP_FILE"

echo "✅ Backup complete: $BACKUP_FILE"
echo ""
echo "📦 Backup size:"
ls -lh "$BACKUP_FILE"

# Keep only the last 30 backups
find "$BACKUP_DIR" -name 'svos_*.dump' -mtime +30 -delete
