# CLI 命令行

命令行入口，主要用于本地调试、单 Agent 运行及团队协作工具的调用。

## 用法

```bash
pnpm dev "/<command> [参数]"
```

## 核心命令

### 1. 任务与规划协同 (v1.4.0)
- **`/todo <描述>`**：记录一个临时任务。如果配置了 `GITHUB_TOKEN`，会自动创建带 `triage` 标签的 Issue；否则仅保存到本地 `.tda/todos.json`，绝不打断心流。
- **`/todo list`**：查看当前未处理的临时任务。
- **`/plan <需求>`**：调用 AI 结合 Playbook 上下文拆解需求，输出结构化任务列表，并支持一键批量创建 GitHub Issue。
- **`/review-conflicts`**：集中处理因 Playbook 写入冲突而暂存到 `.pending/` 目录的草稿（支持批量采纳或丢弃）。

### 2. 架构记忆体工具
- **`/inject <需求>`**：提取项目上下文（语义检索 + 图谱扩展），生成高密度 Prompt 供外部模型使用。
- **`/sync-facts`**：扫描代码中的 `@fact` 注释，自动生成标准化的 Playbook 资产。

### 3. Agent 技能
```bash
pnpm dev "/review apps/cli/src/index.ts"
pnpm dev "/investigate 项目里有没有 SQL 注入"
pnpm dev "/issues --state=open --label=bug"
```

## 环境变量

| 变量 | 作用 |
|---|---|
| `TDA_TRACE=0` | 关闭 trace 日志 |
| `TDA_TRACE_CONSOLE=1` | 将 trace 输出到控制台 |
| `TDA_VERBOSE=0` | 关闭 verbose 模式 |
| `GITHUB_TOKEN` | 配置后 `/todo` 与 `/plan` 会自动同步至 GitHub Issue |


### 🤖 Agentic 深度检索 (v1.6.0 新增)

传统的 `/inject` 是一次性检索（单轮），而新增的 Agentic 模式允许引擎进行**多轮深挖**。如果第一轮检索到的业务事实不足以支撑决策，引擎会自动触发新一轮检索，直到满足条件或达到最大轮数。

**启动 Agentic 模式：**
```bash
# 在需求前加上 --agentic 标志
/inject --agentic 我要做登录鉴权
```

**开启追踪（Trace）：**
```bash
# 设置环境变量，可以看到每一轮的检索动作与收敛状态
TDA_TRACE=1 pnpm dev "/inject --agentic 实现订单支付"
```
在 Trace 输出中，你可以清晰看到每一轮的 `retrieve`（检索）、`execute`（评估）、`complete`（完成）或 `abort`（达到最大轮数中止）的过程。引擎自带了去重机制，绝不会将相同的背景包重复叠加。



### 📊 终端看板与可观测性 (Dashboard)

研发基座默认装配了一个**轻量级的终端看板**，无需启动任何 Web 服务，让你在终端里就能洞悉 Agentic 引擎的运行状态。

**触发方式：**
在执行 `/inject` 时开启追踪环境变量：
```bash
TDA_TRACE=1 pnpm dev "/inject --agentic 我要做登录鉴权"
```

**如何阅读看板：**
终端会打印出一个清晰的 Trace 表格：
- **iteration**: 当前是第几轮深挖。
- **action**: 引擎的动作（`retrieve` 检索、`execute` 执行评估、`complete` 收敛、`abort` 停止）。
- **detail**: 引擎的心路历程（例如：“已检索到相关的业务事实或技术规约”）。

这个终端看板是**完全静默的**，不影响你原有的终端输出。未来社区的开发者可以基于这套 Trace 事件流，自行开发更丰富的 Web Dashboard 或 IDE 插件。

