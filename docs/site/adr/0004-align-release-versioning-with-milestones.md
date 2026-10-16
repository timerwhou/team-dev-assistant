# 4. Align Release Versioning with Milestone Planning

Date: 2026-10-16
Status: Accepted

## Context and Problem Statement

项目在规划初期建立了里程碑（Milestone）体系，每个里程碑代表一个"版本级特性阶段"：

| 里程碑 | 内容 |
|---|---|
| v0.2.0 | MCP Skills Extension |
| v0.3.0 | MCP 2026-07-28 Protocol Upgrade |
| v0.4.0 | Context Engineering |
| v0.5.0 | Eval Regression Gate |

**但实际 Release 号与里程碑号脱节**：

| 里程碑 | 完成时 Release 号 | 预期 |
|---|---|---|
| v0.2.0 — MCP Skills Extension | v0.1.2 ~ v0.1.5 | v0.2.0 |
| v0.3.0 — MCP Protocol Upgrade | 预计 v0.1.6 | v0.3.0 |

**根因**：`release-please-config.json` 中的配置：

```json
"bump-minor-pre-major": true,
"bump-patch-for-minor-pre-major": true   ← 关键
```

`bump-patch-for-minor-pre-major: true` 使 `feat` 类型在 0.x 阶段**塌缩为 patch bump**（0.1.4 → 0.1.5），而不是 minor bump（0.1.x → 0.2.0）。这导致 Release 号永远落后里程碑号一位。

## Decision Drivers

- **语义一致性**：里程碑代表"版本级特性"，Release 号应反映这个边界
- **行业最佳实践**：release-please 官方文档中，`bump-patch-for-minor-pre-major` 是反模式（antipattern）
- **可追溯性**：已发布的 tag 不应删除，历史不应改写
- **长期可持续**：策略变更后，未来所有里程碑都能自动对齐

## Considered Options

### Option A：移除 `bump-patch-for-minor-pre-major`（选定）

**做法**：
- 保留 `bump-minor-pre-major: true`
- 移除 `bump-patch-for-minor-pre-major`
- `v0.1.5` 保留（不删 tag）
- 下次 `feat` 合并后，Release Please 提议 `v0.2.0`

**优点**：
- **符合行业最佳实践**：0.x 阶段 `feat` → minor bump
- **`feat!` 不会跳 1.0.0**：`bump-minor-pre-major: true` 保证破坏性变更也 bump minor
- **不改写历史**：v0.1.5 保留，可追溯
- **自动对齐**：从 v0.2.0 起，Release 号与里程碑号自动同步

**缺点**：
- **v0.1.5 与 v0.2.0 之间会有一个"空档"**（v0.1.5 是 Skills 完成前的最后版本）
- **需要一次手动对齐**：里程碑 v0.3.0 → v0.2.0（重命名）

### Option B：保留现状，里程碑改用 Phase 命名

**做法**：里程碑改用 `Phase N` 前缀，与 Release 号解耦。

**优点**：Release 号平滑。

**缺点**：里程碑失去"版本语义"，与项目规划的初衷冲突。

### Option C：手动打 tag 对齐

**做法**：每次里程碑关闭时手动打 tag。

**优点**：完全控制。

**缺点**：需纪律，易漏，违背"自动化优先"原则。

## Decision Outcome

**Chosen option: Option A — 移除 `bump-patch-for-minor-pre-major`**

理由：

1. **`bump-patch-for-minor-pre-major` 是反模式** —— 它的原意是"在 0.x 阶段不引入新 minor"，但这与我们的里程碑规划冲突
2. **`bump-minor-pre-major: true` 保留了必要保护** —— 它防止 `feat!` 在 0.x 阶段直接跳 1.0.0
3. **不改写历史** —— v0.1.5 保留，符合"发布后不可变"原则
4. **一次性对齐** —— 里程碑 v0.3.0 → v0.2.0 重命名，此后所有里程碑与 Release 号自动同步

**具体实施**：

1. 修改 `release-please-config.json`：
   - 保留 `bump-minor-pre-major: true`
   - **移除** `bump-patch-for-minor-pre-major`

2. `v0.1.5` 保留：作为"Skills 完成前的最后版本"

3. **里程碑重命名**：
   - `v0.3.0 — MCP Protocol Upgrade` → `v0.2.0 — MCP Protocol Upgrade`
   - `v0.4.0 — Context Engineering` → `v0.3.0 — Context Engineering`
   - `v0.5.0 — Eval Regression Gate` → `v0.4.0 — Eval Regression Gate`

4. **下次 `feat` 合并后**，Release Please 会提议 `v0.2.0`——与里程碑 `v0.2.0` 对齐。

## Consequences

### Positive

- **版本号与里程碑一致**：从 v0.2.0 起，Release 号 = 里程碑号
- **符合行业最佳实践**：release-please 官方推荐的 0.x 阶段策略
- **`feat!` 有保护**：不会意外跳到 1.0.0
- **自动化**：不需要手动打 tag，Release Please 自动 bump

### Negative

- **v0.1.5 与 v0.2.0 之间语义跳跃** —— v0.1.5 是"Skills 完成前"，v0.2.0 是"Skills 完成"
- **里程碑重命名需要一次性操作** —— 3 个 milestone 需要改名
- **CHANGELOG 会有一个"版本跳跃"** —— 从 0.1.5 直接到 0.2.0（这是期望行为）

### Neutral

- **不需要删除或重打任何 tag**
- **Git 历史完全保留**
- **文档站需要补充"版本策略"章节**

## 相关变更

- 修改 `release-please-config.json`
- 创建 `docs/design/versioning-strategy.md`
- 文档站新增 `docs/site/versioning.md`
- 里程碑重命名（3 个）

## 参考

- [release-please 官方配置文档](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
- [Semantic Versioning 2.0.0](https://semver.org/)
- 行业惯例：0.x 阶段 `feat` → minor，`fix` → patch，`feat!` 不跳 1.0.0
- Story #30
