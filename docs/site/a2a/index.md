# A2A v1.1 双向流与 HITL

当前项目基于 A2A 协议 v1.1，支持 WebSocket 双向流（BiDi Streaming）和人类在环（Human-in-the-Loop）。

## 架构图

```text
Coordinator (CLI)          Reviewer Agent
      |                           |
      |--- 1. tasks/send -------->|
      |                           | (发现需要澄清)
      |<-- 2. input-required -----|
      |                           |
 [ 人类 CLI 介入 ]                |
 输入 y/n                         |
      |                           |
      |--- 3. tasks/resume ------>|
      |    (带 requestState)      | (恢复执行)
      |<-- 4. completed ----------|
      |    (返回 Artifact)        |
```

## 协议对照：v1.0 vs v1.1

| 维度 | v1.0（HTTP + 轮询） | v1.1（BiDi + MRTR） |
|---|---|---|
| **传输层** | HTTP + SSE（单向） | WebSocket（双向） |
| **状态获取** | 客户端主动轮询 `tasks/get` | 服务端推送 + WebSocket 长连接 |
| **人类介入** | 无 | 触发 `input-required`，携带 `requestState` 恢复 |
| **兼容性** | 完全支持 | 向下兼容 v1.0 |

## 如何体验 HITL

```bash
# 1. 启动 Agent
pnpm start:all

# 2. 在另一个终端发送带 [elicit] 的任务
# 注意：当前 coordinator 已经支持 CLI 交互
pnpm --filter @tda/coordinator dev "[elicit] package.json"
```

**终端会输出**：
```text
🤖 [review] Agent 需要澄清：
   你确定要让我评审这个文件吗？（输入 confirm 确认）
   请输入 (y/n): 
```
输入 `y` 后，Agent 会继续执行并输出评审报告。

## 相关文档

- [ADR-0008: A2A v1.1 BiDi Streaming & HITL](/adr/0008-a2a-bidi-hitl)
