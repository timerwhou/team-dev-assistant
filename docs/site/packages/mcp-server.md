# @tda/mcp-server

Model Context Protocol Server，暴露 Tools / Prompts / Resources / Skills。

## 核心能力

| 类型 | 名称 | 说明 |
|---|---|---|
| **Tool** | `read_file` / `search_code` | 基础文件与代码搜索 |
| **Prompt** | `code_review` | 代码评审模板 |
| **Skill** | `review` / `investigate` / `issues` | 原生 SEP-2640 Skills 扩展 |

## Skills Extension (SEP-2640)

项目通过 `@olaservo/ext-skills` 原生实现了 Skills Extension。Clients 可以通过 `skills/list` 和 `skills/get` 发现 Skill，或直接通过 `resources/read` 读取 `skill://` URI。

## 接入客户端

### Claude Desktop

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "team-dev-assistant": {
      "command": "npx",
      "args": ["tsx", "/绝对路径/packages/mcp-server/src/index.ts"],
      "env": { "MCP_ROOT": "/绝对路径/你的项目" }
    }
  }
}
```

### 调试

```bash
npx @modelcontextprotocol/inspector npx tsx packages/mcp-server/src/index.ts
```
