#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# 彻底清理
echo "==> 清理端口"
lsof -ti :4101 | xargs kill -9 2>/dev/null || true
lsof -ti :4102 | xargs kill -9 2>/dev/null || true
pkill -f "tsx src/index.ts" 2>/dev/null || true
sleep 1

LOG_DIR=".logs"
rm -rf "$LOG_DIR"
mkdir -p "$LOG_DIR"

echo "==> 启动 reviewer"
pnpm --filter @tda/reviewer dev > "$LOG_DIR/reviewer.log" 2>&1 &
R=$!

echo "==> 启动 investigator"
pnpm --filter @tda/investigator dev > "$LOG_DIR/investigator.log" 2>&1 &
I=$!

cleanup() {
  echo "==> 清理"
  kill -9 $R $I 2>/dev/null || true
  lsof -ti :4101 | xargs kill -9 2>/dev/null || true
  lsof -ti :4102 | xargs kill -9 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 健康检查：不仅查端口，还查日志里有没有报错
for pair in "4101:reviewer" "4102:investigator"; do
  port="${pair%%:*}"
  name="${pair##*:}"
  ok=0
  for i in $(seq 1 30); do
    # 如果日志里出现了致命错误，立即失败
    if grep -q "缺少 OPENAI_API_KEY\|Error:" "$LOG_DIR/$name.log" 2>/dev/null; then
      echo "❌ $name 启动时出错"
      cat "$LOG_DIR/$name.log"
      exit 1
    fi
    if curl -sf "http://localhost:$port/.well-known/agent.json" >/dev/null 2>&1; then
      echo "✅ $name on $port ready"
      ok=1
      break
    fi
    sleep 0.5
  done
  if [ $ok -eq 0 ]; then
    echo "❌ $name 未就绪"
    cat "$LOG_DIR/$name.log" 2>/dev/null || true
    exit 1
  fi
done

echo "==> 启动 coordinator"
pnpm --filter @tda/coordinator dev "$@"

echo ""
echo "--- reviewer.log 尾部 ---"
tail -10 "$LOG_DIR/reviewer.log" || true
echo "--- investigator.log 尾部 ---"
tail -10 "$LOG_DIR/investigator.log" || true
