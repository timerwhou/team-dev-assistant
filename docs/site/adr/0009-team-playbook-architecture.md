# ADR-0009: Team Playbook & Architecture Memory

## 背景
在跨模型、跨工作流的开发中，模型经常缺乏项目基座的认知，导致技术选型偏离和业务逻辑幻觉（如重复造轮子、公式算错）。

## 决策
我们引入 Team Playbook 体系，作为团队架构记忆体。
1. **统一存储**：使用 `docs/playbook/` 下的 Markdown + YAML 统一存储 Fact（业务事实）和 Stack（技术规约）。
2. **决策优先**：Schema 强制包含 `decision`、`rationale`、`alternatives` 字段，显式提供“为什么这么做”的上下文。
3. **多模态捕获**：支持 `@fact` 注释扫描、HITL 确认沉淀，以及异步冲突治理（`/review-conflicts`）。
4. **无缝消费**：通过 CLI `/inject` 导出给外部大模型，通过 MCP `project://playbook` 自动注入给 IDE。

## 检索层演进
- **v1.0**：实现了基础的 `KeywordRetriever`。
- **v1.1**：演进为 `AsyncHybridRetriever`（BM25 + Embedding），并支持决策图谱 1-hop 扩展。
- **v1.4**：引入异步冲突治理，新增 `relates_to` 和 `depends_on` 图字段。
