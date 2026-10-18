# Coordinator

多 Agent 协调器。负责发现 Agent、并行派发任务，并汇总最终结果。

## 启动全部 Agent

```bash
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"
```
脚本会：启动 reviewer → 启动 investigator → 健康检查 → 启动 coordinator。

## 核心能力：HITL 闭环

Coordinator 支持通过 CLI 实时处理 Agent 的 Elicitation 请求。

当 Agent 状态变为 `input-required` 时，Coordinator 会使用 `readline` 在终端暂停，并向人类提问：

```bash
🤖 [review] Agent 需要澄清：
   你确定要让我评审这个文件吗？（输入 confirm 确认）
   请输入 (y/n): 
```

拿到人类输入后，Coordinator 会调用 `resumeTask` 恢复执行。

### HITL 自动沉淀记忆体
当人类输入 `y` 确认后，系统不仅恢复 Agent 执行，还会自动将此次决策封装为一条 Fact 记录，写入 `docs/playbook/`，实现“开发即沉淀”。

## 环境变量

| 变量 | 默认值 |
|---|---|
| `REVIEWER_URL` | `http://localhost:4101` |
| `INVESTIGATOR_URL` | `http://localhost:4102` |

在 Docker 环境下，地址会自动切换为服务名（如 `http://reviewer:4101`）。
