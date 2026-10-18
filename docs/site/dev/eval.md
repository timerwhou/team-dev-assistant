# 评估集与 Eval Gate

评估集用于防止 Prompt 或 Context 改动导致 Agent 能力静默退化。

## 运行评估

```bash
# 跑全量评估（约 10 分钟）
pnpm eval

# 只跑 critical 子集（CI 门禁使用，约 106s）
EVAL_SUBSET=critical pnpm eval
```

## 轨迹断言（Trace Evaluation）

评估集不仅检查最终输出，还通过 `recorder` 捕获 Trace 事件，断言：
- **stopReason**：Agent 是否正常收口。
- **mustUseTools**：Agent 是否调用了预期的工具（如 `search_code`）。
- **maxToolCalls**：是否陷入打转（步数超标）。
- **mustHaveContextBuild**：长任务中是否触发了 Context 压缩。

## 用例结构

```json
{
  "id": "investigate-no-sql",
  "skill": "investigate",
  "input": "项目里有没有 SQL 注入",
  "mustContain": ["结论"],
  "expect": {
    "mustUseTools": ["search_code"],
    "maxToolCalls": 10
  }
}
```

## CI 门禁

在 GitHub Actions 的 `eval-gate` job 中，如果 critical 用例失败，PR 将被阻塞。质量仪表盘会展示在文档站的 [Eval](/eval/) 页面。
