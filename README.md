# Team Dev Assistant

[![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/timerwhou/team-dev-assistant?color=orange&label=release)](https://github.com/timerwhou/team-dev-assistant/releases/latest)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io%2Ftimerwhou%2Fteam--dev--assistant-blue?logo=docker)](https://github.com/timerwhou/team-dev-assistant/pkgs/container/team-dev-assistant)
[![Eval](https://img.shields.io/badge/Eval-passing-brightgreen)](https://timerwhou.github.io/team-dev-assistant/eval/)
[![CodeQL](https://img.shields.io/badge/CodeQL-passing-brightgreen)](https://github.com/timerwhou/team-dev-assistant/security/code-scanning)

**面向 AI Agent 研发的团队级架构记忆体** —— 统一沉淀业务事实与技术规约，消除跨模型/跨工作流认知偏差。

> 💡 **为什么需要它？**
> 当团队使用 Cursor 或网页版大模型开发时，经常遇到：AI 不知道项目里已有 `CostService`，强行重复造轮子；新模型不知道你们曾因丢消息否决过 Redis，顺着需求胡编方案。
> **Team Dev Assistant** 通过让 AI 拥有团队的“长期记忆（Playbook）”，彻底解决幻觉与上下文断裂。

## 🏗️ 核心能力

- **Team Playbook**：支持 BM25 + Embedding 语义混合检索与决策图谱 1-hop 扩展。
- **双轨制 MCP (v1.2.0)**：支持本地 `stdio` 与远程 `Streamable HTTP` 接入，内置 OAuth 2.1 鉴权。
- **多 Agent 冲突治理 (v1.4.0)**：AI 写入业务事实时若发生冲突，自动静默暂存 `.pending/`，不再阻塞流程，由人类事后集中裁决。
- **AI 规划与协同 (v1.4.0)**：通过 `/plan` 结合上下文自动拆解需求，通过 `/todo` 无感收集临时任务。

## 🚀 快速开始

### 1. 本地 IDE (Cursor / Claude Code)
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

### 2. 终端 CLI 协同
```bash
# 记录临时想法，不打断当前开发
pnpm dev "/todo 补充 OAuth 回调的异常测试"

# 让 AI 结合项目基座拆解需求
pnpm dev "/plan 增加 OAuth 登录"

# 提取高密度 Prompt 发送给外部大模型
pnpm dev "/inject 我要做一个订单推送功能"
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
