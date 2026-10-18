# 8. A2A v1.1 BiDi Streaming & Human-in-the-Loop

Date: 2026-10-18
Status: Proposed

## Context and Problem Statement

当前项目的 `@tda/a2a` 基于 A2A v1.0 实现了单向流（HTTP + SSE）和状态轮询。
随着 Agent 能力的复杂化，Agent 在执行任务时（如 `reviewer` 审查代码）经常会遇到“需要外部澄清”的场景（例如：“这个函数是否已经废弃？”）。

在 v1.0 的轮询模式下，人类介入只能是**事后的（审阅最终 PR）**，无法做到**执行中的实时介入**。
我们需要升级到 A2A v1.1 的 **BiDi Streaming（双向流）** 与 **Elicitation（澄清请求）**，实现 Human-in-the-Loop（HITL）。

## Decision Drivers

- **实时 HITL**：Agent 可以在执行中途暂停，向人类发起 Elicitation，并基于人类输入继续执行。
- **协议演进对齐**：对齐 2026 年 A2A 官方规范，支持版本协商和多传输绑定。
- **无状态化与容错**：参考 MCP 2026-07-28 的 MRTR（多轮往返请求）模式，确保 Elicitation 期间的状态不依赖内存，防止进程崩溃导致状态丢失。
- **工程可行性**：优先保证在 CLI 场景下稳定运行，避免过度设计。

## Considered Options

（注：方案已通过前期技术调研与对话确认，此处直接记录选定方案与备选考量）

1. **传输层选型**：
   - 备选：`socket.io`（重连机制完善，但客户端包体大，黑盒度高）
   - **选定：原生 `ws`**。轻量，适合“在 WebSocket 上跑 JSON-RPC 帧”的协议优先场景。适合 3-5 个 Agent 协同的规模。

2. **版本协商机制**：
   - 备选：私有 Extension
   - **选定：Agent Card 声明 `protocol_version: ["1.0", "1.1"]` + `supportedInterfaces`（同时声明 WebSocket 和 SSE）**。客户端按 SemVer 选择，兼容外部 A2A 客户端。

3. **HITL 状态语义**：
   - 备选：保持长连接挂起（占用内存）
   - **选定：MRTR 语义**。任务进入 `INPUT_REQUIRED` 状态，携带 `requestState`（无状态、可验签），客户端回复时带 `inputResponses` 重入，服务端恢复执行。

## Decision Outcome

**Chosen options**：

1. **底层传输**：在现有 Express 服务上挂载 `ws` WebSocket 端点（如 `ws://localhost:4101/stream`）。
2. **协议层**：使用 JSON-RPC 2.0 帧承载 A2A 消息。Agent Card 中同时声明 WebSocket 与 SSE 接口。
3. **HITL 流程**：
   - `reviewer` 需要澄清时，通过 WebSocket 推送 `elicit_request`（包含 JSON Schema 和 `requestState`），任务状态变为 `INPUT_REQUIRED`。
   - `coordinator` 的 CLI 用 `readline` 提示人类输入。
   - `coordinator` 通过 WebSocket 发送 `elicit_response`，携带之前收到的 `requestState`。
   - `reviewer` 校验 `requestState`，恢复执行并最终推送结果。

## Consequences

### Positive
- **实时介入**：大幅度缩短反馈环，Agent 不再“带着疑惑跑到底”。
- **协议合规**：多绑定声明让 Agent 能被外部框架（如微软 Agent Framework）发现和调用。
- **韧性增强**：`requestState` 无状态化，即使 coordinator 或 reviewer 短暂重启，只要拿到 state 就能续传。

### Negative
- **复杂度提升**：需要维护 WebSocket 生命周期和 `INPUT_REQUIRED` 状态机。
- **CLI 交互限制**：当前仅支持终端文本输入，暂不支持富文本或 GUI 表单。

## 相关变更

- `@tda/a2a`：新增 WebSocket Server/Client 适配器，扩展 Task 状态机。
- `coordinator`：新增 CLI Elicitation 交互逻辑。
- `reviewer`：在 Agent 执行器中注入 Elicitation 回调。
