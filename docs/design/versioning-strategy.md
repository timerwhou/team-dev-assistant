# 版本策略

> **重要变更**：从 1.0.0 起，本项目采用全自动 CI (`Release Please`) + 手动控制 (`Release-As`) 的机制，**不再强绑定里程碑与版本号**。

## 历史版本对应关系 (Deprecated 归档)

| 里程碑 | 内容 | 实际 Release | 状态 |
|---|---|---|---|
| v0.2.0 | MCP Skills Extension | v0.1.2 ~ v0.1.5 | 已归档 |
| v0.3.0 | Context Engineering | v0.3.0 | 已归档 |
| v0.4.0 | Eval Regression Gate | v0.4.0 | 已归档 |
| ... | ... | ... | ... |

## 当前策略 (v1.0.0+)

1. **版本号反映 API 兼容性承诺**，而不是开发进度。
2. 日常开发合并 PR 时，由 `release-please` 自动维护 CHANGELOG 和版本号。
3. 当完成一个重大里程碑（如 Team Playbook）准备正式发布时，由 Maintainer 手动推送一个带有 `Release-As: 1.0.0` 的空提交，强制切出版本。

具体决策请参考：[ADR-0006](/adr/0006-decouple-versioning-from-milestones) 与 [ADR-0009](/adr/0009-team-playbook-architecture)。
