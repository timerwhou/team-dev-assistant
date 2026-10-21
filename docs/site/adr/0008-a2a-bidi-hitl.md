# A2A v1.1 双向流与 HITL

## 背景

在 A2A v1.0 规范下，Agent 只能通过 HTTP 轮询返回结果，人类介入只能是事后审阅。当 Agent 在执行中（如代码评审）遇到信息缺失时，无法实时向人类寻求澄清。

## 设计目标

- 实现 HITL（Human-in-the-Loop），支持执行过程中的动态澄清。
- 兼容 A2A v1.0 客户端，确保平滑升级。

## 架构设计

引入 WebSocket 作为 BiDi Streaming 传输层。服务端利用 `ws` 库挂载 `/stream` 端点。当 Agent 抛出 `ElicitationRequired` 时，任务状态置为 `input-required` 并通过流推送 `requestState`。客户端捕捉该状态后，通过 CLI `readline` 获取人类输入，携带 `requestState` 与 `inputResponses` 通过 `tasks/resume` 恢复 Agent 执行。

## 影响评估

- **正向**：实现了真正的实时人机协同；Agent Card 支持声明多种接口，具备极强的兼容性。
- **负向**：引入了长连接状态管理，服务端需处理断线重连与 MRTR 的幂等性。
