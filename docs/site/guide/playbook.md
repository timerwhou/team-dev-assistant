# Team Playbook (架构记忆体)

> 从“单次执行工具”跃升为“具备自演进架构记忆的研发基座”。

## 为什么需要 Playbook？

在跨模型、跨工作流的开发中，AI 经常缺乏对项目基座的认知，导致技术选型偏离和业务逻辑幻觉（如重复造轮子、公式算错）。Team Playbook 通过沉淀团队的**业务事实（Facts）**与**技术规约（Stack）**，实现开发前置的上下文注入。

## 核心闭环

1. **捕获（Capture）**
   - **隐式**：开发者在代码中注释 `// @fact [domain] 约束内容`，通过 CLI 扫描入库。
   - **显式**：Coordinator 触发 HITL 确认，人类输入 `y` 后，系统自动封装决策与理由入库。
2. **存储（Store）**
   - 统一存放于 `docs/playbook/`，采用 Markdown + YAML。
   - 强制包含 `decision`（决策）、`rationale`（理由）与 `alternatives`（备选方案）。
3. **治理（Govern）**
   - 若发生记忆冲突（如同 domain 下的矛盾决策），系统会将其静默暂存至 `.pending/`，不阻塞当前流程。
   - 开发者可通过 `/review-conflicts` 集中审查并合并。
4. **消费（Consume）**
   - **内部 IDE**：通过 MCP Server 暴露 `project://playbook` Resource 自动读取。
   - **外部模型**：通过 CLI `/inject` 导出高密度背景包。

## 开发者命令

### 生成外部模型背景包
```bash
pnpm dev "/inject 我要做一个订单消息推送"
```
> 系统会执行 BM25 + 向量混合检索，并附加决策图谱 1-hop 扩展，输出高密度 Prompt。

### 从代码中提取 Fact
```bash
pnpm dev "/sync-facts"
```
> 扫描代码中所有的 `@fact` 注释，自动生成标准化 Markdown 资产（具备幂等性）。

### 异步治理冲突
```bash
pnpm dev "/review-conflicts"
```
> 集中处理所有暂存在 `.pending/` 目录中的冲突草稿。

### 内部 MCP 自动注入
```bash
npx @modelcontextprotocol/inspector npx tsx packages/mcp-server/src/index.ts
```
> 在 Inspector 的 Resources 标签中即可看到 `project://playbook`。

## 架构演进 (Roadmap)
- **v1.0**：实现基础存储与 KeywordRetriever（字面匹配）。
- **v1.1**：引入 BM25 + Embedding 语义混合检索，以及决策图谱 1-hop 扩展。
- **v1.4**：完成异步冲突治理（`.pending/`），彻底消除写入阻塞。
