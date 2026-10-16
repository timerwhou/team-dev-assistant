# 2. Upgrade to MCP v2 SDK (2026-07-28 Protocol Revision)

Date: 2026-10-16
Status: Accepted

## Context and Problem Statement

我们在推进 Epic #13（MCP Skills Extension）时，发现一个结构性问题：

**当前使用的 `@modelcontextprotocol/sdk@1.32.1` 实现的是 2025-11-25 协议规范，不支持 SEP-2640 Skills Extension。**

根据 SDK 官方文档：

> This is v1.x of the MCP TypeScript SDK, the maintenance line. It implements the MCP spec up to 2025-11-25. Support for the 2026-07-28 spec is not planned for v1.x: it is in v2, the current stable release, which ships as separate packages, `@modelcontextprotocol/server` and `@modelcontextprotocol/client`.

我们面临三个选择：

1. **降级方案**：用 MCP Tools 实现 `skill_list` / `skill_get`（v1 兼容）
2. **升级到 v2**：采纳 2026-07-28 规范，原生支持 Skills Extension
3. **暂停 Epic #13**：等社区生态成熟再推进

## Decision Drivers

- **协议原生性**：Skill 是否是 MCP 协议层的一等资源
- **长期成本**：现在降级还是升级，哪个总成本更低
- **生态对齐**：MCP v2 是 2026 年事实标准，v1 是维护线
- **迁移窗口**：v1 只保证 v2 发布后 6 个月的安全更新（到 2027-01-27）
- **工程复杂度**：升级的破坏性变化范围
- **交付节奏**：是否阻塞 v0.2.0 的其他 Story

## Considered Options

### Option A：v1 降级方案（Tools 实现 skill_list / skill_get）

**做法**：把 `skills/list` 和 `skills/get` 实现为 MCP Tools，不动 SDK 版本。

**优点**：
- 不阻塞当前里程碑
- 用现有 API，实现成本低
- 客户端能发现和读取 Skill

**缺点**：
- **不是协议标准**：客户端把它当普通 Tool，无法原生识别 Skill
- **需要实现两遍**：v2 支持 Skills Extension 后，Tools 要改成 extension
- **v1 生命周期有限**：2027-01-27 后无安全更新
- **错过 v2 的结构性改进**：Stateless、Standard Schema、新扩展框架

### Option B：升级到 v2 SDK（采纳 2026-07-28 规范）

**做法**：把 MCP Server 从 `@modelcontextprotocol/sdk@1.x` 迁移到 `@modelcontextprotocol/server@2.x`，采纳 2026-07-28 协议。

**优点**：
- **协议原生 Skills Extension**：Skill 是一等资源
- **对齐 2026 事实标准**：所有新客户端都基于 v2
- **长期成本最低**：不需要实现两遍
- **结构性改进**：Stateless 协议（易部署）、Standard Schema（Zod v4 原生）、新扩展框架
- **v1 有过渡窗口**：到 2027-01-27 前 v1 仍可维护

**缺点**：
- **破坏性变化**：协议模型从"握手会话"变为"无状态请求/响应"
- **包结构变化**：SDK 从单体拆分为 `@modelcontextprotocol/server` / `client` / `core`
- **API 变化**：`registerTool` 的 `inputSchema` 要求 Standard Schema 规范
- **迁移成本**：需要改 `packages/mcp-server/` 的所有 Tool 定义
- **文档站需要更新**：MCP 集成文档要重写

### Option C：暂停 Epic #13

**做法**：把 Skill 标准化的目标推迟到社区生态成熟。

**优点**：
- 释放时间做其他里程碑

**缺点**：
- **Skill 无法成为可分发资产**：这是 Epic #13 的核心价值
- **错失协议分水岭**：v1 → v2 是行业分界线，晚做不如早做

## Decision Outcome

**Chosen option: Option B — 升级到 v2 SDK (2026-07-28 规范)**

理由：

1. **一次做对 > 两次做完**：Tools 降级方案需要实现两遍，v2 升级一次完成。
2. **对齐协议前沿**：v2 是 2026-07-28 规范的稳定实现，是生态方向。
3. **前置依赖满足**：里程碑 v0.4.0（Context Engineering）需要 v2 的 Standard Schema 和扩展框架。
4. **生命周期约束**：v1 到 2027-01-27 后无安全更新，现在升级是最佳窗口。
5. **Skill 的协议原生性**：只有 v2 能让 Skill 成为 MCP 的一等资源。

**实施路径**：

1. **Story #15 关闭**：移到 v0.3.0，用 v2 SDK 原生 extension 实现
2. **v0.2.0 缩小范围**：只做 Story #16（文档站聚合 Skill 页面）
3. **v0.3.0 扩为协议升级**：新增 4 个 Story 覆盖 v1 → v2 迁移
4. **写迁移指南**：`docs/design/mcp-v2-migration.md`

## Consequences

### Positive

- **协议原生 Skills**：Skill 成为 MCP 一等资源，客户端原生发现
- **无状态部署**：v2 的 Stateless 协议让 MCP Server 更易部署
- **Standard Schema**：Zod v4 原生支持，schema 定义更简洁
- **长期维护成本低**：不需要维护 v1 兼容层
- **知识沉淀**：ADR-0002 + 迁移指南记录决策和路径

### Negative

- **破坏性变化**：MCP Server 的所有 Tool 定义需要重写
- **文档站更新**：MCP 集成文档需要重写
- **短期阻塞**：v0.2.0 的 Skill 分发能力推迟到 v0.3.0
- **客户端兼容性**：需要验证 Claude Desktop、Cursor 对 v2 的支持情况

### Neutral

- **v0.2.0 的其他能力不受影响**：文档站、CLI、A2A、Trace、Eval 都不依赖 MCP SDK
- **回滚成本可控**：v1 到 2027-01-27 仍可用，出问题可回退

## 参考

- [MCP TypeScript SDK v1 文档](https://ts.sdk.modelcontextprotocol.io/)
- [MCP v2 规范 (2026-07-28)](https://modelcontextprotocol.io/specification/2026-07-28)
- [MCP v1 → v2 迁移指南](https://modelcontextprotocol.io/docs/migration/v1-to-v2)
- [SEP-2640 Skills Extension](https://modelcontextprotocol.io/seps/2640)
- ADR-0001: `docs/adr/0001-adopt-mcp-skills-extension.md`
- Epic #13: MCP Skills Extension
