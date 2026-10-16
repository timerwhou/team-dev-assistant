# @tda/core

纯逻辑层：LLM 调用、Agent 循环、Schema、Trace。

## 安装

```bash
pnpm add @tda/core
```

## 主要导出

### `runAgent(system, user, opts)`

Agent 主循环，支持 Function Calling / 多轮 Tool Use / 收敛机制。

```ts
import { runAgent } from "@tda/core";

const answer = await runAgent(
  "你是代码评审专家",
  "评审以下代码：...",
  {
    maxSteps: 8,
    tools: openAITools,
    executeTools: executeToolCalls,
    verbose: true,
  }
);
```

### 收敛机制

| 层级 | 机制 | 触发条件 |
|---|---|---|
| 软 | Prompt 完成条件清单 | 模型自判 |
| 中 | 语义进展信号（seenFiles） | 连续 2 轮无新文件 |
| 硬 | 连续失败 / 工具总量 / 最大步数 | 兜底 |

### `tracedChatCompletion(params)`

带 trace 的 LLM 调用，自动记录 model / tokens / 耗时 / 成本。

### `recorder`

全局 Trace 记录器。

```ts
import { recorder, createJsonlReporter } from "@tda/core";

recorder.register(createJsonlReporter());
```

## 相关文档

- [@tda/tools](/packages/tools) — 工具集
- [可观测性](/dev/trace) — Trace 体系
