# @tda/core

纯逻辑层：LLM 调用、Agent 循环、Context Engineering、Schema 校验与 Trace。

## 安装

```bash
pnpm add @tda/core
```

## 核心模块

### 1. Agent Loop（`runAgent`）

Agent 主循环，支持 Function Calling / 多轮 Tool Use / 多层收敛机制。

```ts
import { runAgent } from "@tda/core";

const answer = await runAgent(
  "你是代码评审专家",
  "评审以下代码：...",
  {
    maxSteps: 8,
    tools: openAITools,
    executeTools: executeToolCalls,
    compressorOptions: { readFileMaxLines: 500 } // Context 压缩阈值
  }
);
```

### 2. Context Engineering（`context/`）

显式化上下文组装层。在工具结果进入 LLM 之前，自动截断超长内容，节省 Token 成本。

- **Tool Context 压缩**：当 `read_file` 返回超过阈值时，保留首尾，省略中间。
- **Token 预算**：基于 `estimateTokens` 的轻量计算，避免撑爆模型上下文窗口。

### 3. Trace 可观测性（`trace/`）

记录 LLM 调用、Agent 运行、工具调用与 Context Engineering 的完整生命周期。

- `recorder.emitLLMCall()`：耗时、Token、成本（自动估算）。
- `recorder.emitAgentRun()`：总步数、工具调用数、收口原因。
- `recorder.emitContextBuild()`：记录每次压缩的 before/after tokens。

## 导出清单

- `runAgent` / `AgentOptions`
- `ContextBuilder` / `IdentityContextBuilder`
- `compressToolResult` / `estimateTokens`
- `recorder` / `createJsonlReporter`
