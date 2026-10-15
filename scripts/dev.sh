#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

pnpm --filter @tda/reviewer dev &
R=$!
pnpm --filter @tda/investigator dev &
I=$!
cleanup() { kill $R $I 2>/dev/null || true; }
trap cleanup EXIT

for port in 4101 4102; do
  for i in {1..30}; do
    if curl -sf "http://localhost:$port/.well-known/agent.json" >/dev/null 2>&1; then
      echo "✅ Agent on $port ready"
      break
    fi
    sleep 0.5
  done
done

pnpm --filter @tda/coordinator dev "$@"
