#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

pnpm --filter @tda/reviewer dev &
R=$!
pnpm --filter @tda/investigator dev &
I=$!

cleanup() {
  kill $R $I 2>/dev/null || true
}
trap cleanup EXIT

for port in 4101 4102; do
  ok=0
  for i in $(seq 1 30); do
    if curl -sf "http://localhost:$port/.well-known/agent.json" >/dev/null 2>&1; then
      echo "✅ Agent on $port ready"
      ok=1
      break
    fi
    sleep 0.5
  done
  if [ $ok -eq 0 ]; then
    echo "❌ Agent on $port 未就绪"
    exit 1
  fi
done

pnpm --filter @tda/coordinator dev "$@"
