# Team Dev Assistant

> 面向研发团队的 AI Agent 工具集：一条命令启动代码评审、问题排查、Issue 汇总三类 Agent，支持 CLI / A2A / MCP 接入，多 Agent 协作。内置可观测性（LLM/Agent trace）、安全加固（防命令注入/路径穿越）与评估体系（回归用例），开箱可用。

AI Agent monorepo —— 代码评审、问题排查、Issue 汇总，支持 CLI / A2A / MCP 三种入口。

[![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/timerwhou/team-dev-assistant)](https://github.com/timerwhou/team-dev-assistant/releases)
[![Docker](https://img.shields.io/badge/ghcr.io-timerwhou%2Fteam--dev--assistant-blue?logo=docker&logoColor=white)](https://github.com/<你的用户名>/team-dev-assistant/pkgs/container/team-dev-assistant)
[![Eval](https://github.com/timerwhou/team-dev-assistant/actions/workflows/eval.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/eval.yml)
[![CodeQL](https://github.com/timerwhou/team-dev-assistant/actions/workflows/codeql.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/codeql.yml)

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
