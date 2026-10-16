# @tda/a2a

Agent-to-Agent 协议实现：Agent Card + JSON-RPC + Task 生命周期。

## 核心概念

| 概念 | 说明 |
|---|---|
| **Agent Card** | `/.well-known/agent.json`，声明 Agent 能力 |
| **Task** | 一次完整任务，有 id / status / artifacts |
| **Message** | Task 内的对话单元 |
| **Part** | 消息内容块（text / data） |

## Server

```ts
import { createA2AServer } from "@tda/a2a";

const card = {
  name: "Reviewer Agent",
  description: "代码评审",
  url: "http://localhost:4101",
  version: "0.1.0",
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [{ id: "code_review", name: "代码评审", description: "评审代码", tags: ["review"] }],
};

const app = createA2AServer(card, async (messages) => {
  // 处理消息，返回 artifacts
  return [{ name: "report", parts: [{ type: "text", text: "..." }] }];
});

app.listen(4101);
```

## Client

```ts
import { A2AClient } from "@tda/a2a";

const client = new A2AClient("http://localhost:4101");
await client.getAgentCard();             // 发现能力
const task = await client.sendTask("评审 src/index.ts");   // 派活
const final = await client.waitForCompletion(task.id);     // 等完成
```
