# 1. Adopt MCP Skills Extension for Skill Distribution

Date: 2026-10-16
Status: Proposed

## Context and Problem Statement

`@tda/skills` 当前用项目内部的 `defineSkill()` 声明 `review` / `investigate` / `issues` 三个 Skill。这种私有格式满足本项目 CLI 的需求，但存在两个结构性局限：

1. **不可被 MCP 生态发现**：Claude Desktop、Cursor、Cline 等 MCP 客户端无法通过标准接口看到这些 Skill。外部用户要用我们的能力，只能复制粘贴 Prompt。
2. **无法演进为可分发资产**：Skill 定义、支持文件、示例都混在 TypeScript 代码里，不能像文档一样被独立引用、版本化、分发。

2026 年 4 月，MCP 正式发布 **SEP-2640 Skills Extension**，把 Skill 定义为协议层的资源：

- `skill://<name>/SKILL.md` — 主定义文件（YAML frontmatter + 结构化正文）
- `skill://<name>/references/*.md` — 支持文件（checklist、example 等）
- 客户端通过 `skills/list` 发现，通过 `skills/get` 获取内容

我们面临的选择是：继续用私有格式，还是迁移到 MCP Skills Extension。

## Decision Drivers

- **协议原生性**：能否被标准 MCP 客户端发现和使用
- **可分发性**：Skill 能否脱离项目被独立引用
- **向后兼容**：现有 CLI 是否需要重写
- **工程复杂度**：迁移成本和长期维护成本
- **生态对齐**：是否与行业主流方向一致

## Considered Options

### Option A：保持私有 defineSkill 格式

**做法**：继续用 `defineSkill({ name, description, parameters, tools, maxSteps, system })`。

**优点**：
- 零迁移成本
- 类型安全（Zod schema 直接可用）
- 与现有 CLI 完全耦合，改动最小

**缺点**：
- 不可被 MCP 客户端发现
- 无法分发
- 与行业标准脱节
- 里程碑二的 Context Engineering 无法复用 Skill 的结构化元数据

### Option B：采用 OpenAI Agent Skills 格式

**做法**：迁移到 OpenAI 的 Agent Skills 规范（`SKILL.md` + 目录结构）。

**优点**：
- 已是行业标准格式之一
- 有成熟工具链支持
- 与 OpenAI 生态对齐

**缺点**：
- **不是 MCP 协议层**：Claude Desktop、Cursor 等 MCP 客户端无法直接发现
- 与我们的 MCP Server 集成不自然
- 只服务 OpenAI 生态，锁定风险

### Option C：采用 MCP Skills Extension（SEP-2640）

**做法**：把 Skill 迁移为 MCP 协议层的资源（`skill://` URI + `skills/list` + `skills/get`）。

**优点**：
- **协议原生**：任何 MCP 客户端可发现和使用
- **可分发**：`skills/get` 让 Skill 成为可独立引用的资产
- **与现有 MCP Server 无缝集成**：我们已经实现了 MCP Server，加两个能力即可
- **向后兼容路径清晰**：`SKILL.md` 作为源，`defineSkill` 作为运行时投影
- **生态方向**：MCP 是 Anthropic / Google / Microsoft 共同推动的协议，Skills Extension 是官方规范

**缺点**：
- 需要引入 `SKILL.md` 作为新的源文件格式
- 构建时需要解析 YAML frontmatter
- 文档需要从 TypeScript 里搬到 Markdown

## Decision Outcome

**Chosen option: Option C — Adopt MCP Skills Extension**

理由：

1. **协议原生性最高**：只有 MCP Skills Extension 让 Skill 成为 MCP 协议层的资源，被任何 MCP 客户端发现。
2. **与现有架构最一致**：我们已经实现了 MCP Server（Tools + Prompts + Resources），加 Skills 是自然延伸，不是重构。
3. **向后兼容成本最低**：`SKILL.md` 作为源文件，`defineSkill` 继续作为运行时投影，CLI 无需改动。
4. **前置依赖满足**：里程碑二（Context Engineering）需要 Skill 的结构化元数据（何时使用、工作流程、输出格式），`SKILL.md` 的固定结构正好提供这些。
5. **行业方向一致**：MCP 是 2026 年事实标准，Skills Extension 是官方规范。

**实施路径**：

1. `packages/skills/` 目录重构：每个 Skill 一个子目录，包含 `SKILL.md` + 可选 `references/`
2. `packages/skills/src/` 保留 `defineSkill` 作为运行时投影，从 `SKILL.md` 加载
3. `packages/mcp-server/` 新增 `skills/list` 和 `skills/get` 两个能力
4. 文档站新增 `docs/site/skills/` 章节，从 `SKILL.md` 自动生成

## Consequences

### Positive

- Skill 可被任何 MCP 客户端发现（Claude Desktop、Cursor、Cline）
- Skill 成为可分发资产（`skills/get`）
- 与里程碑二的 Context Engineering 自然衔接
- 文档站内容与 Skill 定义**单一来源**，不会漂移

### Negative

- 需要引入 YAML frontmatter 解析（增加一个构建依赖）
- 迁移需要 3 个 PR（目录结构 / MCP Server / 文档站）
- `SKILL.md` 与 TypeScript 的 `defineSkill` 有冗余（需要保证同步）

### Neutral

- CLI 消费方式不变，用户无感知
- `defineSkill` API 保持不变，只改变数据源

## 参考

- [MCP SEP-2640 Skills Extension](https://github.com/modelcontextprotocol/specification)
- [Anthropic Agent Skills](https://docs.anthropic.com/en/docs/build-with-claude/agent-skills)
- [MADR Format](https://adr.github.io/madr/)
