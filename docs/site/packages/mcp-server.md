# @tda/mcp-server

Model Context Protocol Server，原生支持 **Tools / Prompts / Resources / Skills**。

## 核心能力矩阵

| 类型 | 名称 | 说明 |
|---|---|---|
| **Resource** | `project://playbook` | **核心**：团队业务事实与技术规约，供 IDE 自动注入。 |
| **Skill** | `review` / `investigate` / `issues` | **原生 SEP-2640**：可分发的 AI 资产，包含 Prompt、工具白名单与步数。 |
| **Prompt** | `code_review` | 代码评审模板 |
| **Tool** | `read_file` / `search_code` | 基础文件与代码搜索 |

## 为什么选择 Skills Extension (SEP-2640)？

Skill 不再是写死在代码里的 Prompt，而是**协议层的资源**。客户端可以通过 `skills/list` 和 `skills/get` 像读取文件一样读取和分发团队的 AI 资产。本项目原生实现了该扩展，确保您的团队技能在任何支持 SEP-2640 的生态中无缝流转。

## 客户端接入指南

### Cursor / Windsurf
在 `~/.cursor/mcp.json` 中添加：

```json
{
  "mcpServers": {
    "team-dev-assistant": {
      "command": "npx",
      "args": ["-y", "tsx", "packages/mcp-server/src/index.ts"],
      "env": { "OPENAI_API_KEY": "your-api-key" }
    }
  }
}
```

### Claude Code (CLI)
在终端中运行：

```bash
claude mcp add-json team-dev-assistant '{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "tsx", "packages/mcp-server/src/index.ts"],
  "env": { "OPENAI_API_KEY": "your-api-key" }
}'
```

### Claude Desktop
编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS），结构与上方 `mcpServers` 一致。

## 进阶：Skill vs Resource 的使用建议
- **优先使用 `project://playbook` (Resource)**：兼容所有支持 MCP 的客户端，用于获取项目上下文。
- **使用 Skill**：在支持 SEP-2640 的 Agent 框架（如 `mcpc` 或未来的 Cursor 版本）中，通过 `skills/get` 获取完整的工作流定义。


## 传输层支持矩阵

| 传输方式 | 状态 | 适用场景 |
|---|---|---|
| **stdio** | ✅ 已支持 | 本地 IDE 接入（Cursor / Claude Desktop / Claude Code） |
| **Streamable HTTP** | 🚧 Roadmap (v1.1) | 远程团队共享、多租户 SaaS 部署 |

## 安全部署指南

在生产环境或 CI 中运行 MCP Server 时，请遵循最小权限原则：

```bash
# 推荐：只读挂载、剥离 capabilities、不保留网络
docker run --rm -it \
  --read-only \
  --cap-drop=ALL \
  -v $(pwd):/app:ro \
  ghcr.io/timerwhou/team-dev-assistant:v1.0.0
```

> **注意**：`stdio` 模式下，MCP Server 运行在用户的本地环境中，拥有同等的文件系统访问权限。请确保只从官方仓库或可信镜像构建。
