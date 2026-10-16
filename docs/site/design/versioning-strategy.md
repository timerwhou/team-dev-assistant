# 版本策略

> 关联：ADR-0004 · Story #30

## 1. 目标

让 **Release 版本号与里程碑号对齐**，使发布的版本号反映实际的阶段性特性。

## 2. 里程碑与版本对应

| 里程碑 | 内容 | 对应 Release |
|---|---|---|
| v0.2.0 | MCP Skills Extension | v0.1.2 ~ v0.1.5（历史） |
| v0.2.0 | MCP Protocol Upgrade（原 v0.3.0，已重命名） | v0.2.0（下一个） |
| v0.3.0 | Context Engineering | v0.3.0 |
| v0.4.0 | Eval Regression Gate | v0.4.0 |

**从 v0.2.0 起**：Release 号 = 里程碑号。

## 3. Commit → 版本 bump 规则

| Commit 类型 | 版本变化 | 示例 |
|---|---|---|
| `fix:` | patch | 0.2.0 → 0.2.1 |
| `feat:` | **minor** | 0.2.1 → 0.3.0 |
| `feat!:` / `BREAKING CHANGE:` | **minor**（0.x 阶段） | 0.3.0 → 0.4.0 |
| `docs:` / `chore:` / `refactor:` | 不 bump | — |

**关键**：0.x 阶段的 `feat!` **不跳 1.0.0** —— 这是 `bump-minor-pre-major: true` 的作用。

## 4. `release-please-config.json` 配置

```json
{
  "release-type": "node",
  "bump-minor-pre-major": true,          // 0.x 阶段 feat! 不跳 1.0.0
  // 移除: "bump-patch-for-minor-pre-major": true   ← 反模式
}
```

**为什么移除 `bump-patch-for-minor-pre-major`**：

- 它让 `feat:` 在 0.x 阶段塌缩为 patch bump
- 与里程碑的"版本级特性"语义冲突
- release-please 官方文档认为这是反模式

## 5. 何时进入 1.0.0

**1.0.0 是"稳定 API"的标志**。项目进入 1.0.0 的条件：

- 核心 API 稳定（`@tda/core` 的 `runAgent` / `Skill` 接口不再变化）
- 有外部用户依赖
- 语义化版本承诺生效

**目前不进入 1.0.0** —— 项目仍在快速迭代。

## 6. 相关 ADR

- **ADR-0004**：Align Release Versioning with Milestone Planning
- **ADR-0002**：Upgrade to MCP v2

## 7. 参考

- [Semantic Versioning 2.0.0](https://semver.org/)
- [release-please 配置文档](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
