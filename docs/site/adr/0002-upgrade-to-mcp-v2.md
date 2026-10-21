# MCP 协议升级至 v2 (2026-07-28)

## 背景

v1 SDK 最高仅支持 2025-11-25 规范，无法原生支持 SEP-2640（Skills Extension）。v1 的维护周期有限，且生态正快速向 v2 迁移。

## 设计目标

- 支持最新的 2026-07-28 协议规范。
- 原生集成 Skills Extension、Stateless 协议与新扩展框架。

## 架构设计

移除旧的 `@modelcontextprotocol/sdk`，迁移至 `@modelcontextprotocol/server@^2.3.1`。服务入口从 `new StdioServerTransport()` + `connect()` 变更为 `serveStdio(factory)` 模式，支持在每次连接时动态构建 Server 实例。

## 影响评估

- **正向**：完全对齐最新事实标准，解锁原生 Skills 能力。
- **负向**：v2 引入了破坏性变更（如包名拆分、API 签名变更），迁移成本较高。
