# CLI 命令行

命令行入口，主要用于本地调试、单 Agent 运行及团队协作工具的调用。

## 用法
```bash
pnpm dev "/<command> [参数]"
```

## 核心命令

### 1. 架构记忆体工具
- **`/inject <需求>`**：提取项目上下文（语义检索 + 图谱扩展），生成高密度 Prompt 供外部模型使用。
  - 支持 **Agentic 模式**：`/inject --agentic <需求>`，开启多轮深挖，直至上下文充足才收敛。
  - 支持调试追踪：设置 `TDA_TRACE=1` 可在终端打印每一轮的心跳日志。
- **`/sync-facts`**：扫描代码中的 `@fact` 注释，自动生成标准化的 Playbook 资产。

### 2. 任务与规划协同
- **`/todo <描述>`**：记录一个临时任务。如果配置了 `GITHUB_TOKEN`，会自动创建带 `triage` 标签的 Issue；否则仅保存到本地 `.tda/todos.json`，绝不打断心流。
- **`/todo list`**：查看当前未处理的临时任务。
- **`/plan <需求>`**：调用 AI 结合 Playbook 上下文拆解需求，输出结构化任务列表，并支持一键批量创建 GitHub Issue。
- **`/review-conflicts`**：集中处理因 Playbook 写入冲突而暂存到 `.pending/` 目录的草稿（支持批量采纳或丢弃）。

### 3. Agent 技能 (Skills)
- **`/review <文件路径>`**：对指定文件进行代码评审。
- **`/investigate <问题>`**：在代码库中排查问题，给出证据链。
- **`/issues --state=open --label=bug`**：查询并汇总 GitHub Issue。

## 环境变量
详见项目根目录的 `.env.example`。
