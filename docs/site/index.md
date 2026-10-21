---
layout: home

hero:
  name: Team Dev Assistant
  text: 让 AI 拥有团队的“长期记忆”与“协同规划力”
  tagline: 面向 AI Agent 研发的团队级架构记忆体。消除重复造轮子与幻觉，无缝接入研发工作流，从被动记忆走向主动协同。
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

  - icon: 💡
    title: AI 辅助规划 (v1.4.0)
    details: 终端输入 /plan 需求，自动结合 Playbook 上下文将需求拆解为带依赖关系的可执行任务清单，并同步至 GitHub Issue。

  - icon: 📝
    title: 无感任务收集 (v1.4.0)
    details: 通过 /todo 随手记录临时想法或缺陷，自动归档至本地与 GitHub 分诊池，绝不打断当前开发心流。

  - icon: 🤝
    title: 异步冲突治理 (v1.4.0)
    details: 遇到 Playbook 冲突时自动静默暂存 .pending/，不阻塞流程，通过 /review-conflicts 集中裁决冲突。

  - icon: 🔍
    title: 语义混合检索 (v1.3.0)
    details: BM25 与 Embedding 双路并发，配合 RRF 融合与决策图谱 1-hop 扩展，跨词精准召回。

  - icon: 🌐
    title: 双轨制 MCP 接入
    details: 支持本地 stdio (Cursor) 与远程 Streamable HTTP (Dify/Coze) 接入，并内置 OAuth 2.1 企业级鉴权。

  - icon: 🧪
    title: Eval Regression Gate
    details: 基于 Trace 轨迹断言，在 CI 中自动拦截 Prompt 或工具链改动导致的能力退化。
---
