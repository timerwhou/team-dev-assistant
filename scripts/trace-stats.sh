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
const ctxBuilds = events.filter(e => e.kind === 'context_build');

const totalPrompt = llm.reduce((s, e) => s + (e.promptTokens || 0), 0);
const totalCompletion = llm.reduce((s, e) => s + (e.completionTokens || 0), 0);
const totalCost = llm.reduce((s, e) => s + (e.costUSD || 0), 0);
const avgLatency = llm.length ? llm.reduce((s, e) => s + e.durationMs, 0) / llm.length : 0;

// Context build 统计
const compressed = ctxBuilds.filter(e => e.action === 'truncate');
const totalBefore = ctxBuilds.reduce((s, e) => s + (e.beforeTokens || 0), 0);
const totalAfter = ctxBuilds.reduce((s, e) => s + (e.afterTokens || 0), 0);
const savedTokens = totalBefore - totalAfter;
const compressionRatio = totalBefore > 0 ? (savedTokens / totalBefore * 100) : 0;

console.log('📊 Trace 统计：$TRACE_FILE');
console.log('   LLM 调用：', llm.length);
console.log('   Agent 运行：', runs.length);
console.log('   Prompt tokens：', totalPrompt);
console.log('   Completion tokens：', totalCompletion);
console.log('   总成本：\$' + totalCost.toFixed(6));
console.log('   平均延迟：', avgLatency.toFixed(0) + 'ms');
console.log('');
console.log('📦 上下文组装：');
console.log('   总次数：', ctxBuilds.length);
console.log('   压缩次数：', compressed.length);
console.log('   压缩前 tokens：', totalBefore);
console.log('   压缩后 tokens：', totalAfter);
console.log('   节省 tokens：', savedTokens);
console.log('   压缩比：', compressionRatio.toFixed(1) + '%');

if (compressed.length > 0) {
  console.log('');
  console.log('   压缩明细：');
  for (const e of compressed.slice(0, 5)) {
    console.log(\`     - \${e.toolName}: \${e.beforeTokens} → \${e.afterTokens} tokens\`);
  }
  if (compressed.length > 5) {
    console.log(\`     ... 还有 \${compressed.length - 5} 条\`);
  }
}
"
