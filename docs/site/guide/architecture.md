# 架构设计

## 总览

```
                      ┌──────────────────────────────────────┐
                      │             用户入口                 │
                      └──────────────────────────────────────┘
                        │               │              │
                        ▼               ▼              ▼
                    ┌──────┐      ┌──────────┐    ┌─────────┐
                    │ CLI  │      │ A2A 多   │    │ MCP     │
                    │      │      │ Agent    │    │ Server  │
                    └──────┘      └──────────┘    └─────────┘
                        │               │              │
                        └───────────────┼──────────────┘
                                        ▼
                      ┌──────────────────────────────────────┐
                      │           @tda/skills                │
                      │  review / investigate / issues       │
                      └──────────────────────────────────────┘
                                        ▼
                      ┌──────────────────────────────────────┐
                      │           @tda/core                  │
                      │  ┌────────────────────────────────┐  │
                      │  │ runAgent                       │  │
                      │  │  ├─ ContextBuilder             │  │
                      │  │  ├─ Tool Use 多轮链路          │  │
                      │  │  ├─ 收敛机制（语义进展信号）   │  │
                      │  │  └─ Trace 记录                 │  │
                      │  └────────────────────────────────┘  │
                      └──────────────────────────────────────┘
                                        ▼
                      ┌──────────────────────────────────────┐
                      │           @tda/tools                 │
                      │  read_file / search_code / list_issues│
                      │  (Zod Schema + 安全校验)             │
                      └──────────────────────────────────────┘
```

## 数据流（四个入口）

### 入口 1：CLI
- 解析参数 → 找到 Skill → 调用 `runAgent` → 输出 Markdown + Trace。

### 入口 2：MCP Server
- 暴露 Tools / Prompts / Resources 给 Claude Desktop / Cursor 调用。

### 入口 3：A2A v1.0（HTTP 轮询）
- Coordinator 发送任务，轮询状态，直到完成或失败。

### 入口 4：A2A v1.1（WebSocket BiDi + HITL）
- Coordinator 建立 WebSocket 连接。
- 遇到模糊需求时，Agent 推送 `input-required` 与 `requestState`。
- CLI 弹出提示，人工输入后，客户端通过 `tasks/resume` 恢复任务。

## 核心设计决策

### Context Engineering
- 无压缩时，复杂查询的上下文会膨胀到 24万 tokens。
- 引入 `ContextBuilder` 压缩后，Token 消耗降低 90% 以上，大幅降低延迟和成本。

### Eval Regression Gate
- Prompt 的微小改动会导致 Agent 产生幻觉或死循环。
- Eval Gate 通过 Trace 轨迹断言，在 CI 阶段拦截静默退化。

### A2A v1.1 & MRTR
- 传统的 HTTP 轮询无法实现实时人工介入。
- 引入 WebSocket 和 MRTR 语义，使得 Agent 可以暂停等待人工澄清，并随时恢复。

### Trace 可观测性
- 记录 LLM 调用（Token/耗时/成本）、Agent 步数、工具调用链。
- 为 Eval Gate 提供断言数据支撑。
