# MCP v1 → v2 迁移设计文档

> 关联：ADR-0002 · Epic #13 · Story #15（已关闭）

## 1. 现状

### 1.1 当前实现

| 项 | 值 |
|---|---|
| SDK | `@modelcontextprotocol/sdk@1.32.1` |
| 规范版本 | 2025-11-25 |
| 传输 | stdio（`StdioServerTransport`） |
| 状态模型 | 有状态（握手建立会话） |
| 包结构 | 单体 |

### 1.2 现有能力

- Tools: `read_file` / `search_code` / `list_issues`
- Prompts: `code_review`
- Resources: `project://files`
- 客户端：Claude Desktop、Cursor、Cline

## 2. 目标

| 项 | 目标值 |
|---|---|
| SDK | `@modelcontextprotocol/server@2.x` + `@modelcontextprotocol/core@2.x` |
| 规范版本 | 2026-07-28 |
| 传输 | stdio + Streamable HTTP（可选） |
| 状态模型 | 无状态（每次请求带 `_meta`） |
| 包结构 | 拆分（`server` / `client` / `core`） |
| Skills | 原生 extension（SEP-2640） |

## 3. 关键变化对比

### 3.1 协议模型

| 维度 | v1 (2025-11-25) | v2 (2026-07-28) |
|---|---|---|
| 会话 | 握手建立，后续复用 | 无状态，每次请求自描述 |
| 能力协商 | initialize 一次 | 每次请求在 `_meta` 中携带 |
| 传输 | stdio / SSE | stdio / Streamable HTTP |

### 3.2 SDK 包结构

| v1 | v2 |
|---|---|
| `@modelcontextprotocol/sdk` | `@modelcontextprotocol/server` |
| — | `@modelcontextprotocol/client` |
| — | `@modelcontextprotocol/core` |
| — | `@modelcontextprotocol/transport-stdio` |

### 3.3 API 变化

**v1 的 Tool 注册**：

```ts
server.registerTool(
  "read_file",
  {
    description: "...",
    inputSchema: z.object({ path: z.string() }),
  },
  async ({ path }) => { ... }
);
```

**v2 的 Tool 注册**：

```ts
server.registerTool(
  "read_file",
  {
    description: "...",
    inputSchema: z.object({ path: z.string() }),  // Standard Schema
  },
  async ({ path }) => { ... }
);
```

**关键差异**：v2 要求 `inputSchema` 符合 **Standard Schema** 规范（Zod v4 原生符合）。

### 3.4 Skills Extension（新增）

v2 原生支持 SEP-2640：

```ts
server.registerSkill({
  name: "code-review",
  description: "评审代码",
  uri: "skill://code-review",
});
```

## 4. 迁移步骤

### 阶段 1：依赖切换

- 移除 `@modelcontextprotocol/sdk`
- 添加 `@modelcontextprotocol/server@^2.0.0` 和 `@modelcontextprotocol/core@^2.0.0`
- 更新 `pnpm-lock.yaml`

### 阶段 2：导入路径迁移

- `@modelcontextprotocol/sdk/server/mcp.js` → `@modelcontextprotocol/server`
- `@modelcontextprotocol/sdk/server/stdio.js` → `@modelcontextprotocol/transport-stdio`

### 阶段 3：API 适配

- `McpServer` 构造函数（检查 v2 的参数）
- `registerTool` 的 schema 参数（验证 Zod v4 兼容）
- `registerPrompt` 和 `registerResource`（检查 API 变化）

### 阶段 4：Skills Extension 实现

- 用 v2 原生 API 注册 3 个 Skill
- 替代 v1 时的 Tools 降级方案

### 阶段 5：验证

- MCP Inspector 手动测试
- Claude Desktop / Cursor 集成测试
- 现有 Tools / Prompts / Resources 回归

## 5. 兼容性策略

| 层 | 策略 |
|---|---|
| **MCP Server** | 直接升级到 v2，不维护 v1 兼容层 |
| **客户端** | 验证 Claude Desktop / Cursor 对 v2 的支持；如不支持，文档站标注 |
| **CLI** | 不依赖 MCP SDK，不受影响 |
| **A2A** | 不依赖 MCP SDK，不受影响 |

## 6. 验证方法

### 6.1 单元测试

- `packages/mcp-server/test/tools.test.ts`：验证每个 Tool 的注册和调用
- `packages/mcp-server/test/skills.test.ts`：验证 Skills 原生 extension

### 6.2 集成测试

```bash
npx @modelcontextprotocol/inspector \
  pnpm --filter @tda/mcp-server dev
```

**验证点**：
- Tools 标签显示 3 个 Tool + 3 个 Skill
- Prompts 标签显示 `code_review`
- Resources 标签显示 `project://files`

### 6.3 客户端测试

- Claude Desktop：从配置连接，调用 Tool 和 Skill
- Cursor：通过 MCP 设置连接，验证发现和调用

### 6.4 回归测试

- `pnpm -r --no-bail typecheck`
- `pnpm -r --no-bail --if-present test`
- `pnpm eval`（如 Eval 覆盖 MCP）

## 7. 风险和缓解

| 风险 | 缓解 |
|---|---|
| **v2 与 v1 破坏性变化大于预期** | 先做 PoC 验证，再全量迁移 |
| **Claude Desktop / Cursor 不支持 v2** | 文档站标注支持矩阵，保留 v1 分支（如需） |
| **Standard Schema 兼容问题** | 用 Zod v4 验证；必要时用 `@standard-schema/spec` 适配层 |
| **迁移引入新 bug** | 每个 Tool 迁移后立即用 Inspector 验证 |
| **文档滞后** | 迁移完成后同步更新 `docs/site/mcp/` |

## 8. 参考

- ADR-0002：`docs/adr/0002-upgrade-to-mcp-v2.md`
- MCP v2 规范：2026-07-28
- MCP v1 → v2 迁移指南
- Epic #13
