# Reviewer Agent

代码评审 Agent，作为独立的 A2A 服务运行，支持 HTTP 轮询（v1.0）和 WebSocket BiDi（v1.1）。

## 启动

```bash
pnpm --filter @tda/reviewer dev
```
监听 `http://localhost:4101`。

## 能力与接口

- **Agent Card**：`GET /.well-known/agent.json`（同时声明 HTTP 与 WebSocket 接口）。
- **HTTP 端点**：用于兼容 v1.0 客户端。
- **WebSocket 端点**：`ws://localhost:4101/stream`（用于 v1.1 双向流）。

## Elicitation 机制

当 `reviewer` 在执行评审时，如果发现信息不足（例如输入包含 `[elicit]` 占位符），它会触发 `ElicitationRequired` 异常。

此时任务状态变为 `input-required`，通过 WebSocket 推送 `requestState` 给客户端（如 `coordinator`）。客户端收集人工输入后，调用 `tasks/resume` 恢复执行。

详见 [A2A 协议文档](/a2a/)。
