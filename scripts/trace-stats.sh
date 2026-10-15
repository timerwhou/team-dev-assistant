#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TRACE_FILE="${1:-$(ls -t .traces/*.jsonl 2>/dev/null | head -1)}"
[ -z "$TRACE_FILE" ] && { echo "❌ 无 trace 文件"; exit 1; }

node -e "
const fs = require('fs');
const lines = fs.readFileSync('$TRACE_FILE', 'utf8').trim().split('\n').filter(Boolean);
const events = lines.map(l => JSON.parse(l));
const llm = events.filter(e => e.kind === 'llm_call');
const runs = events.filter(e => e.kind === 'agent_run');

const totalPrompt = llm.reduce((s, e) => s + (e.promptTokens || 0), 0);
const totalCompletion = llm.reduce((s, e) => s + (e.completionTokens || 0), 0);
const totalCost = llm.reduce((s, e) => s + (e.costUSD || 0), 0);
const avgLatency = llm.length ? llm.reduce((s, e) => s + e.durationMs, 0) / llm.length : 0;

console.log('📊 Trace 统计：$TRACE_FILE');
console.log('   LLM 调用：', llm.length);
console.log('   Agent 运行：', runs.length);
console.log('   Prompt tokens：', totalPrompt);
console.log('   Completion tokens：', totalCompletion);
console.log('   总成本：\$' + totalCost.toFixed(6));
console.log('   平均延迟：', avgLatency.toFixed(0) + 'ms');
"
