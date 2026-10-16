# Team Dev Assistant

面向研发团队的 AI Agent 工具集：一条命令启动代码评审、问题排查、Issue 汇总三类 Agent，支持 CLI / A2A / MCP 接入，多 Agent 协作。内置可观测性（LLM/Agent trace）、安全加固（防命令注入/路径穿越）与评估体系（回归用例），开箱可用。

## 文档导航

- [[Architecture]] — 架构设计与技术决策
- [[Demo]] — 3 分钟演示脚本
- [[Resume]] — 简历素材与面试 Q&A

## 快速开始

```bash
git clone https://github.com/timerwhou/team-dev-assistant.git
cd team-dev-assistant
pnpm install
cp .env.example .env
pnpm dev "/review apps/cli/src/index.ts"
```
