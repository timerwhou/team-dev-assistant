# A2A v1.1 BiDi & HITL

当前项目基于 A2A 协议 v1.1，支持 WebSocket BiDi Streaming 与 HITL 模式。

## 架构图

```text
Coordinator (CLI)          Reviewer Agent
      |                           |
      |--- 1. tasks/send -------->|
      |                           | (发现需要澄清)
      |<-- 2. input-required -----|
      |                           |
 [ CLI 提示 ]                     |
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
| **人工介入** | 无 | 触发 `input-required`，携带 `requestState` 恢复 |
| **兼容性** | 完全支持 | 向下兼容 v1.0 |

## 如何体验 HITL

```bash
# 1. 启动 Agent
pnpm start:all

# 2. 在另一个终端发送带 [elicit] 的任务
pnpm --filter @tda/coordinator dev "[elicit] package.json"
```

**终端会输出**：
```text
🤖 [review] Agent 需要澄清：
   你确定要让我评审这个文件吗？
   请输入 (y/n): 
```

输入 `y` 后，Agent 会继续执行并输出评审报告。

> **注意 (v1.4.0 新增)**：当你输入 `y` 确认后，如果本次决策触发了 Playbook 写入，且与现有记忆发生冲突，系统**不会阻塞当前流程**，而是将新记忆静默存入 `.pending/` 待办区。你随时可以通过 `/review-conflicts` 集中处理这些冲突。

## 相关文档

- [ADR-0008: A2A v1.1 BiDi Streaming & HITL](/adr/0008-a2a-bidi-hitl)
