# 6. Decouple Release Versioning from Milestone Naming

Date: 2026-10-17
Status: Accepted

## Context and Problem Statement

项目在 v0.2.0 之后，版本号与里程碑编号出现**持续偏移**：

| 里程碑 | 实际 Release |
|---|---|
| v0.2.0 — MCP Protocol Upgrade | v0.2.0 ✅ |
| v0.3.0 — Context Engineering | v0.3.0（骨架）→ **v0.4.0**（压缩器）→ ? |
| v0.4.0 — Eval Regression Gate | 未开始，但 Release 已到 v0.4.0 |

**根因**：`release-please` 的设计是**每个 `feat:` 合并触发一次 minor bump**。而我们的里程碑（Context Engineering）包含**多个 Story**，每个 Story 都是 `feat:` —— 因此**一个里程碑产生多个 Release**。

**期望**：里程碑 = 版本级特性（一个里程碑一个版本号）。
**实际**：里程碑 = 阶段，Release = 每次 `feat:`。

**行业调研结论**：

- **Claude Code**：版本号独立递增（`v2.1.202` → `v2.1.206`），不绑定里程碑
- **ChromeOS**：`MAJOR.MINOR.BUILD.PATCH` 中，`MAJOR.MINOR` 是"调度决策"，`BUILD.PATCH` 是"代码标识"，两者解耦
- **MCP Registry**：只要求版本号**唯一且不可变**，不要求与功能阶段对齐
- **LangChain / OpenAI**：版本号反映"API 兼容性承诺"，不反映"开发里程碑"

**行业共识**：**版本号跟着"发布行为"走，不跟着"里程碑阶段"走。**

## Decision Drivers

- **行业惯例**：头部项目不把里程碑与版本号强绑定
- **工具约束**：`release-please` 的设计是"一个 `feat:` = 一个 minor bump"
- **已发布版本不可变**：v0.4.0 已发布，不能撤回
- **可追溯性**：版本号应该反映"这次发布了什么"，不是"这是哪个阶段"
- **团队协作**：新成员看到 `v0.4.0` 应该理解为"第四次 minor 发布"，不是"第四个里程碑"

## Considered Options

### Option A：接受偏移，里程碑改用 Phase 命名（选定）

**做法**：
- 里程碑改名 `Phase 3 — Context Engineering` / `Phase 4 — Eval Regression Gate`
- Release 号继续走 `v0.4.0` / `v0.5.0` / ...
- 不再试图让里程碑号 = Release 号

**优点**：
- 符合行业惯例
- 不改写历史（v0.4.0 保留）
- 语义清晰：`Phase` 是阶段，`vX.Y.Z` 是发布

**缺点**：
- 需要接受"里程碑与版本号不对齐"

### Option B：用 Release-As footer 手动控制

**做法**：
- 过程性 Story 用 `chore:`（不触发 release）
- 里程碑完成时，最后一个 commit 加 `Release-As: x.y.0`

**优点**：
- 完全控制版本号
- 里程碑与版本号 1:1

**缺点**：
- 需要严格纪律（每个 Story 都要判断 commit 类型）
- `release-please` 的自动分析被绕过
- 团队协作成本高（新成员容易用错 commit 类型）

### Option C：撤回 v0.4.0，重新对齐

**做法**：
- 删除 tag 和 Release
- 重新打 v0.3.0

**优点**：
- 里程碑与 Release 1:1

**缺点**：
- **改写历史**（违反"发布后不可变"）
- 破坏可追溯性
- npm/GitHub 官方不推荐

## Decision Outcome

**Chosen option: Option A — 里程碑改用 Phase 命名**

理由：

1. **符合行业惯例**：Claude Code、ChromeOS、MCP Registry 都不把里程碑与版本号强绑定
2. **不改写历史**：v0.4.0 保留，可追溯
3. **工具友好**：继续用 `release-please` 的默认行为，不需要特殊纪律
4. **语义清晰**：`Phase N` 是阶段，`vX.Y.Z` 是发布
5. **长期可持续**：未来里程碑可以跨多个 Release，不需要对齐

**具体实施**：

1. **里程碑改名**：
   - `v0.3.0 — Context Engineering` → `Phase 3 — Context Engineering`
   - `v0.4.0 — Eval Regression Gate` → `Phase 4 — Eval Regression Gate`

2. **Release 号继续走**：v0.4.0 → v0.5.0 → ...

3. **commit 约定**：
   - `feat:` —— 用户可见的新功能（触发 minor bump）
   - `fix:` —— bug 修复（触发 patch bump）
   - `chore:` / `refactor:` / `docs:` / `test:` —— 过程性工作（不触发）

4. **行为资产独立版本**（前瞻性）：
   - Prompt 和 Skill 的版本从代码版本中**独立**
   - 用内容哈希或独立 tag 管理
   - 这是 Phase 3（Context Engineering）的一部分

## Consequences

### Positive

- **语义清晰**：Phase ≠ Version，两个维度独立
- **工具友好**：不改 `release-please` 默认行为
- **可追溯**：版本号反映"发布了什么"，历史不改写
- **行业对齐**：与 Claude Code、ChromeOS 等头部一致

### Negative

- **里程碑与版本号不强制对齐**：需要团队接受"Phase 3 可能跨 v0.4.0、v0.5.0"
- **文档需要说明**：新成员可能困惑"为什么 Phase 3 对应 v0.4.0"

### Neutral

- **已发布版本保留**：v0.2.0 / v0.3.0 / v0.4.0 都保留
- **后续版本号继续递增**

## 相关变更

- 里程碑重命名（2 个）
- 写 ADR-0006
- 更新 `docs/design/versioning-strategy.md`
- 文档站更新

## 参考

- [Claude Code 版本历史](https://github.com/anthropics/claude-code/releases)
- [ChromeOS 版本策略](https://chromium.googlesource.com/chromium/src/+/main/docs/version_numbers.md)
- [MCP Registry 版本要求](https://github.com/modelcontextprotocol/registry)
- [Semantic Versioning 2.0.0](https://semver.org/)
- ADR-0004：Align Release Versioning with Milestone Planning（**部分被本 ADR 取代**）
- Story #30
