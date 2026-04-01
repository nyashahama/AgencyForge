#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ $# -lt 1 ]; then
  echo "usage: scripts/migrate.sh <up|down|status>"
  exit 1
fi

goose -dir db/migrations postgres "${DATABASE_URL}" "$1"
