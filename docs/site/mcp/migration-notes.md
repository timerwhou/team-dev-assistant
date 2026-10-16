# MCP v1 → v2 迁移笔记

记录 v0.2.0 里程碑（原 v0.3.0）期间从 v1 SDK 迁移到 v2 SDK 的实战经验。

## 迁移背景

| 项 | v1 | v2 |
|---|---|---|
| SDK | `@modelcontextprotocol/sdk@1.32.1` | `@modelcontextprotocol/server@2.3.1` |
| 协议版本 | 2025-11-25 | 2026-07-28（+ 向后兼容） |
| 会话模型 | 有状态（握手建立） | 无状态（每次请求自描述） |
| 包结构 | 单体 | 拆分（server / client / core） |

## 关键 API 变化

### 传输层

**v1**：

```ts
const transport = new StdioServerTransport();
await server.connect(transport);
```

**v2**：

```ts
const handle = serveStdio(() => {
  const server = new McpServer(...);
  // 注册所有能力
  return server;
});
```

**差异**：v2 用 `serveStdio(factory)` 替代「new transport + connect」两步。factory 每次连接返回新 server 实例。

### Tool 注册

**v1 和 v2 的 `registerTool` 签名兼容**：

```ts
server.registerTool("name", { description, inputSchema }, handler);
```

**关键**：`inputSchema` 在 v2 里要求符合 **Standard Schema** 规范（Zod v4 原生支持）。

## Skills Extension 集成

**v2 SDK 没有内置 SEP-2640 的便捷 API**。我们使用 `@olaservo/ext-skills@0.16.0`（Skills WG 维护者维护的参考实现）：

```ts
import { discoverSkills, registerSkillResources } from "@olaservo/ext-skills/server";

const skillMap = discoverSkills(skillsRoot);

const handle = serveStdio(() => {
  const server = new McpServer(
    { name: "team-dev-assistant", version: "0.1.0" },
    { capabilities: { resources: {} } },
  );

  registerSkillResources(server, skillMap, skillsRoot, {
    template: true,
    directoryRead: true,
    ttlMs: 60_000,
    cacheScope: "public",
  });

  return server;
});
```

**收益**：

- 自动注册 `skills/list` / `skills/get`
- 自动声明 `io.modelcontextprotocol.skills` extension
- 自动计算 SHA-256 摘要
- 支持 SEP-2549 缓存属性（`ttlMs` / `cacheScope`）

## 迁移中遇到的坑

### 坑 1：SEP-2640 要求目录名 = frontmatter `name`

**问题**：原设计目录 `code-review/` 但 frontmatter `name: review`，**违反 SEP-2640**。

**修正**：目录重命名：
- `code-review/` → `review/`
- `issue-triage/` → `issues/`

**CLI 命令不变**（`/review` / `/issues`）。

### 坑 2：`publish-docker` job 不触发

**现象**：Release 成功但 Docker 镜像没推。

**根因**：release-please v4 的输出变量名与预期不一致。

**修正**：见 ADR-0004 和 Release workflow 的调整。

### 坑 3：GHCR 镜像 private 导致本地拉取失败

**现象**：`docker pull` 报 `manifest unknown`。

**根因**：GHCR 镜像默认 private，本地未登录。

**修正**：把镜像设为 public（见 [GHCR 部署](/deploy/ghcr)）。

## 验证结果

- ✅ `skills/list` 返回 3 个 Skill（含 SHA-256 摘要）
- ✅ `resources/read` 按 `skill://` URI 返回内容
- ✅ `skills/get` 返回条目元数据
- ✅ MCP Inspector 验证通过

## 参考

- [ADR-0002: Upgrade to MCP v2](/adr/0002-upgrade-to-mcp-v2)
- [ADR-0003: Implement Skills as Native Extension](/adr/0003-implement-skills-as-native-extension)
- [设计文档: MCP v2 迁移](/design/mcp-v2-migration)
