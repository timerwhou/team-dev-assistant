# 使用 @olaservo/ext-skills 实现原生扩展

## 背景

在 v2 SDK 中，官方暂未提供 `registerSkill` 便捷 API。若自行通过 `setRequestHandler` 手写协议层，需处理复杂的 SHA-256 摘要、分页及缓存属性。

## 设计目标

- 以最低成本、最高合规性实现 SEP-2640。
- 复用官方参考实现的规范细节，避免协议兼容性陷阱。

## 架构设计

集成 `@olaservo/ext-skills@0.16.0`。在 Server 启动时，调用 `discoverSkills()` 扫描本地 `SKILL.md` 并计算摘要，随后通过 `registerSkillResources()` 自动挂载 `skills/list`、`skills/get` 及 `resources/read` 端点。

## 影响评估

- **正向**：原生支持 Skills，且自动处理 SEP-2549 缓存属性。
- **负向**：依赖 0.x 版本的第三方包，需跟随上游演进。
