# 4. 版本发布策略与里程碑对齐

## 背景

系统使用 `release-please` 自动发版。初始配置中的 `bump-patch-for-minor-pre-major` 导致所有的 `feat` 提交仅触发 Patch 版本（如 0.1.4 -> 0.1.5），这使版本号长期滞后于项目规划的功能里程碑。

## 设计目标

- 使 SemVer 版本号真实反映功能层级。
- 消除里程碑（如 v0.3.0）与 Release（如 v0.1.5）之间的割裂。

## 架构设计

移除 `release-please-config.json` 中的 `bump-patch-for-minor-pre-major`，保留 `bump-minor-pre-major`。修改后，常规 `feat` 提交将触发 Minor 版本升级（如 0.2.0 -> 0.3.0），破坏性变更（`feat!`）在 0.x 阶段仍受控，不会误升 1.0.0。

## 影响评估

- **正向**：版本号具备语义，与里程碑完美同步。
- **负向**：0.x 阶段的 Minor 版本迭代频率将变高。
