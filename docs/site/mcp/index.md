# MCP 集成

`@tda/mcp-server` 是项目的 MCP Server，暴露 Tools / Prompts / Resources / **Skills**。

## 支持的协议版本

| 版本 | 状态 | 说明 |
|---|---|---|
| **2026-07-28** | ✅ 支持 | v2 SDK（`@modelcontextprotocol/server@2.3.1`） |
| **2025-11-25** | ✅ 支持 | v1 兼容（逐步淘汰） |
| **2025-06-18** | ✅ 支持 | v2 SDK 默认协商版本 |

## 能力矩阵

| 类型 | 名称 | 说明 |
|---|---|---|
| **Tool** | `read_file` | 读取 monorepo 内的文件 |
| **Tool** | `search_code` | 用 ripgrep 搜索代码 |
| **Tool** | `list_issues` | 查询 GitHub Issue |
| **Prompt** | `code_review` | 代码评审模板 |
| **Resource** | `project://files` | 项目文件索引 |
| **Resource** | `project://playbook` | 团队业务事实与技术规约（架构记忆体） |
| **Skill** | `skill://review/SKILL.md` | 代码评审 Skill（见 [Skills](/skills/)） |
| **Skill** | `skill://investigate/SKILL.md` | 问题排查 Skill |
| **Skill** | `skill://issues/SKILL.md` | Issue 汇总 Skill |

## 快速开始

```bash
# 启动 MCP Server
pnpm --filter @tda/mcp-server dev

# 或用 MCP Inspector 调试
npx @modelcontextprotocol/inspector pnpm --filter @tda/mcp-server dev
```

## 相关文档

- [客户端支持矩阵](/mcp/client-compat)
- [ADR-0002: Upgrade to MCP v2](/adr/0002-upgrade-to-mcp-v2)
