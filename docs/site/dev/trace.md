# Trace 可观测性

LLM / Agent / Context 三类 Trace 事件，以 JSONL 格式输出到 `.traces/`。

## 事件类型

### `llm_call`

| 字段 | 说明 |
|---|---|
| `model` | 模型名 |
| `durationMs` | 耗时 |
| `promptTokens` / `completionTokens` | Token 数 |
| `costUSD` | 估算成本 |

### `agent_run`

| 字段 | 说明 |
|---|---|
| `steps` | 步数 |
| `toolCalls` | 工具调用总数 |
| `stopReason` | 收口原因 |
| `contextBuilds` | 压缩总次数及 before/after tokens |

### `context_build`

| 字段 | 说明 |
|---|---|
| `layer` | `instruction` / `tool` / `history` |
| `action` | `keep` / `truncate` / `drop` |
| `beforeTokens` / `afterTokens` | 压缩前后 Token 数 |
| `reason` | 触发原因（如 read_file 超过 500 行） |

## 统计

```bash
bash scripts/trace-stats.sh
```

输出 LLM 调用次数、总 Token、平均延迟、上下文压缩比等数据。
