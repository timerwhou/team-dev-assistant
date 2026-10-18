# 架构设计

> 本项目在 v1.0.0 完成了从「单次执行工具集」向「具备自演进架构记忆的研发基座」的跃升。

## 核心架构图

```text
[ 开发者 / IDE / 外部网页模型 ]
       |              |
  (MCP 自动注入)   (CLI /inject 注入)
       |              |
       v              v
+-----------------------------------+
|          Team Playbook            |
|  (docs/playbook: Fact / Stack)    |
|  - decision / rationale 决策字段  |
+-----------------------------------+
       ^              ^
       |              |
 (HITL 确认沉淀)  (代码 @fact 扫描)
       |              |
+-----------------------------------+
|           Agent Loop              |
|  (Coordinator / Eval / Tools)     |
+-----------------------------------+
```

## 数据流与生命周期

1. **捕获（Capture）**：
   - **隐式**：开发者通过 `// @fact` 标注业务约束，CI 运行 `/sync-facts` 保证资产同步。
   - **显式**：Coordinator 触发 HITL（Human-In-The-Loop）请求确认，人类输入 `y` 后自动沉淀决策。
2. **存储（Store）**：
   - 统一存储在 `docs/playbook/`，采用 Markdown + YAML Frontmatter。强制包含 `decision`, `alternatives`, `rationale`，以结构化形式记录“为什么这么做”。
3. **消费（Consume）**：
   - **内部 IDE**：通过 MCP Server 暴露 `project://playbook` Resource，大模型自动读取。
   - **外部模型**：通过 CLI `/inject` 提取 Context Pack，一键复制给网页模型。

## 核心设计决策

- **Context Engineering**：显式化上下文组装层，工具结果自动压缩（长任务最高节省 98.4% Token）。
- **Eval Regression Gate**：基于 Trace 轨迹断言，在 CI 中拦截 Prompt 改动导致的能力退化。
- **A2A v1.1 & MRTR**：支持 WebSocket BiDi Streaming，通过 Elicitation 实现人工实时介入。
- **Team Playbook**：自演进的架构记忆体，消除跨模型/跨工作流的认知偏离。
- **Trace 可观测性**：完整记录 LLM / Agent / Context 三类事件，保障系统透明可解释。
