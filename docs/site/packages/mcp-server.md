# @tda/mcp-server

Model Context Protocol Server，原生支持 **Tools / Prompts / Resources / Skills**，并支持双轨制接入与 OAuth 2.1 企业级鉴权。

## 传输模式矩阵

| 模式 | 环境变量 | 适用场景 | 鉴权机制 |
|---|---|---|---|
| **stdio** | `MCP_TRANSPORT=stdio` (默认) | 本地 IDE (Cursor / Claude Code) | 依赖本地进程信任 |
| **HTTP** | `MCP_TRANSPORT=http` | 远程 Agent (Dify / Coze) | 支持 `MCP_API_KEY` 或 OAuth 2.1 |

## 远程 HTTP 接入指南

### 1. 启动 HTTP Server（静态 API Key 模式）

适用于本地开发或过渡期：

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 MCP_API_KEY=your-secret pnpm --filter @tda/mcp-server dev
```

### 2. 启动 HTTP Server（企业 OAuth 2.1 模式）

适用于生产环境，对接 Okta / Keycloak / Entra ID 等企业 IdP：

```bash
MCP_TRANSPORT=http \
OAUTH_ISSUER=https://dev-xxx.okta.com \
OAUTH_JWKS_URI=https://dev-xxx.okta.com/oauth2/default/v1/keys \
MCP_CANONICAL_URI=https://mcp.example.com \
pnpm --filter @tda/mcp-server dev
```

> **注意**：当配置了 `OAUTH_ISSUER` 后，`MCP_API_KEY` 将被自动忽略。所有请求必须携带由企业 IdP 签发的 JWT Token。

### 3. 客户端调用 (Dify / Coze)

配置 MCP 接口地址为：`http://<your-ip>:3000/mcp`。
在请求头中必须携带：

```http
Authorization: Bearer <your-token>
Accept: application/json, text/event-stream
```

## 企业 IdP 对接说明

本 MCP Server 作为 **OAuth 2.1 资源服务器**，遵循以下 RFC 规范：

- **RFC 9728**：暴露 `/.well-known/oauth-protected-resource` 元数据端点，告知客户端授权服务器地址。
- **RFC 8707**：严格校验 JWT 的 `aud` 声明，确保 Token 是专门为当前 MCP Server 签发的。
- **Scope 控制**：支持的细粒度作用域包括 `playbook:read`（读取 Playbook）和 `playbook:write`（写入 Fact）。

### Okta 配置示例

在 Okta 中创建一个 Authorization Server，并确保：
1. 配置了自定义 Scope：`playbook:read`、`playbook:write`。
2.  Audience 设置为 `MCP_CANONICAL_URI` 的值（如 `https://mcp.example.com`）。
3.  将 `OAUTH_ISSUER` 和 `OAUTH_JWKS_URI` 填入环境变量。

### Keycloak 配置示例

1. 创建一个 Client（勾选 Confidential 或 Public 均可，取决于调用方）。
2. 在 Client 的 `Mappers` 中配置 Audience，将其值设置为 `MCP_CANONICAL_URI`。
3. 确保 Realm 的 JWKS 端点可通过 `OAUTH_JWKS_URI` 访问。

### 🏢 多租户数据隔离 (Multi-Tenant Isolation)
作为资源服务器，MCP Server 支持基于 JWT 声明（Claim）的**物理级多租户隔离**。
当接收到请求时，系统会按以下优先级解析租户 ID：
1. `tenant_id` (推荐)
2. `org_id`
3. `sub` (Subject)

**隔离机制**：
- 每个租户将拥有独立的运行上下文（`TenantContext`）。
- 文件读取（`read_file`）和 Playbook 检索将被强制路由到该租户专属的物理目录（`<root>/.tda-tenants/<tenant_id>`）。
- 默认的 `default-tenant` 将回退到项目的全局配置目录，确保向后兼容。

### 🚦 企业级滑动窗口限流 (Rate Limiting)
为了防止恶意滥用或意外的流量激增（如 Agent 死循环），本服务内置了**零依赖的滑动窗口限流器（Sliding Window Rate Limiter）**。
- **默认阈值**：每个租户 **60 次请求 / 分钟**。
- **超限响应**：HTTP 429 Too Many Requests。
- **内存安全**：内置后台定期清理机制，自动回收长期不活跃的租户令牌记录。

> 配置方式：无需额外依赖，服务启动即生效。后续可通过环境变量 `MCP_RATE_LIMIT_MAX` 与 `MCP_RATE_LIMIT_WINDOW_MS` 进行深度定制。

## 核心能力矩阵

| 类型 | 名称 | 说明 |
|---|---|---|
| **Resource** | `project://playbook` | **核心**：团队业务事实与技术规约。 |
| **Skill** | `review` / `investigate` | 原生 SEP-2640，可分发的 AI 资产。 |
| **Tool** | `read_file` / `search_code` | 基础文件检索。 |


## 🏢 企业级动态装配（v1.6.0）

在 v1.6.0 中，MCP Server 不再是一股脑暴露所有工具。它通过 **Capability Registry** 将工具降维成插件，并根据 **Workflow Manifest** 进行装配。

**对用户的价值：**
1. **更懂你的 AI**：你可以声明一个“代码审查”工作流。当你在 Cursor/Claude 中发起审查时，Server 只会挂载 `read_file` 和 `search_code`，从而大幅减少上下文占用，让 AI 回复更精准。
2. **跨平台扩展**：`list_issues` 是一个 GitHub 实现的能力包。如果你的团队用 Jira，只需开发一个 Jira 能力包，无需修改 Server 核心代码。

**自定义装配能力：**
在 `packages/core` 中定义你的 `WorkflowManifest`，Server 启动时会自动按阶段（`context-gathering`, `execution`）按需装载。

