#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> typecheck 全部包"
pnpm -r --no-bail typecheck

echo "==> CLI 冒烟"
pnpm --filter @tda/cli dev "/help"

echo "✅ all green"
