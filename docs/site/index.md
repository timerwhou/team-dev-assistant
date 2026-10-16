---
layout: home

hero:
  name: Team Dev Assistant
  text: AI Agent monorepo
  tagline: 面向研发团队的 AI Agent 工具集：一条命令启动代码评审、问题排查、Issue 汇总三类 Agent，支持 CLI / A2A / MCP 接入，多 Agent 协作。内置可观测性（LLM/Agent trace）、安全加固（防命令注入/路径穿越）与评估体系（回归用例），开箱可用。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/timerwhou/team-dev-assistant
    - theme: alt
      text: 架构设计
      link: /guide/architecture

features:
  - icon: 🤖
    title: 多 Agent 协作
    details: Coordinator 通过 A2A 协议发现并派活给 Reviewer / Investigator 两个 Agent，独立进程、标准协议。

  - icon: 🔧
    title: Function Calling
    details: 支持多轮 Tool Use，语义进展信号 + 三层收敛机制，避免 Agent 打转。

  - icon: 🔌
    title: MCP Server
    details: 暴露 Tools / Prompts / Resources，Claude Desktop、Cursor 可直接接入。

  - icon: 🛡️
    title: 安全加固
    details: execFile 防命令注入；path.relative 防路径穿越；回归测试覆盖攻击用例。

  - icon: 📊
    title: 可观测性
    details: LLM/Agent/Tool trace，记录 token / 耗时 / 成本 / stopReason。

  - icon: 🧪
    title: 评估集
    details: 8 个用例覆盖 review / investigate / security，防止 prompt 退化。

  - icon: 🐳
    title: 容器化
    details: docker compose 一键起多 Agent，6 秒启动。

  - icon: ⚙️
    title: 工程化
    details: pnpm workspace（11 个包）+ GitHub Actions + Release Please + Dependabot。
