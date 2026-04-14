#!/bin/sh

# Exit on error
set -e

echo "🔧 Running database migrations..."
# Run migrations from the backend directory
# Note: alembic.ini is in /app/backend/alembic.ini
cd /app/backend
alembic upgrade head

echo "🚀 Starting Venom Backend API..."
cd /app
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
