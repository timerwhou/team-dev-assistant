---
layout: home

hero:
  name: Team Dev Assistant
  text: 具备自演进架构记忆的团队级研发基座
  tagline: 统一沉淀业务事实与技术规约，提供可视化工作流编排、实时执行观测与智能资产化管理。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 了解核心架构
      link: /guide/architecture
    - theme: alt
      text: GitHub 源码
      link: https://github.com/timerwhou/team-dev-assistant

features:
  - icon: 🧠
    title: 架构记忆体 (Playbook)
    details: 统一管理 Fact 和 Stack。BM25 + Embedding 混合检索与决策图谱扩展，彻底防止 AI 重复造轮子与幻觉。
    link: /packages/core
  - icon: 🎨
    title: 可视化编排 (Studio)
    details: 基于 Svelte Flow 的拖拽画布。支持节点级能力绑定、SSE 实时执行高亮，以及历史 Trace 的瞬间回放。
    link: /apps/studio
  - icon: 🗂️
    title: 资产化管理 (Gallery)
    details: 支持多套 WorkflowManifest 的持久化、版本冲突校验与一键加载。让研发工作流像代码一样被资产管理。
    link: /apps/studio
  - icon: 🤖
    title: 自演进闭环 (Agentic Loop)
    details: 内置执行记忆与动态评估器。能够根据历史经验自动调整多轮深挖策略，让基座越用越聪明。
    link: /packages/core
  - icon: 🌐
    title: 双轨制 MCP 接入
    details: 支持本地 stdio (Cursor) 与远程 Streamable HTTP (Dify/Coze) 接入。内置 OAuth 2.1 多租户隔离与滑动限流。
    link: /packages/mcp-server
  - icon: 🛡️
    title: 生产级安全防护
    details: 全链路日志脱敏、严格的路径穿越 (Path Traversal) 校验，确保企业级私有化部署绝对安全。
    link: /deploy/ghcr
  - icon: 💡
    title: AI 辅助规划与无感协同
    details: 终端输入 /plan 自动拆解需求并同步 GitHub Issue；通过 /todo 随手记录灵感，绝不打断当前开发心流。
    link: /apps/cli
  - icon: 🧪
    title: Eval Regression Gate
    details: 基于 Trace 轨迹断言，在 CI 中自动拦截 Prompt 或工具链改动导致的能力退化。
    link: /eval/
---
