#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🚀 Running Context Engineering benchmark..."
pnpm --filter @tda/eval benchmark
