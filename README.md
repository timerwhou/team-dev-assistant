# Team Dev Assistant

[![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/timerwhou/team-dev-assistant?color=orange&label=release)](https://github.com/timerwhou/team-dev-assistant/releases/latest)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io%2Ftimerwhou%2Fteam--dev--assistant-blue?logo=docker)](https://github.com/timerwhou/team-dev-assistant/pkgs/container/team-dev-assistant)
[![Eval](https://img.shields.io/badge/Eval-passing-brightgreen)](https://timerwhou.github.io/team-dev-assistant/eval/)
[![CodeQL](https://img.shields.io/badge/CodeQL-passing-brightgreen)](https://github.com/timerwhou/team-dev-assistant/security/code-scanning)

**具备自演进架构记忆的团队级研发基座** —— 统一沉淀业务事实与技术规约，提供可视化工作流编排、实时执行观测与智能资产化管理。

> 💡 **为什么需要它？**
> 当团队使用 Cursor 或网页版大模型开发时，经常遇到：AI 不知道项目里已有 `CostService`，强行重复造轮子；新模型不知道你们曾因丢消息否决过 Redis，顺着需求胡编方案。
> **Team Dev Assistant** 通过让 AI 拥有团队的“长期记忆（Playbook）”，并配备“可视化调试台”，彻底解决幻觉与上下文断裂。

## 🏗️ 核心价值支柱

- **🧠 架构记忆**：BM25 + Embedding 语义检索，配合决策图谱 1-hop 扩展，防止 AI 重复造轮子。
- **🎨 可视化编排**：拖拽式画布，支持 SSE 实时高亮与历史 Trace 回放。
- **🗂️ 资产管理**：多工作流 Manifest 的持久化与版本管理，让研发流程像代码一样被管理。
- **🤖 自演进闭环**：基于历史经验自动调整多轮深挖策略，越用越聪明。
- **🛡️ 企业级安全**：双轨制 MCP 接入，支持 OAuth 2.1 鉴权、多租户隔离、全链路日志脱敏。

## 🚀 快速开始

### 1. 本地 IDE 接入 (Cursor)
在配置文件中直接通过 `npx` 拉起：
```json
{
  "mcpServers": {
    "team-dev-assistant": {
      "command": "npx",
      "args": ["-y", "@tda/mcp-server"]
    }
  }
}
```

### 2. 可视化编排 (Studio)
启动 HTTP 服务即可访问 Studio：
```bash
MCP_TRANSPORT=http pnpm --filter @tda/mcp-server dev
```
浏览器访问 `http://localhost:3000/studio` 即可体验拖拽编排与实时调试。

### 3. 终端 CLI 协同
```bash
pnpm dev "/inject --agentic 实现订单推送"
```

## 🛡️ 生产级安全部署
```bash
docker run -d --rm \
  -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e MCP_API_KEY=your-secure-token \
  --read-only \
  --cap-drop=ALL \
  -v $(pwd)/docs/playbook:/app/docs/playbook:ro \
  ghcr.io/timerwhou/team-dev-assistant:latest
```

## 📚 文档
详细设计思路与部署指南：[Team Dev Assistant 文档站](https://timerwhou.github.io/team-dev-assistant/)

## 📄 License
[MIT](LICENSE)
