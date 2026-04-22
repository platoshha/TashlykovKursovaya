#!/bin/sh
set -e

DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "Applying migrations..."
alembic upgrade head

echo "Seeding reference data..."
python seed_data.py || true

echo "Starting backend..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
