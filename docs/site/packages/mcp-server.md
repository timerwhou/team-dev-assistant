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

## 核心能力矩阵

| 类型 | 名称 | 说明 |
|---|---|---|
| **Resource** | `project://playbook` | **核心**：团队业务事实与技术规约。 |
| **Skill** | `review` / `investigate` | 原生 SEP-2640，可分发的 AI 资产。 |
| **Tool** | `read_file` / `search_code` | 基础文件检索。 |
