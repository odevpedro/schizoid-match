#!/bin/bash
# Run all pending SQL migrations against the database.
# Usage: ./run-migrations.sh [database_url]
# Usage: ./run-migrations.sh postgresql://user:pass@localhost:5432/wellmatch

set -euo pipefail

DB_URL="${1:-${DATABASE_URL:-postgresql://wellmatch:wellmatch@localhost:5432/wellmatch}}"
MIGRATIONS_DIR="$(dirname "$0")"
LOG_FILE="/tmp/wellmatch-migrations.log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "[migrations] Starting migration run at $(date)" | tee -a "$LOG_FILE"

for migration in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$migration" ] || continue
  base="$(basename "$migration")"
  case "$base" in
    run-migrations.sh|*.md) continue ;;
  esac

  echo "[migrations] Running $base..." | tee -a "$LOG_FILE"
  if psql "$DB_URL" -f "$migration" 2>&1 | tee -a "$LOG_FILE"; then
    echo "[migrations] ✓ $base completed" | tee -a "$LOG_FILE"
  else
    echo "[migrations] ✗ $base FAILED" | tee -a "$LOG_FILE"
    exit 1
  fi
done

echo "[migrations] All migrations completed at $(date)" | tee -a "$LOG_FILE"
