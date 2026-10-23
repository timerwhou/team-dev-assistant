# CLI 命令行

命令行入口，主要用于本地调试、单 Agent 运行及团队协作工具的调用。

## 用法
```bash
pnpm dev "/<command> [参数]"
```

## 核心命令

### 1. 架构记忆体工具
- **`/init` (v1.12.0 新增)**：智能冷启动命令。基于 `CodeUnderstandingAdapter` 架构扫描项目代码骨架（零依赖起步），调用大模型推断业务事实并生成草案存入 `.pending/`。
- **`/inject <需求>`**：提取项目上下文。支持 `--agentic` 多轮深挖。
- **`/sync-facts`**：扫描代码中的 `@fact` 注释生成规约。

### 2. 任务与规划协同
- **`/todo <描述>`**：记录临时任务并同步 GitHub Issue。
- **`/plan <需求>`**：结合 Playbook 上下文拆解需求并创建 Issue。
- **`/review-conflicts`**：集中处理 `.pending/` 中的草稿。

### 3. Agent 技能
- **`/review <文件>`**：代码评审。
- **`/investigate <问题>`**：代码排查。
- **`/issues`**：查询 GitHub Issue。

## 环境变量
详见项目根目录的 `.env.example`。
