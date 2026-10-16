# 客户端支持矩阵

各 MCP 客户端对协议版本、能力、Skills Extension 的支持情况。

## 支持矩阵

| 客户端 | 协议版本 | Tools | Prompts | Resources | **Skills Extension** |
|---|---|---|---|---|---|
| **Claude Desktop** | 2025-06-18+ | ✅ | ✅ | ✅ | ⚠️ 依赖版本 |
| **Cursor** | 2025-06-18+ | ✅ | ✅ | ✅ | ⚠️ 依赖版本 |
| **Cline** | 2025-06-18+ | ✅ | ✅ | ✅ | ⚠️ 依赖版本 |
| **MCP Inspector** | 全版本 | ✅ | ✅ | ✅ | ✅ 完整支持 |

## Skills Extension 支持

Skills Extension（SEP-2640）是 **2026-07-28 规范**引入的扩展。客户端支持情况：

- **支持 Skills** → 可通过 `skills/list` / `skills/get` 发现和读取 Skill
- **不支持 Skills** → 仍可通过 `resources/read` 按 `skill://` URI 直接读取（**基础层**）

**关键**：Skill 的 URI **即使不出现在任何列表中**，也**必须**能通过 `resources/read` 读取。这是 Skills Extension 的基础层。

## 测试客户端兼容性

```bash
# 用 MCP Inspector 验证
npx @modelcontextprotocol/inspector pnpm --filter @tda/mcp-server dev
```

**验证点**：

1. Tools 标签显示 `read_file` / `search_code` / `list_issues`
2. Prompts 标签显示 `code_review`
3. Resources 标签显示 `project://files`
4. **Skills 标签显示 3 个 Skill**（如果客户端支持）

## 已知限制

| 限制 | 说明 |
|---|---|
| Claude Desktop / Cursor 对 Skills Extension 的支持 | 依赖客户端版本，**截至 2026-10 尚未全面支持** |
| 协议版本协商 | v2 SDK 默认协商 `2025-06-18`，**不强制 `2026-07-28`** |
| `resources/directory/read` | 可选扩展，需要客户端显式支持 |

## 参考

- [MCP 协议规范](https://modelcontextprotocol.io/specification)
- [SEP-2640 Skills Extension](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2640)
