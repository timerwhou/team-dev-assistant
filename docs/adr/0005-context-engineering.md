# 5. Introduce Context Engineering Layer

Date: 2026-10-16
Status: Proposed

## Context and Problem Statement

`@tda/core` 的 `agent/loop.ts` 把工具结果**原样**塞进 messages：

```ts
messages.push({
  role: "tool",
  tool_call_id: r.toolCallId,
  content: JSON.stringify(r.result),   // 无压缩
});
```

**问题**：

1. **上下文膨胀**：读 5 个文件（每个 500 行）后，上下文可能超过模型窗口
2. **成本失控**：每次 LLM 调用都携带完整历史，成本线性增长
3. **信噪比降低**：无关内容稀释了关键信号

**行业参照**：

- Anthropic Code Execution with MCP：150,000 → 2,000 tokens（98.7% 缩减）
- 7 层上下文框架：Instruction / Retrieval / Tool / Memory / Execution / Interaction / Governance

## Decision Drivers

- **成本控制**：LLM 调用成本与上下文 token 数成正比
- **信噪比**：上下文越精炼，Agent 决策越准确
- **可观测性**：上下文组装决策必须可追溯
- **向后兼容**：现有 Agent 循环行为不能破坏
- **0.x 阶段范围控制**：只做最有价值的 Tool Context

## Considered Options

### Option A：不做上下文管理

**做法**：保持现状，工具结果原样塞入。

**优点**：零改动。

**缺点**：
- 长任务上下文膨胀
- 成本失控
- 无法优化

### Option B：工具结果截断

**做法**：超过阈值就截断（`read_file` > 500 行 → 只保留前 500 行）。

**优点**：
- 简单
- 立即可用

**缺点**：
- **可能丢失关键信息**（如果问题在第 800 行）
- **不可逆**（信息永久丢失）

### Option C：LLM 摘要压缩

**做法**：工具结果用 LLM 生成摘要。

**优点**：
- 保留语义
- 更智能

**缺点**：
- **额外 LLM 调用成本**
- **延迟增加**
- **摘要可能丢细节**

### Option D：结构化上下文层（选定）

**做法**：
- 引入 `context/` 模块作为**显式层**
- 第一版：**智能截断**（保留开头 + 结尾 + 关键标记）
- Trace 记录每个组装决策
- Token 预算可配置

**优点**：
- **可测试**：上下文组装有明确的输入输出
- **可扩展**：未来可加 LLM 摘要、RAG 检索等策略
- **可观测**：每个决策都被 trace 记录
- **向后兼容**：第一版行为等价于恒等变换（不做压缩）

**缺点**：
- **引入新模块**
- **需要设计好抽象**（否则未来重构成本高）

## Decision Outcome

**Chosen option: Option D — 结构化上下文层**

理由：

1. **显式优于隐式**：上下文组装是 Agent 的核心机制，应该显式化
2. **渐进增强**：第一版只搭骨架 + 智能截断，未来可加策略
3. **可观测是基础**：没有 trace 就无法优化，这是后续 Story 的前置
4. **行业对齐**：Anthropic、LangChain 都在做上下文管理

**实施路径**：

1. **Story 1**：`context/` 模块骨架 + 类型定义（**恒等变换**）
2. **Story 2**：Tool Context 压缩（智能截断）
3. **Story 3**：Trace 增强（记录组装决策）
4. **Story 4**：收益量化（对比实验）
5. **Story 5**：ADR + 设计文档 + 文档站

**范围控制**：
- **只做 Tool Context** —— 不做 Memory Context（跨会话）、Retrieval Context（RAG）
- **第一版用截断** —— 不用 LLM 摘要（成本 + 延迟）
- **向后兼容** —— 第一版行为不变

## Consequences

### Positive

- **上下文可测试**：`ContextBuilder` 有明确的输入输出
- **成本可优化**：Tool Context 压缩减少 token 消耗
- **可观测**：每个组装决策被 trace
- **可扩展**：未来加策略不需要改 Agent 循环

### Negative

- **新模块增加复杂度**：`context/` 需要设计好抽象
- **第一版收益有限**：只做截断，不是 LLM 摘要
- **需要维护**：未来上下文策略变化时需要更新

### Neutral

- **Agent 循环改动小**：只需在 push messages 前调用 `contextBuilder.build()`
- **现有 eval 不受影响**：第一版是恒等变换

## 相关变更

- `packages/core/src/context/` 新增模块
- `packages/core/src/agent/loop.ts` 集成 `ContextBuilder`
- `packages/core/src/trace/types.ts` 加 `context_build` 事件

## 参考

- [Anthropic: Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Semantic Kernel: Context Engineering](https://learn.microsoft.com/en-us/semantic-kernel/)
- [LangChain: Context Management](https://python.langchain.com/docs/)
- Story #36 / #37 / #38 / #39 / #40
- Epic #35
