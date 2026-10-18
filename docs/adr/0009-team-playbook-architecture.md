# ADR-0009: Team Playbook & Architecture Memory

## 背景
在跨模型、跨工作流（内部 Agent / 外部网页模型）的开发中，模型缺乏项目基座认知，导致技术选型偏离和业务逻辑幻觉（重复造轮子）。

## 决策
我们引入 Team Playbook 体系，作为团队架构记忆体。
1. **统一存储**：使用 `docs/playbook/` 下的 Markdown + YAML Frontmatter 统一存储 Fact（业务事实）和 Stack（技术规约）。
2. **决策优先**：Schema 强制包含 `decision`、`rationale`、`alternatives` 字段，以显式提供“为什么这么做”的上下文，极大提升 LLM 合规率。
3. **捕获机制**：支持多语言代码注释 `@fact` 扫描（`/sync-facts`），以及在 Coordinator 的 HITL（Human-In-The-Loop）环节自动沉淀人类确认的决策。
4. **消费接入**：通过 CLI `/inject` 导出给外部大模型，通过 MCP `project://playbook` 自动注入给 Cursor 等 IDE。

## 检索层演进
1.0 版本采用基于字面与决策字段的 `KeywordRetriever` 兜底。系统已抽象 `Retriever` 接口，1.1 版本将无缝接入混合检索（BM25 + Embedding）及决策图谱。
