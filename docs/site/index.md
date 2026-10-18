---
layout: home

hero:
  name: Team Dev Assistant
  text: AI Agent 研发助手
  tagline: 面向研发团队的 AI Agent 工具集：支持 CLI / MCP / A2A 三种接入，具备多 Agent 协作、Context Engineering、Eval Regression Gate 与 HITL 能力，开箱即用。
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
  - icon: 🧠
    title: Context Engineering
    details: 工具结果压缩与 Token 预算控制，长任务最高节省 98.4% 的 token 消耗。

  - icon: 🧪
    title: Eval Regression Gate
    details: 基于 Trace 轨迹断言，在 CI 中拦截 Prompt 改动导致的能力退化。

  - icon: 🤝
    title: A2A v1.1 & HITL
    details: 支持 WebSocket BiDi Streaming，通过 Elicitation 与 MRTR 实现 HITL。

  - icon: 🤖
    title: 多 Agent 协作
    details: Coordinator 通过 A2A 协议发现并派活给 Reviewer / Investigator 两个 Agent。

  - icon: 🔌
    title: MCP Server
    details: 暴露 Tools / Prompts / Resources，兼容 Claude Desktop 与 Cursor。

  - icon: 🛡️
    title: 安全加固
    details: 防命令注入、防路径穿越，工具调用与参数校验双重防护。

  - icon: 📊
    title: 可观测性
    details: LLM / Agent / Trace 记录，完整掌握耗时、Token 成本与收口原因。

  - icon: 🧩
    title: Agent Skills
    details: 声明式 Prompt + 工具白名单，内置代码评审、问题排查与 Issue 汇总，支持按需扩展。
