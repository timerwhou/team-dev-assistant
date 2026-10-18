# 7. Eval Regression Gate

Date: 2026-10-18
Status: Accepted (Retrospective)

## Context and Problem Statement

AI Agent 的行为不仅由代码决定，还受 Prompt、Context 组装策略、工具实现的影响。

修改 Prompt 或工具链，可能导致 Agent 能力**静默退化**：
- 工具调用链路变了（如用瞎猜代替 `search_code`）
- 收敛步数变多（陷入打转）
- 停止原因变了（从正常收口变成 `max_steps`）

传统的端到端断言（仅检查最终输出文本）无法捕捉这些执行轨迹层面的退化。

## Engineering Reality

> 本 ADR 为复盘记录。在 Epic #49 的推进中，为快速建立 CI 防线，工程实践先行落地了基于 Trace 的轨迹断言方案。

当前系统建立在以下事实之上：

1. **评测框架升级（Story #50）**：`eval/run.ts` 消费 Trace 数据，`EvalCase` 扩展了 `expect` 字段，用于断言工具调用链（`mustUseTools`）、步数上限（`maxToolCalls`）和收口原因（`stopReason`）。
2. **CI 门禁（Story #51）**：在 `.github/workflows/ci.yml` 中接入 `eval-gate`，仅运行 3 个核心用例（`EVAL_SUBSET=critical`，耗时约 106s）。一旦轨迹断言失败，阻塞 PR 合并。
3. **质量仪表盘（Story #52）**：文档站新增 `/eval/` 页面，自动渲染最新评估报告。

## Decision Outcome

我们以**确定性代码断言（Trace 断言）**作为 Agent 能力的核心门禁。

**依据**：
在 CI 阶段，稳定性和可解释性至关重要。针对“是否调用了特定工具”、“是否陷入死循环”这类边界与决策问题，确定性的代码断言能做到 100% 可重复，且零额外推理成本。这是行业头部（如 OpenAI 评测指南）推荐的首选防线。

## Consequences

### Positive
- 彻底拦截了 Agent 执行链路的静默退化。
- CI 门禁轻量（106s），不阻塞日常开发。
- 开发者修改 Prompt 后，有了明确的“防退化”安全网。

### Negative
- **无法评估语义质量**：如果 Agent 选对了工具、步数也合理，但输出的回答质量很差（如不够深入、语气生硬），当前门禁无法拦截。
- **LLM 非确定性挑战**：由于大模型输出的波动，偶尔会出现轨迹微变导致的 flaky test（可通过适当放宽 `maxToolCalls` 缓解）。

## 参考

- [OpenAI: Evaluation Best Practices](https://platform.openai.com/docs/guides/evaluation-best-practices)
- [LangSmith: Evaluation](https://docs.smith.langchain.com/)
- Epic #49
