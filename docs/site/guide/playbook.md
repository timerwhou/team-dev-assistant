# Team Playbook (架构记忆体)

> 1.0.0 核心跃升：从“单次执行工具”变为“具备自演进架构记忆的研发基座”。

## 为什么需要 Playbook？

在跨模型、跨工作流的开发中，AI 经常缺乏对项目基座的认知，导致技术选型偏离和业务逻辑幻觉（如重复造轮子、公式算错）。Team Playbook 通过沉淀团队的**业务事实（Facts）**与**技术规约（Stack）**，实现开发前置的上下文注入。

## 核心闭环

1. **捕获（Capture）**
   - **隐式**：开发者在代码中注释 `// @fact [domain] 约束内容`，通过 CLI 扫描入库。
   - **显式**：Coordinator 触发 HITL（Human-In-The-Loop）请求确认，人类输入 `y` 后，系统自动封装决策与理由入库。
2. **存储（Store）**
   - 统一存放于 `docs/playbook/`，采用 Markdown + YAML。
   - 强制包含 `decision`（决策）、`rationale`（理由）与 `alternatives`（备选方案），显式记录“为什么不选别的”。
3. **消费（Consume）**
   - **内部 IDE**：通过 MCP Server 暴露 `project://playbook` Resource，Cursor 等工具自动读取。
   - **外部模型**：通过 CLI `/inject` 导出背景包，一键复制给网页版大模型。

## 开发者命令

### 生成外部模型背景包
```bash
pnpm dev "/inject 我要做一个订单消息推送"
```
> 系统会检索相关的 Fact 与 Stack，输出一段包含决策理由的高密度 Prompt。

### 从代码中提取 Fact
```bash
pnpm dev "/sync-facts"
```
> 扫描项目代码中所有的 `@fact` 注释，自动生成标准化的 Markdown 资产到 `docs/playbook/` 目录中（具备幂等性，由内容哈希命名）。

### 内部 MCP 自动注入
```bash
npx @modelcontextprotocol/inspector npx tsx packages/mcp-server/src/index.ts
```
> 在 Inspector 的 Resources 标签中即可看到 `project://playbook`。

## 架构演进 (Roadmap)
- **v1.0**：默认 `KeywordRetriever`（基于字面与领域词匹配）。
- **v1.1+**：已预留 `Retriever` 接口，计划接入混合语义检索与决策图谱 1-hop 扩展召回。
