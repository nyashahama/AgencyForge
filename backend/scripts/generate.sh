#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
cd db
sqlc generate
