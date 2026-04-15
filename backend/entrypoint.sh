#!/bin/sh
set -e

echo "🔧 Running database migrations..."
export PYTHONPATH=$PYTHONPATH:/app

# Stamp the current migration revision if alembic_version table doesn't exist yet
# This prevents DuplicateTableError when the DB already has tables from a previous run
alembic -c /app/backend/alembic.ini stamp head 2>/dev/null || true

# Run migrations (will be a no-op if already at head)
alembic -c /app/backend/alembic.ini upgrade head

echo "🚀 Starting Venom Backend API..."
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
