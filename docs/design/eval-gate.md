# Eval Regression Gate 设计文档

> 关联：ADR-0007 · Epic #49

## 1. 问题

AI Agent 的执行轨迹（工具链、步数）会因 Prompt 或 Context 的微调而发生变化。我们需要一个自动化的机制，在 PR 阶段拦截那些导致能力退化的改动。

## 2. 目标

1. **轨迹可验证**：验证 Agent 的执行过程，而不只是最终文本。
2. **自动拦截**：退化直接阻塞 CI。
3. **执行高效**：门禁耗时控制在 2 分钟内。

## 3. 架构

### 3.1 EvalCase 扩展

```typescript
export type EvalCase = {
  id: string;
  skill: "review" | "investigate" | "issues";
  input: string;
  mustContain?: string[];
  description?: string;
  /** 是否核心用例（EVAL_SUBSET=critical 时只跑这些） */
  critical?: boolean;
  /** 轨迹断言 */
  expect?: {
    stopReason?: string[];
    mustUseTools?: string[];
    maxToolCalls?: number;
    mustHaveContextBuild?: boolean;
  };
};
```

### 3.2 执行流程

1. 加载用例（支持 `EVAL_SUBSET=critical` 过滤）。
2. 运行 Agent + 捕获 Trace 事件。
3. 进行双重断言：
   - **端到端**：`mustContain` 等文本检查。
   - **轨迹**：从 Trace 中提取 `stopReason` / `tools` / `steps` 进行校验。
4. 生成报告。

### 3.3 CI 门禁

- 仅当 `code`（packages/apps/eval/scripts）发生变更时触发 `eval-gate`。
- 仅运行 3 个核心用例，耗时约 106s。
- 门禁失败 → `ci-gate` 失败 → PR 阻塞。

## 4. 核心设计

### 4.1 Trace 断言与非确定性处理

由于 LLM 是非确定的，轨迹断言必须具备容忍度：
- `maxToolCalls` 设上限而非精确值。
- `mustUseTools` 只要求“调用过”。
- `stopReason` 提供允许列表。

### 4.2 为什么不做全量 CI

全量 eval 耗时 11 分钟，不适合每次 PR 都跑。因此拆分出 `critical` 子集，仅覆盖最核心的 `investigate`、`review` 和安全用例。全量用例留给本地或定时任务。

## 5. 未来演进计划（Roadmap）

当前的确定性断言虽然稳定，但无法评估**语义质量**。未来将按以下路线演进：

### 5.1 引入语义评估（LLM-as-a-Judge）
- **目标**：评估“回答是否深入”、“推理是否清晰”等主观质量。
- **落地方式**：由于 Judge 存在成本高、模型版本漂移等问题，**不将其作为 CI 硬门禁**。而是作为独立任务（如每周运行一次，或手动触发），产出质量趋势报告，辅助人工评审。

### 5.2 基线对比（Baseline Diff）
- **目标**：不仅看单次是否通过，还要对比当前 PR 与主干（main）的指标变化。
- **落地方式**：记录每次运行的 `tokens`、`耗时`、`步数`。如果某次 PR 导致 token 消耗剧增，发出警告。

### 5.3 CI 缓存优化
- 利用 `actions/cache` 缓存 `node_modules`，进一步压缩 `eval-gate` 的时间。

## 6. 参考
- ADR-0007
- Epic #49
