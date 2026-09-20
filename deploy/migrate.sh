#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

echo "Running migrations against ${DATABASE_URL%%@*}@..."
i=0
until goose -dir /migrations postgres "$DATABASE_URL" up; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "Migration failed after retries" >&2
    exit 1
  fi
  echo "Database not ready, retrying ($i)..."
  sleep 2
done

echo "Migrations complete."
