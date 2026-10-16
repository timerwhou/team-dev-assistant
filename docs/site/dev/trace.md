# 可观测性

LLM/Agent/Tool 三类 trace event，JSONL 输出到 `.traces/`。

## 事件类型

### `llm_call`

| 字段 | 说明 |
|---|---|
| `model` | 模型名 |
| `durationMs` | 耗时 |
| `promptTokens` / `completionTokens` / `totalTokens` | Token 数 |
| `costUSD` | 估算成本 |
| `hasTools` / `jsonMode` | 调用模式 |
| `error` | 错误信息（若有） |

### `agent_run`

| 字段 | 说明 |
|---|---|
| `steps` | 步数 |
| `toolCalls` | 工具调用总数 |
| `totalPromptTokens` / `totalCompletionTokens` / `totalCostUSD` | 汇总 |
| `stopReason` | 收口原因 |

### `tool_call`

| 字段 | 说明 |
|---|---|
| `name` | 工具名 |
| `durationMs` | 耗时 |
| `ok` | 是否成功 |
| `error` | 错误信息 |

## 统计

```bash
bash scripts/trace-stats.sh
```

输出：LLM 调用次数、总 token、总成本、平均延迟。

## 关闭

```bash
TDA_TRACE=0 pnpm dev "/review apps/cli/src/index.ts"
```
