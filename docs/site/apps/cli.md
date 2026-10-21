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
