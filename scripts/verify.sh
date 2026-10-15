#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> typecheck"
pnpm -r typecheck

echo "==> CLI smoke"
pnpm --filter @tda/cli dev "/help"

echo "✅ all green"
