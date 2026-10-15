#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FAIL=0

echo "===== typecheck ====="
if pnpm -r --no-bail typecheck; then
  echo "✅ typecheck 全绿"
else
  echo "❌ typecheck 失败"
  FAIL=$((FAIL+1))
fi

echo ""
echo "===== test ====="
if pnpm -r --no-bail --if-present test; then
  echo "✅ test 全绿"
else
  echo "❌ test 失败"
  FAIL=$((FAIL+1))
fi

echo ""
echo "===== CLI 冒烟 ====="
if pnpm --filter @tda/cli dev "/help" >/dev/null 2>&1; then
  echo "✅ CLI 正常"
else
  echo "❌ CLI 异常"
  FAIL=$((FAIL+1))
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo "🎉 全部通过"
  exit 0
else
  echo "❌ 有 $FAIL 项失败"
  exit 1
fi
