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

## 4. Team Playbook (playbook/)

- `loadPlaybook()`：解析本地 `docs/playbook/` 目录中的 Markdown + YAML 资产。
- `getContextPack()` / `getContextPackAsync()`：基于需求检索相关的 Fact 与 Stack，支持语义混合检索与图谱 1-hop 扩展，生成注入大模型的 Prompt 背景包。
- `extractFactsFromCode()`：多语言 `@fact` 扫描器。
- `savePlaybookEntry()`：写入新的 Fact。若检测到冲突，会自动存入 `.pending/` 暂存区，返回 `pending_review` 状态，不阻塞业务。
- `expandContextGraph()`：基于 `relates_to` / `depends_on` 进行 1-hop 图谱扩展召回。

## 导出清单

- `runAgent` / `AgentOptions`
- `ContextBuilder` / `IdentityContextBuilder`
- `compressToolResult` / `estimateTokens`
- `recorder` / `createJsonlReporter`


## 🧠 运行时能力体系 (v1.6.0 新增)

从 v1.6.0 开始，`@tda/core` 不仅负责检索，更承担了**可装配研发运行时**的职责。

### 1. 能力契约 (Capability Pack)
工具不再是硬编码的函数，而是实现了 `CapabilityPack` 接口的注册单元。
开发者可以通过 `CapabilityRegistry` 动态注册或按阶段（Stage）获取能力包。

### 2. 工作流声明 (Workflow Manifest)
基座支持通过声明式配置（Manifest）来定义研发工作流：
- **stages**: 定义阶段序列（如 `["context-gathering", "execution"]`）。
- **stageCapabilities**: 明确每个阶段需要激活哪些能力类型。
基座会根据当前阶段，动态装配工具子集，从而大幅收敛 LLM 的上下文。

### 3. 执行反馈闭环 (Agentic Loop)
`AgenticLoop` 为研发基座提供了自主迭代能力。它包含：
- **Evaluator**: 业务层注入的判定函数。
- **Trace**: 完整的执行轨迹。
- **Governance**: 内置最大迭代次数（默认 5 次）防止死循环。

