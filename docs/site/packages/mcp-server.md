# @tda/mcp-server

Model Context Protocol Server，原生支持 **Tools / Prompts / Resources / Skills**，并支持双轨制接入。

## 传输模式矩阵

| 模式 | 环境变量 | 适用场景 | 鉴权机制 |
|---|---|---|---|
| **stdio** | `MCP_TRANSPORT=stdio` (默认) | 本地 IDE (Cursor / Claude Code) | 依赖本地进程信任 |
| **HTTP** | `MCP_TRANSPORT=http` | 远程 Agent (Dify / Coze) | 支持 `MCP_API_KEY` |

## 远程 HTTP 接入指南

### 1. 启动 HTTP Server
```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 MCP_API_KEY=your-secret pnpm --filter @tda/mcp-server dev
```

### 2. 客户端调用 (Dify / Coze)
配置 MCP 接口地址为：`http://<your-ip>:3000/mcp`。
在请求头中必须携带：
```http
Authorization: Bearer your-secret
Accept: application/json, text/event-stream
```

## 核心能力矩阵
| 类型 | 名称 | 说明 |
|---|---|---|
| **Resource** | `project://playbook` | **核心**：团队业务事实与技术规约。 |
| **Skill** | `review` / `investigate` | 原生 SEP-2640，可分发的 AI 资产。 |
| **Tool** | `read_file` / `search_code` | 基础文件检索。 |
