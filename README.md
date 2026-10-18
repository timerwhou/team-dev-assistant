# Team Dev Assistant

> 面向研发团队的 AI Agent 工具集：支持 CLI / MCP / A2A 三种接入，具备多 Agent 协作、Context Engineering、Eval Regression Gate 与 HITL 能力，开箱即用。

[![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/timerwhou/team-dev-assistant)](https://github.com/timerwhou/team-dev-assistant/releases)
[![Docker](https://img.shields.io/badge/ghcr.io-timerwhou%2Fteam--dev--assistant-blue?logo=docker&logoColor=white)](https://github.com/timerwhou/team-dev-assistant/pkgs/container/team-dev-assistant)
[![Eval](https://github.com/timerwhou/team-dev-assistant/actions/workflows/eval.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/eval.yml)
[![CodeQL](https://github.com/timerwhou/team-dev-assistant/actions/workflows/codeql.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/codeql.yml)

## Context Engineering

在 `@tda/core` 显式化上下文组装层，实现 Tool Context 压缩与 Token 预算控制。

| 用例 | 无压缩 | 有压缩 | 节省 |
|---|---|---|---|
| investigate-convergence | 240,160 tokens | 3,830 tokens | **-98.4%** |
| investigate-no-sql | 55,594 tokens | 4,969 tokens | **-91.1%** |

详见 [Context Engineering 文档](https://timerwhou.github.io/team-dev-assistant/context/)。

## Eval Gate

基于 Trace 的回归门禁，确保 Prompt 改动不会导致 Agent 能力退化。

- **轨迹断言**：不只测最终输出，还测工具链 / 步数 / 收口原因
- **CI 门禁**：PR 时自动跑 critical 子集（约 106s），退化阻塞合并
- **质量仪表盘**：文档站展示最新评估报告

详见 [Eval Gate 文档](https://timerwhou.github.io/team-dev-assistant/eval/)。

## A2A v1.1 BiDi & HITL

基于 A2A 协议 v1.1，支持 WebSocket BiDi Streaming 与 HITL。

- **Elicitation**：Agent 在执行中遇到歧义，通过 Elicitation 暂停任务并向 CLI 提问
- **MRTR**：人工输入后，任务通过 MRTR 语义恢复，从断点继续执行
- **协议兼容**：Agent Card 同时声明 HTTP 和 WebSocket 接口，兼容 v1.0 客户端

详见 [A2A 文档](https://timerwhou.github.io/team-dev-assistant/a2a/)。

## 架构

```
packages/
  core/          纯逻辑层（LLM / Agent / Context / Schema / trace）
  tools/         工具集（read_file / search_code / list_issues）
  skills/        Skill 系统（review / investigate / issues）
  a2a/           A2A 协议（server + client + WebSocket）
  mcp-server/    MCP Server（Tools + Prompts + Resources）
apps/
  cli/           命令行入口
  reviewer/      代码评审 Agent（A2A）
  investigator/  问题排查 Agent（A2A）
  coordinator/   多 Agent 协调器（支持 HITL）
eval/            评估集（带 Eval Gate）
```

## Docker

```bash
docker pull ghcr.io/timerwhou/team-dev-assistant:latest

docker run --rm -e OPENAI_API_KEY=sk-xxx \
  ghcr.io/timerwhou/team-dev-assistant:latest \
  pnpm --filter @tda/cli dev -- /help
```

详见 [GHCR 部署文档](https://timerwhou.github.io/team-dev-assistant/deploy/ghcr)。

## 快速开始

```bash
pnpm install
cp .env.example .env  # 填入 OPENAI_API_KEY

# 单 Agent CLI
pnpm dev "/review apps/cli/src/index.ts"

# 多 Agent 协作（A2A）
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"

# 体验 HITL（输入 y 确认）
pnpm --filter @tda/coordinator dev "[elicit] package.json"

# 评估集（Eval Gate）
pnpm eval
```

## 能力

- ✅ Prompt Engineering（SystemPrompt + Few-shot + CoT + 结构化输出）
- ✅ Function Calling / 多轮 Tool Use
- ✅ Agent 收敛（语义进展信号 + 完成条件清单 + 硬兜底）
- ✅ Skill 系统（声明式 + 工具白名单）
- ✅ MCP Server（Tools + Prompts + Resources）
- ✅ A2A v1.1（WebSocket BiDi + MRTR + Elicitation）
- ✅ Context Engineering（Tool Context 压缩 + Token 预算）
- ✅ Eval Regression Gate（Trace 断言 + CI 门禁）
- ✅ 安全（防命令注入、防路径穿越）
- ✅ 可观测性（LLM/Agent/Trace 记录 + 成本统计）

## License

MIT
