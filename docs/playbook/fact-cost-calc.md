---
id: fact-cost-calc
type: fact
domain: finance
status: active
title: 成本计算必须复用 CostService
---
项目的总成本计算公式为 `XX = XX + YY`（基础成本 + 附加费）。
严禁在前端或控制器中重新实现计算逻辑，必须调用 `src/services/CostService.ts` 中的 `calculate()` 方法。
