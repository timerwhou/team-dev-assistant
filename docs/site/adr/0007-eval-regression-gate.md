# 建立 Eval Regression Gate

## 背景

随着 Prompt 和 Context 模块的演进，Agent 的行为变得越发复杂。传统的端到端断言（仅检查输出文本）无法发现“工具调用链错误”或“静默打转”等轨迹级退化。

## 设计目标

- 在 CI 阶段拦截 Agent 能力的静默退化。
- 保障核心工具链和收敛机制的稳定性。

## 架构设计

扩展 `eval/` 框架，在 `EvalCase` 中引入 `expect` 字段断言。通过消费底层 Trace 事件，强制校验 `mustUseTools`、`maxToolCalls` 和 `stopReason`。在 GitHub Actions 中增加 `eval-gate` Job，运行核心（critical）用例子集，失败则阻塞合并。

## 影响评估

- **正向**：Prompt 修改的安全性大幅提升。
- **负向**：CI 耗时增加（约 106 秒）；受 LLM 非确定性影响，偶发误报。
