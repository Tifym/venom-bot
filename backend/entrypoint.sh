#!/bin/sh

# Exit on error
set -e

echo "🔧 Running database migrations..."
export PYTHONPATH=$PYTHONPATH:/app

# Run migrations using the config file in the backend directory
alembic -c /app/backend/alembic.ini upgrade head

echo "🚀 Starting Venom Backend API..."
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
