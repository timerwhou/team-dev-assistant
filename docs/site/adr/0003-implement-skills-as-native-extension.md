# 3. Implement Skills as Native MCP Extension via @olaservo/ext-skills

Date: 2026-10-16
Status: Proposed

## Context and Problem Statement

Epic #13 的目标是让 `@tda/skills` 的 Skill 成为 MCP 协议层的可分发资产（SEP-2640）。在 Story #22 升级到 v2 SDK（2026-07-28 规范）后，Story #24 需要决定**如何实现 Skills Extension**。

v2 SDK 的 `@modelcontextprotocol/server@2.3.1` 提供了 `extensions` 声明框架，但**没有内置 SEP-2640 Skills 的便捷 API**（如 `registerSkill`）。我们面临三个选择：

1. **用 Tools 模拟**：注册 `skills_list` / `skills_get` 两个 Tool
2. **用 Low-level Server 手写**：通过 `setRequestHandler` 实现 `skills/list` / `skills/get`
3. **用官方参考实现**：`@olaservo/ext-skills`（Skills WG 维护者维护）

## Decision Drivers

- **协议合规性**：客户端能否原生识别 Skill（不是 Tool）
- **规范细节**：SHA-256 摘要、分页、缓存属性（SEP-2549）、`resources/directory/read`
- **维护成本**：自己实现 vs 复用成熟库
- **生态对齐**：是否使用官方参考实现
- **稳定性**：依赖的成熟度和 API 稳定性

## Considered Options

### Option A：用 Tools 模拟

**做法**：注册 `skills_list` / `skills_get` 两个 MCP Tool。

**优点**：实现简单，用现有 `registerTool` API。

**缺点**：
- **不符合 SEP-2640**：客户端不会把 Tool 识别为 Skill 发现机制
- **无法被 Claude Desktop 原生发现**
- `resources/read` 无法按 `skill://` URI 分发
- 需要重复实现规范细节

### Option B：用 v2 Low-level Server 手写

**做法**：用 `setRequestHandler` 注册 `skills/list` / `skills/get`，把 Skill 文件注册为 Resources。

**优点**：
- 符合 SEP-2640
- 完全控制实现

**缺点**：
- **工作量大**：需要自己实现 SHA-256 摘要计算、分页、缓存属性、`resources/directory/read`
- **容易出错**：规范细节多，容易遗漏
- **维护成本高**：SEP-2640 仍在演进（虽然已 Final），可能需跟进

### Option C：用 @olaservo/ext-skills（官方参考实现）

**做法**：使用 `@olaservo/ext-skills@0.16.0`（Skills WG 维护者 Ola Hungerford 维护的 TypeScript 实现）。

**优点**：
- **官方参考实现**：由 SEP-2640 合著者维护
- **已实现全部规范细节**：
  - `skills/list` / `skills/get`（含 SHA-256 摘要）
  - `resources/read` 分发
  - `resources/directory/read`（可选）
  - SEP-2549 缓存属性（`ttlMs` / `cacheScope`）
  - 2025-era / 2026-07-28 双协议支持
- **已在官方 demo 验证**：包括 OpenAI 插件导入的 digest 校验
- **维护成本低**：跟随上游更新

**缺点**：
- **0.x 实验版**：API 可能有 breaking change
- **个人 scope 发布**：`@olaservo` 而非 `@modelcontextprotocol`
- **依赖外部维护**：如果作者停止维护需自己 fork

## Decision Outcome

**Chosen option: Option C — 用 @olaservo/ext-skills**

理由：

1. **协议合规性最高**：它是 SEP-2640 的参考实现，客户端能原生识别
2. **规范细节已处理**：SHA-256 摘要、分页、缓存属性、`resources/directory/read` 全部内置
3. **官方 demo 验证**：包括 OpenAI 插件导入的 digest 校验
4. **维护成本最低**：跟随上游，不需要自己跟进 SEP 演进
5. **版本兼容**：与 v2 SDK `^2.0.0` 兼容，与我们的 `2.3.1` 匹配

**实施路径**：

1. 添加 `@olaservo/ext-skills@0.16.0` 依赖
2. 用 `discoverSkills(skillsRoot)` 在启动时扫描
3. 用 `registerSkillResources(server, skillMap, skillsRoot, opts)` 注册
4. 在 `serveStdio(factory)` 里完成注册

## Consequences

### Positive

- **SEP-2640 原生支持**：Claude Desktop / Cursor 能原生发现 Skill
- **自动处理规范细节**：SHA-256、分页、缓存、目录读取
- **双协议支持**：2025-era 和 2026-07-28 都能工作
- **工程时间节省**：从"自己实现"变成"配置集成"

### Negative

- **依赖 0.x 实验版**：API 可能随 SEP 演进变化
- **个人 scope 包**：不是 `@modelcontextprotocol` 官方 scope
- **锁定风险**：如果作者停止维护，需要 fork 或自己实现

### Neutral

- **命名约定需对齐**：SEP-2640 要求目录名 = frontmatter `name`，这已在设计文档 2.2 节明确
- **Skills 目录结构不变**：`packages/skills/skills/<name>/SKILL.md` 保持

## 相关变更

本次 Story #24 期间发现并修正：

- **设计文档 `docs/design/skills-migration.md`**：补充 2.2 节"命名约定"，明确目录名 = `name`
- **目录重命名**：`code-review/` → `review/`，`issue-triage/` → `issues/`（符合 SEP-2640）
- **CLI 命令不变**：`/review` / `/investigate` / `/issues` 保持

## 参考

- [SEP-2640 Skills Extension](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2640)
- [@olaservo/ext-skills on npm](https://www.npmjs.com/package/@olaservo/ext-skills)
- [Skills Over MCP WG](https://github.com/modelcontextprotocol/ext-skills)
- ADR-0001: `docs/adr/0001-adopt-mcp-skills-extension.md`
- ADR-0002: `docs/adr/0002-upgrade-to-mcp-v2.md`
- Epic #13
