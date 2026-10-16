# @tda/mcp-server

Model Context Protocol Server，暴露 Tools / Prompts / Resources。

## 能力

| 类型 | 名称 | 说明 |
|---|---|---|
| **Tool** | `read_file` | 读取文件 |
| **Tool** | `search_code` | 搜索代码 |
| **Tool** | `list_issues` | 查询 Issue |
| **Prompt** | `code_review` | 代码评审模板 |
| **Resource** | `project://files` | 项目文件索引 |

## 接入 Claude Desktop

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

重启 Claude Desktop，可在对话中直接调用。

## 接入 Cursor

Settings → MCP → Add Server，配置同上。

## 调试

```bash
npx @modelcontextprotocol/inspector npx tsx packages/mcp-server/src/index.ts
```
