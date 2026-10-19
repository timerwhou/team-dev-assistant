---
layout: home

hero:
  name: Team Dev Assistant
  text: 让 AI 拥有团队的“长期记忆”
  tagline: 面向 AI Agent 研发的团队级架构记忆体。消除重复造轮子与幻觉，支持语义混合检索与双轨制接入。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 了解核心架构
      link: /guide/architecture
    - theme: alt
      text: GitHub
      link: https://github.com/timerwhou/team-dev-assistant

features:
  - icon: 🛡️
    title: 业务防幻觉 (Facts)
    details: 将“严禁自行计算成本，必须复用 CostService”写入 Playbook，AI 生成代码时自动施加约束。

  - icon: 🧠
    title: 决策溯源 (Decisions)
    details: 结构化记录 Decision 与 Alternatives。让 AI 在任何时候都明白“为什么当初否决了 Redis”。

  - icon: 🔍
    title: 语义混合检索 (v1.2.0)
    details: BM25 与 Embedding 双路并发，配合 RRF 融合与决策图谱 1-hop 扩展，跨词精准召回。

  - icon: 🌐
    title: 双轨制 MCP 接入 (v1.2.0)
    details: 采用无状态设计，同时支持本地 stdio (Cursor) 与远程 Streamable HTTP (Dify/Coze) 接入。

  - icon: 🔒
    title: 企业级安全边界 (v1.2.0)
    details: HTTP 模式内置 Bearer Token 鉴权。提供 Docker 只读挂载与 Capabilities 剥离指南。

  - icon: 🤝
    title: HITL 闭环演进
    details: 人类确认修改后，系统自动将决策理由沉淀为本地 Fact，让架构记忆自我生长。

  - icon: ⚡
    title: Context Engineering
    details: 显式化上下文组装层，智能压缩工具结果（长任务最高省 98.4% Token）。

  - icon: 🧪
    title: Eval Regression Gate
    details: 基于 Trace 轨迹断言，在 CI 中自动拦截 Prompt 或工具链改动导致的能力退化。
---
