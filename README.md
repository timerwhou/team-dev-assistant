# Team Dev Assistant

> 面向研发团队的 AI Agent 工具集：一条命令启动代码评审、问题排查、Issue 汇总三类 Agent，支持 CLI / A2A / MCP 接入，多 Agent 协作。内置可观测性（LLM/Agent trace）、安全加固（防命令注入/路径穿越）与评估体系（回归用例），开箱可用。

[![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/timerwhou/team-dev-assistant)](https://github.com/timerwhou/team-dev-assistant/releases)
[![Docker](https://img.shields.io/badge/ghcr.io-timerwhou%2Fteam--dev--assistant-blue?logo=docker&logoColor=white)](https://github.com/timerwhou/team-dev-assistant/pkgs/container/team-dev-assistant)
[![Eval](https://github.com/timerwhou/team-dev-assistant/actions/workflows/eval.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/eval.yml)
[![CodeQL](https://github.com/timerwhou/team-dev-assistant/actions/workflows/codeql.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/codeql.yml)

## A2A 双向流与 HITL

项目基于 A2A 协议 v1.1，支持 WebSocket 双向流与人类在环（Human-in-the-Loop）。

### 核心能力

- **实时澄清**：Agent 在执行中遇到歧义，通过 Elicitation 暂停任务并向 CLI 提问
- **无缝恢复**：人类输入后，任务通过 MRTR 语义恢复，从断点继续执行
- **协议兼容**：Agent Card 同时声明 HTTP 和 WebSocket 接口，兼容 v1.0 客户端

详见 [A2A 文档](https://timerwhou.github.io/team-dev-assistant/a2a/)。

## Eval Gate（质量门禁）

基于 Trace 的回归门禁，确保 Prompt 改动不会导致 Agent 能力退化。

### 核心能力

- **轨迹断言**：不只测最终输出，还测工具链 / 步数 / 收口原因
- **CI 门禁**：PR 时自动跑 critical 子集（约 106s），退化阻塞合并
- **质量仪表盘**：文档站展示最新评估报告

### 收益（v0.5.0 实测）

| 指标 | 值 |
|---|---|
| Critical 子集通过率 | **3/3（100%）** |
| CI 耗时 | 1m46s |

详见 [Eval Gate 文档](https://timerwhou.github.io/team-dev-assistant/eval/)。

## Context Engineering

在 `@tda/core` 显式化上下文组装层，实现工具结果压缩与 Token 预算控制。

### 收益（v0.4.0 实测）

| 用例 | 无压缩 | 有压缩 | 节省 |
|---|---|---|---|
| investigate-convergence | 240,160 tokens | 3,830 tokens | **-98.4%** |
| investigate-no-sql | 55,594 tokens | 4,969 tokens | **-91.1%** |

详见 [Context Engineering 文档](https://timerwhou.github.io/team-dev-assistant/context/)。

## 架构

```
packages/
  core/          纯逻辑层（LLM/Agent/Schema/search-code/trace）
  tools/         工具集（read_file/search_code/list_issues）
  skills/        Skill 系统（review/investigate/issues）
  a2a/           A2A 协议（server + client）
  mcp-server/    MCP Server（Tools + Prompts + Resources）
apps/
  cli/           命令行入口
  reviewer/      代码评审 Agent（A2A）
  investigator/  问题排查 Agent（A2A）
  coordinator/   多 Agent 协调器
eval/            评估集（8 个用例）
```

## Docker

```bash
# 拉取镜像
docker pull ghcr.io/timerwhou/team-dev-assistant:latest

# 运行 CLI
docker run --rm -e OPENAI_API_KEY=sk-xxx \
  ghcr.io/timerwhou/team-dev-assistant:latest \
  pnpm --filter @tda/cli dev -- /help
```

详见 [GHCR 部署文档](https://timerwhou.github.io/team-dev-assistant/deploy/ghcr)。

## 快速开始

```bash
# 安装
pnpm install
cp .env.example .env  # 填入 OPENAI_API_KEY

# 单 Agent CLI
pnpm dev "/review apps/cli/src/index.ts"
pnpm dev "/investigate 项目里有没有 SQL 注入"

# 多 Agent 协作
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"

# 评估集
pnpm eval

# 全量验证
bash scripts/health-check.sh
```

## 能力

- ✅ Prompt 工程（SystemPrompt + Few-shot + CoT + 结构化输出）
- ✅ Function Calling / 多轮 Tool Use
- ✅ Agent 收敛（语义进展信号 + 完成条件清单 + 硬兜底）
- ✅ Skill 系统（声明式 + 工具白名单）
- ✅ MCP Server（Tools + Prompts + Resources）
- ✅ A2A 多 Agent 协作
- ✅ 安全（防命令注入、防路径穿越）
- ✅ 可观测性（LLM/Agent trace + 成本统计）
- ✅ 评估集（防 prompt 退化）
- ✅ CI（GitHub Actions）

## License

MIT
