# Team Dev Assistant

[![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/timerwhou/team-dev-assistant?color=orange&label=release)](https://github.com/timerwhou/team-dev-assistant/releases/latest)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io%2Ftimerwhou%2Fteam--dev--assistant-blue?logo=docker)](https://github.com/timerwhou/team-dev-assistant/pkgs/container/team-dev-assistant)
[![Eval](https://img.shields.io/badge/Eval-passing-brightgreen)](https://timerwhou.github.io/team-dev-assistant/eval/)
[![CodeQL](https://img.shields.io/badge/CodeQL-passing-brightgreen)](https://github.com/timerwhou/team-dev-assistant/security/code-scanning)

**面向 AI Agent 研发的团队级架构记忆体** —— 统一沉淀业务事实与技术规约，消除跨模型/跨工作流认知偏差。

## 🧠 核心引擎：Team Playbook (Architecture Memory)

**1.0.0 核心跃升：从“单次执行工具”变为“具备自演进架构记忆的研发基座”。**

- **捕获**：开发者通过 `// @fact` 注释或 HITL 确认，自动沉淀业务事实与决策。
- **约束**：包含决策 (Decision) 与 否决方案 (Alternatives) 的结构化资产，强制约束 AI 幻觉。
- **注入**：通过 `/inject` 导出外部模型背景包，或通过 MCP 协议供内部 IDE 自动读取。

### 架构一览

```text
[ 开发者 / IDE / 外部大模型 ]
       │              │
  (MCP 自动注入)   (CLI /inject 注入)
       │              │
       ▼              ▼
┌───────────────────────────────┐
│        Team Playbook          │
│ (docs/playbook: Fact / Stack) │
│ - decision / rationale 决策   │
└───────────────────────────────┘
       ▲              ▲
       │              │
 (HITL 确认沉淀)  (代码 @fact 扫描)
       │              │
┌───────────────────────────────┐
│          Agent Loop           │
│ (Coordinator / Eval / Tools)  │
└───────────────────────────────┘
```

## 🚀 全栈接入生态

本项目提供多形态接入，满足不同研发场景的需求：

### 1. 作为 MCP Server（原生支持 Skills Extension）
本项目是首批原生实现 **SEP-2640 Skills Extension** 的 MCP Server 之一。
- **Resources**：暴露 `project://playbook`，IDE 自动读取架构约束。
- **Skills**：提供 `/review`、`/investigate`、`/issues` 等可分发的 AI 资产。
- **Tools / Prompts**：提供基础代码检索与评审模板。

**Cursor / Windsurf 接入**：
在 `~/.cursor/mcp.json` 中添加：
```json
{
  "mcpServers": {
    "team-dev-assistant": {
      "command": "npx",
      "args": ["-y", "@tda/mcp-server"],
      "env": { "OPENAI_API_KEY": "your-api-key" }
    }
  }
}
```

**Claude Code 接入**：
```bash
claude mcp add-json team-dev-assistant '{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@tda/mcp-server"],
  "env": { "OPENAI_API_KEY": "your-api-key" }
}'
```

### 2. 作为 A2A Agent（多 Agent 协作 + HITL）
支持 WebSocket BiDi Streaming，通过 Elicitation 实现实时人工介入。人类的确认结果会自动沉淀为 Playbook Fact。
```bash
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"
```

### 3. 作为 CLI 工具（外部大模型背景包）
在去网页版大模型试错前，一键提取项目背景：
```bash
pnpm dev "/inject 设计一个支付回调"
# 复制输出的高密度 Prompt，粘贴给 ChatGPT / Claude Web
```

## 🛡️ 安全部署指南

在生产环境运行 MCP Server 时，请务必遵循最小权限原则，防止容器逃逸与未授权访问。

### 1. 启用鉴权 (HTTP 模式)
设置 `MCP_API_KEY` 环境变量，外部客户端调用时必须携带 `Authorization: Bearer <your-key>` 头。

### 2. 只读挂载与能力剥离
使用以下 Docker 命令启动容器，确保文件系统只读，并移除所有特权 Capabilities：

```bash
docker run -d --rm \
  -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e MCP_API_KEY=your-secure-token \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  -v $(pwd)/docs/playbook:/app/docs/playbook:ro \
  ghcr.io/timerwhou/team-dev-assistant:latest
```

> **注意**：由于 `--read-only` 限制了写入，容器内部无法修改文件。Playbook 资产通过外部的只读挂载（`:ro`）注入，防止恶意代码被篡改后持久化。

## 🏗️ 核心特性

- **Team Playbook**：业务事实与技术规约的沉淀闭环。
- **Context Engineering**：工具结果压缩，长任务最高节省 98.4% 的 token 消耗。
- **Eval Regression Gate**：基于 Trace 轨迹断言，在 CI 中拦截 Prompt 改动导致的能力退化。
- **安全与容错**：防命令注入、防路径穿越，入参受 Zod 严格校验。

## ⚠️ 边界声明 (Out of Scope)

- **v1.0 不提供向量数据库**：Playbook 检索基于 `KeywordRetriever`（字面与关键词匹配）。语义混合检索已在 Roadmap 中。
- **不替代 Confluence / Notion**：Playbook 存储在 Git 仓库，与代码同生共死，面向开发者而非产品经理。
- **Skills Extension 的客户端原生支持仍在早期**：虽然 MCP Server 已声明 `io.modelcontextprotocol/skills` 扩展，但目前仅 `mcpc` 等少数 CLI 工具完整支持，主流 IDE 仍以 `project://playbook` Resource 为主要接入方式。

## 🤝 版本兼容承诺

- **Playbook YAML Schema**：在 1.x 版本内保持向后兼容。新增字段（如未来的 `supersedes`）不会破坏现有解析逻辑。
- **MCP 协议**：当前支持 `stdio` 传输。`Streamable HTTP` 将在 v1.1 中引入，不会破坏现有本地接入方式。

## 🗺️ Roadmap

我们致力于将 Team Dev Assistant 从“单点本地辅助工具”演进为“跨端共享的团队级研发基座”。后续计划如下：

### v1.1 — 智能引擎升级与外部接入
- **检索层架构演进与决策图谱（Story #79）**：从字面匹配升级为语义混合检索（BM25 + Embedding），支持 1-hop 扩展召回，精准理解“为什么不用 Redis”等复杂决策链。
- **支持外部 Agent 平台（Streamable HTTP）**：突破本地 stdio 限制，让网页版 Agent 平台（Dify、Coze）或局域网服务通过标准 HTTP 协议接入 Playbook。

### v1.2 — 生产级加固与生态繁荣
- **生产级安全边界加固**：完善运行时的最小权限控制，支持只读挂载、剥离 Linux Capabilities、网络策略隔离与最小化 Token Scope。
- **Skill 独立版本管理**：在 SKILL.md 中引入 version 字段，支持在 skills/list 中感知技能的热更新。
- **可观测性聚合指标**：提供面向运维的 API，输出请求延迟、错误率与 Fact 增长趋势。

## 📚 文档

完整指南：[Team Dev Assistant 文档站](https://timerwhou.github.io/team-dev-assistant/)

## 📄 License
[MIT](LICENSE)
