# @tda/a2a

Agent-to-Agent 协议实现。支持 v1.0（HTTP/轮询）与 v1.1（WebSocket BiDi + HITL）。

## 核心能力

| 特性 | v1.0 | v1.1 |
|---|---|---|
| 传输层 | HTTP | HTTP + WebSocket |
| 状态同步 | 客户端轮询 `tasks/get` | 双向流实时推送 |
| 人工介入 | 无 | Elicitation / MRTR |

## Server 端

```ts
import { createA2AServer } from "@tda/a2a";

const card = {
  name: "Reviewer Agent",
  // ...
  supportedInterfaces: [
    { type: "http", url: "http://...", protocolVersions: ["1.0"] },
    { type: "websocket", url: "ws://.../stream", protocolVersions: ["1.1"] }
  ]
};

const { listen } = createA2AServer(card, async (messages) => {
  // 处理消息，返回 artifacts
});
listen(4101);
```

## HITL 生命周期（MRTR）

当 Agent 在 handler 中抛出 `ElicitationRequired` 时，任务会自动暂停：

1. 服务端向客户端发送 `input-required` 状态，并附带 `requestState`。
2. 客户端通过 CLI 询问人工。
3. 拿到输入后，调用 `tasks/resume`，携带 `requestState` 恢复执行。

## Client 端

```ts
import { A2AClient } from "@tda/a2a";

const client = new A2AClient("http://localhost:4101");

// 发送任务
const task = await client.sendTask("评审 src/index.ts");

// 恢复暂停的任务
await client.resumeTask(task.requestState!, { confirm: true });
```
