# Roadmap

项目的工程演进路线。每个里程碑都有明确的能力目标、验收标准和配套文档。

## 已完成

### v0.1.x — 基础能力

- ✅ AI Agent 核心循环（Function Calling / 多轮 Tool Use）
- ✅ 三层收敛机制（Prompt + 语义进展 + 硬兜底）
- ✅ Skill 系统（review / investigate / issues）
- ✅ A2A 多 Agent 协作（coordinator + reviewer + investigator）
- ✅ MCP Server（Tools + Prompts + Resources）
- ✅ 安全加固（防命令注入 / 路径穿越）
- ✅ 可观测性（LLM/Agent trace + 成本统计）
- ✅ 评估集（8 用例）
- ✅ CI/CD（GitHub Actions + release-please + GHCR）
- ✅ 容器化（Docker Compose 一键起）

## 进行中

### v0.2.0 — MCP Skills Extension

**目标**：将 Skill 标准化为 MCP 协议层的可分发资产。

**依据**：MCP SEP-2640 Skills Extension 规范。

**产出**：
- Skill 目录结构适配 SEP-2640（`skill://xxx/SKILL.md` + `references/`）
- MCP Server 支持 `skills/list` 与 `skills/get`
- 文档站自动聚合 Skill 页面
- ADR-0001、设计文档

### v0.3.0 — Context Engineering

**目标**：显式化上下文组装层，实现工具结果压缩与 Token 预算控制。

**产出**：
- `@tda/core` 新增 `context/` 模块
- Trace 记录上下文组装决策
- ADR-0002、设计文档

### v0.4.0 — Eval Regression Gate

**目标**：打通 Trace 与 Eval，CI 中加入评估门禁。

**产出**：
- `eval/run.ts` 消费 Trace 数据
- CI `ci-gate` 聚合 `eval-gate`
- Release 触发评估报告发布
- ADR-0003、设计文档

### v0.5.0 — A2A v1.1 BiDi Streaming

**目标**：A2A Server 支持双向流与 Human-in-the-Loop。

**产出**：
- A2A Server 支持 BiDi Streaming
- coordinator 实现 Elicitation 场景
- ADR-0004、设计文档

## 原则

1. **每个里程碑的工程动作和文档产出成对**。没有文档的工程升级视为未完成。
2. **设计文档采用 MADR 格式的 ADR**，放在 `docs/adr/`。
3. **每个 Issue 都有验收标准**，Given-When-Then 描述。
4. **每个 PR 关联 Issue**，CI 通过才合并。
5. **知识沉淀与工程升级同步**，文档站自动聚合。
