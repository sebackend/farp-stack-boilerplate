#!/bin/sh
set -e

echo "Applying migrations..."
alembic upgrade head

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${API_PORT:-3000}" --proxy-headers --no-access-log
