---
layout: home

hero:
  name: Team Dev Assistant
  text: 具备自演进架构记忆的研发基座
  tagline: 统一沉淀业务事实与技术规约，消除跨模型/跨工作流认知偏差。支持 CLI / MCP / A2A 接入，内置 Team Playbook 架构记忆体。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 了解 Team Playbook
      link: /guide/playbook
    - theme: alt
      text: GitHub
      link: https://github.com/timerwhou/team-dev-assistant

features:
  - icon: 🧠
    title: Team Playbook (架构记忆体)
    details: 开发者通过 // @fact 或 HITL 确认自动沉淀业务事实与决策理由，通过 MCP 与 CLI 无缝注入给外部大模型。

  - icon: ⚡
    title: Context Engineering
    details: 显式化上下文组装层，实现 Tool Context 压缩与 Token 预算控制，长任务最高节省 98.4% 的 Token 消耗。

  - icon: 🧪
    title: Eval Regression Gate
    details: 基于 Trace 轨迹断言，在 CI 中拦截 Prompt 改动导致的能力静默退化。

  - icon: 🤝
    title: A2A v1.1 & HITL
    details: 支持 WebSocket BiDi Streaming，通过 Elicitation 与 MRTR 实现人工实时介入与自动决策沉淀。

  - icon: 🔌
    title: MCP Server
    details: 暴露 Tools / Prompts / Resources / Skills，兼容 Claude Desktop 与 Cursor 等标准客户端。

  - icon: 🛡️
    title: 安全与容错
    details: 防命令注入、防路径穿越，所有工具入参均受 Zod 严格校验。

  - icon: 📊
    title: 全链路可观测性
    details: 记录 LLM / Agent / Trace 三类事件，完整掌握耗时、Token 成本与收口原因。

  - icon: 🧩
    title: Agent Skills 生态
    details: 原生实现 SEP-2640 协议，内置代码评审、问题排查等多个开箱即用的 AI 技能，支持跨客户端分发与共享。
---
