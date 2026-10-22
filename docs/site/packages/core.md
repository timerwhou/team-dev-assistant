# @tda/core

核心引擎层，负责数据契约、能力注册、Agent 执行闭环与自演进记忆存储。

## 🏛️ 架构演进与模块说明

### 1. 能力注册中心 (CapabilityRegistry)
彻底解耦具体平台与工具，将一切外部能力降维为标准 `CapabilityPack`。
```ts
import { capabilityRegistry } from "@tda/core";
capabilityRegistry.register({
  metadata: { id: "native:search_code", name: "search_code", kind: "tool", stage: "context-gathering" },
  inputSchema: z.object({ query: z.string() }),
  execute: async (params, ctx) => { /* ... */ }
});
```

### 2. 工作流声明契约 (WorkflowManifest)
前后端通信的核心 Zod Schema。它定义了工作流的阶段和每个阶段允许激活的能力。
```ts
import { WorkflowManifestSchema } from "@tda/core";
const manifest = WorkflowManifestSchema.parse({
  name: "code-review",
  stages: ["context-gathering", "execution"],
  stageCapabilities: { "context-gathering": ["tool", "retriever"] }
});
```

### 3. 执行闭环与评估器 (AgenticLoop)
支持 `maxIterations` 预算控制的多轮深挖机制。如果评估器（Evaluator）判断当前检索到的上下文不足以完成任务，会自动触发深挖。

### 4. 经验存储 (MemoryStore)
- `.tda/memory.json`：存储需求维度的收敛轮数。
- `.tda/trace-history.json`：存储历史执行 Trace，供 Studio 回放。
