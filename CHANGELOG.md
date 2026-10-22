# Changelog

## [1.9.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.8.0...v1.9.0) (2026-10-22)


### Features

* **mcp-server:** 实现 Workflow 编排 API 与强类型校验 ([#159](https://github.com/timerwhou/team-dev-assistant/issues/159)) ([201c66a](https://github.com/timerwhou/team-dev-assistant/commit/201c66abbf175c86281fa2f77340b8d4c725f462))
* **studio:** 可视化 Studio 基础骨架与专业调试面板 ([#162](https://github.com/timerwhou/team-dev-assistant/issues/162)) ([022b273](https://github.com/timerwhou/team-dev-assistant/commit/022b273f2bac5d6258fdcb92bcfa9099bd0e1719))
* **studio:** 完善可视化 Studio 交互与能力选择 ([#164](https://github.com/timerwhou/team-dev-assistant/issues/164)) ([d1160b4](https://github.com/timerwhou/team-dev-assistant/commit/d1160b4487eb33f531f50a8a8d90719d82b424cc))
* **studio:** 完成 Studio 打包构建与交互优化 ([#166](https://github.com/timerwhou/team-dev-assistant/issues/166)) ([0c9b9b4](https://github.com/timerwhou/team-dev-assistant/commit/0c9b9b42633ecfcef7a442c08365a0a04b56e25e))

## [1.8.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.7.0...v1.8.0) (2026-10-22)


### Features

* **core:** 实现执行记忆存储与动态评估器 (MemoryStore) ([#151](https://github.com/timerwhou/team-dev-assistant/issues/151)) ([1ed88d3](https://github.com/timerwhou/team-dev-assistant/commit/1ed88d3876f8a8c3044a8f3175573bee158b8877))
* **core:** 成功轨迹沉淀为 Workflow Fact ([#154](https://github.com/timerwhou/team-dev-assistant/issues/154)) ([e587b67](https://github.com/timerwhou/team-dev-assistant/commit/e587b671281fb89e0fae71374b07941c3be1074e))


### Bug Fixes

* **mcp-server:** 日志脱敏，彻底修复 Log Injection ([#156](https://github.com/timerwhou/team-dev-assistant/issues/156)) ([eecbdef](https://github.com/timerwhou/team-dev-assistant/commit/eecbdefbada2e728e9221b7ffdab435a18640ed2))

## [1.7.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.6.0...v1.7.0) (2026-10-21)


### Features

* **coordinator:** 实现基于 Manifest 的 A2A 多 Agent 调度 ([#143](https://github.com/timerwhou/team-dev-assistant/issues/143)) ([e3ba6c3](https://github.com/timerwhou/team-dev-assistant/commit/e3ba6c39aea9e2d28c2ceae18537473125a32847))
* **core:** 实现远程能力注册与发现 (Remote Capability Loader) ([#146](https://github.com/timerwhou/team-dev-assistant/issues/146)) ([6031931](https://github.com/timerwhou/team-dev-assistant/commit/6031931c33a622204dfc09207c66c699143e2a3f))
* **core:** 开放 Trace 事件流协议 (Open Trace Protocol) ([#148](https://github.com/timerwhou/team-dev-assistant/issues/148)) ([8197879](https://github.com/timerwhou/team-dev-assistant/commit/8197879c3a66b5039d5eeb62d5f90c1ecca66fca))

## [1.6.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.5.1...v1.6.0) (2026-10-21)


### Features

* **cli:** 接入 Agentic RAG 闭环模式 ([#139](https://github.com/timerwhou/team-dev-assistant/issues/139)) ([d995fb8](https://github.com/timerwhou/team-dev-assistant/commit/d995fb8ade9b4b1146718ae38b9c77276b371222))
* **core:** 实现工作流声明与解析层 (Workflow Manifest) ([#134](https://github.com/timerwhou/team-dev-assistant/issues/134)) ([f608007](https://github.com/timerwhou/team-dev-assistant/commit/f608007f800f0183fcae627e75f34fafedc0a29f))
* **core:** 实现执行-反馈闭环调度器 (AgenticLoop) ([#137](https://github.com/timerwhou/team-dev-assistant/issues/137)) ([962d74a](https://github.com/timerwhou/team-dev-assistant/commit/962d74acde4dff018c21ea1efeffdb37984fa120))
* **core:** 能力契约与注册中心 (Capability Registry) ([#131](https://github.com/timerwhou/team-dev-assistant/issues/131)) ([7dc6ab8](https://github.com/timerwhou/team-dev-assistant/commit/7dc6ab825b0c118e05ca41927a9e1858ebad6485))

## [1.5.1](https://github.com/timerwhou/team-dev-assistant/compare/v1.5.0...v1.5.1) (2026-10-21)


### Bug Fixes

* **ci:** 消除 deploy-docs 双重触发导致的并发部署冲突 ([#127](https://github.com/timerwhou/team-dev-assistant/issues/127)) ([0c010bd](https://github.com/timerwhou/team-dev-assistant/commit/0c010bd6a9be51cc510bde2e4c75c5f039f428f0))

## [1.5.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.4.1...v1.5.0) (2026-10-21)


### Features

* **core:** 实现 LocalCacheEmbeddingProvider，支持完全离线的本地向量缓存 ([#120](https://github.com/timerwhou/team-dev-assistant/issues/120)) ([a7a2266](https://github.com/timerwhou/team-dev-assistant/commit/a7a22664e77a3f5b59a4fa2f91064dde12c7f3a2))
* **mcp-server:** 企业级多租户隔离与 OAuth 2.1 深度限流 ([#125](https://github.com/timerwhou/team-dev-assistant/issues/125)) ([591cf9e](https://github.com/timerwhou/team-dev-assistant/commit/591cf9ee0407b91f5d561ad0ae6f2c2cc50455ae))


### Bug Fixes

* **ci:** 文档站自动跟随发版触发（App Token + v* Tag 双保险） ([#123](https://github.com/timerwhou/team-dev-assistant/issues/123)) ([a4b5359](https://github.com/timerwhou/team-dev-assistant/commit/a4b5359d6c112fbaf93a2a9904f33ba021e3a49a))

## [1.4.1](https://github.com/timerwhou/team-dev-assistant/compare/v1.4.0...v1.4.1) (2026-10-21)


### Bug Fixes

* **ci:** 重构 release.yml 为 Workflow 内串联，彻底消除 GITHUB_TOKEN 递归抑制 ([#116](https://github.com/timerwhou/team-dev-assistant/issues/116)) ([e899cc9](https://github.com/timerwhou/team-dev-assistant/commit/e899cc9d177c0d6c167413dd798af8eb38dbd85b))

## [1.4.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.3.0...v1.4.0) (2026-10-21)


### Features

* **cli:** 实现 /plan 命令与 AI 辅助规划机制 ([#111](https://github.com/timerwhou/team-dev-assistant/issues/111)) ([46323d8](https://github.com/timerwhou/team-dev-assistant/commit/46323d8c8cc0f6d1847f6de29aaf76ef4b1c09cd))
* **cli:** 实现 /todo 命令与本地/GitHub 双轨同步 ([#110](https://github.com/timerwhou/team-dev-assistant/issues/110)) ([1f7b6eb](https://github.com/timerwhou/team-dev-assistant/commit/1f7b6eb6e46ecf0af2f1ef553f28f4eb7da675e5))
* **core:** 实现 Playbook 冲突异步治理与 CLI 审查闭环 ([#112](https://github.com/timerwhou/team-dev-assistant/issues/112)) ([86df9af](https://github.com/timerwhou/team-dev-assistant/commit/86df9afc3644522cdcab9aa06cb4d24dd7faf594))


### Miscellaneous Chores

* release 1.4.0 ([e90fbd8](https://github.com/timerwhou/team-dev-assistant/commit/e90fbd814091a8532d3f193f501f8b3768c319f4))

## [1.3.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.2.0...v1.3.0) (2026-10-21)


### Features

* **core:** 实现 Context Graph 图谱遍历与 OTel 标准追踪 ([#103](https://github.com/timerwhou/team-dev-assistant/issues/103)) ([f803784](https://github.com/timerwhou/team-dev-assistant/commit/f80378402f11b5e14f3764b144f5ec1401f432a5))
* **core:** 实现多 Agent 共享 Playbook 冲突检测与协商机制 ([#104](https://github.com/timerwhou/team-dev-assistant/issues/104)) ([5ac0362](https://github.com/timerwhou/team-dev-assistant/commit/5ac0362ab5d2b721b4a7ef7e60598f97179fa228))
* **security:** OAuth 2.1 资源服务器与 RFC 8707 校验 ([#101](https://github.com/timerwhou/team-dev-assistant/issues/101)) ([ad2f2c6](https://github.com/timerwhou/team-dev-assistant/commit/ad2f2c6f1b1b2b7ca496ada3bc9c43da1695a071))


### Miscellaneous Chores

* release 1.3.0 ([d797d9b](https://github.com/timerwhou/team-dev-assistant/commit/d797d9bec02277cb396641ae53b266e416aec86d))

## [1.2.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.1.0...v1.2.0) (2026-10-19)


### Features

* **mcp:** 支持 Streamable HTTP 传输层，对齐 2026-07-28 安全规范 ([#93](https://github.com/timerwhou/team-dev-assistant/issues/93)) ([645deb3](https://github.com/timerwhou/team-dev-assistant/commit/645deb30fa4c694e1d089e8cd4c59b223e61215b))
* **security:** 实现生产级安全边界与加固 ([#95](https://github.com/timerwhou/team-dev-assistant/issues/95)) ([e033ce8](https://github.com/timerwhou/team-dev-assistant/commit/e033ce8d35e55657cf0a6f822ac00d78baddebf4))
* v1.2.0 生产级安全边界与 Eval 架构拆分 ([#96](https://github.com/timerwhou/team-dev-assistant/issues/96)) ([60ec8a7](https://github.com/timerwhou/team-dev-assistant/commit/60ec8a7f6cf1e466c39a3bae4fb315610b72c674))

## [1.1.0](https://github.com/timerwhou/team-dev-assistant/compare/v1.0.2...v1.1.0) (2026-10-19)


### Features

* v1.1.0 Story [#79](https://github.com/timerwhou/team-dev-assistant/issues/79) 语义检索与决策图谱 ([#91](https://github.com/timerwhou/team-dev-assistant/issues/91)) ([5edc897](https://github.com/timerwhou/team-dev-assistant/commit/5edc8979b72f431b665e1c1201fdee5f8a2d95b2))

## [1.0.2](https://github.com/timerwhou/team-dev-assistant/compare/v1.0.1...v1.0.2) (2026-10-19)


### Bug Fixes

* **security:** 注入数据清洗切断污点流，并配置 CodeQL 集中式误报豁免 ([1f88fed](https://github.com/timerwhou/team-dev-assistant/commit/1f88fedb4ea85694d0a86c5b47ac1989045be3f3))
* **security:** 移除不安全的 HTML 正则，改用纯文本清洗并集中豁免误报 ([#89](https://github.com/timerwhou/team-dev-assistant/issues/89)) ([e1ab18b](https://github.com/timerwhou/team-dev-assistant/commit/e1ab18b91e722cdc75075da112998de83e443485))

## [1.0.1](https://github.com/timerwhou/team-dev-assistant/compare/v1.0.0...v1.0.1) (2026-10-18)


### Bug Fixes

* **docs:** 修复 CI 环境下无 eval 报告时的构建死链问题，增加 Fallback 占位页 ([d15d33d](https://github.com/timerwhou/team-dev-assistant/commit/d15d33de206bbdbe29489c7a48934de3a4057343))

## [1.0.0](https://github.com/timerwhou/team-dev-assistant/compare/v0.6.1...v1.0.0) (2026-10-18)


### Features

* v1.0.0 Team Playbook 架构基座与记忆闭环 ([#80](https://github.com/timerwhou/team-dev-assistant/issues/80)) ([ffafec3](https://github.com/timerwhou/team-dev-assistant/commit/ffafec3258ff485f413f2fd8429acff3dd8a7998))
* v1.0.0 生产级发布候选版 (Team Playbook 架构记忆体) ([#85](https://github.com/timerwhou/team-dev-assistant/issues/85)) ([ba4ed2e](https://github.com/timerwhou/team-dev-assistant/commit/ba4ed2e2d22b15caf93d57a19630695f849c5982))


### Miscellaneous Chores

* release 1.0.0 ([1f5d820](https://github.com/timerwhou/team-dev-assistant/commit/1f5d8209426082d35fc817af95bcde8880be22c2))

## [0.6.1](https://github.com/timerwhou/team-dev-assistant/compare/v0.6.0...v0.6.1) (2026-10-18)


### Bug Fixes

* **ci:** 修复 Deploy Docs 死链与生成文件缺失 ([#70](https://github.com/timerwhou/team-dev-assistant/issues/70)) ([a8d6ea2](https://github.com/timerwhou/team-dev-assistant/commit/a8d6ea29281f1f1b1c1228f9a624c4c3464a89de))

## [0.6.0](https://github.com/timerwhou/team-dev-assistant/compare/v0.5.0...v0.6.0) (2026-10-18)


### Features

* **a2a:** 支持 WebSocket 传输与多接口声明 ([#65](https://github.com/timerwhou/team-dev-assistant/issues/65)) ([d7c46bb](https://github.com/timerwhou/team-dev-assistant/commit/d7c46bbaed73dcdad137b676fbdfe9e8abccd1a4))

## [0.5.0](https://github.com/timerwhou/team-dev-assistant/compare/v0.4.0...v0.5.0) (2026-10-18)


### Features

* **eval:** eval 消费 Trace 数据，支持轨迹断言 ([#54](https://github.com/timerwhou/team-dev-assistant/issues/54)) ([272871c](https://github.com/timerwhou/team-dev-assistant/commit/272871c609c6da5a79697cc706b515ac4db4cf55))

## [0.4.0](https://github.com/timerwhou/team-dev-assistant/compare/v0.3.0...v0.4.0) (2026-10-16)


### Features

* **core:** Tool Context 压缩与 Token 预算 ([#43](https://github.com/timerwhou/team-dev-assistant/issues/43)) ([9b3d28b](https://github.com/timerwhou/team-dev-assistant/commit/9b3d28b69e561af435d8ccb6ebbbb9b1410f5bc8))

## [0.3.0](https://github.com/timerwhou/team-dev-assistant/compare/v0.2.0...v0.3.0) (2026-10-16)


### Features

* **core:** 新增 context/ 模块骨架 + ADR-0005 ([#41](https://github.com/timerwhou/team-dev-assistant/issues/41)) ([91ba06c](https://github.com/timerwhou/team-dev-assistant/commit/91ba06c7f052ec548b38519b977de469a9b61533))

## [0.2.0](https://github.com/timerwhou/team-dev-assistant/compare/v0.1.6...v0.2.0) (2026-10-16)


### Features

* **docs:** MCP v2 迁移文档与客户端验证 ([#33](https://github.com/timerwhou/team-dev-assistant/issues/33)) ([96fe39d](https://github.com/timerwhou/team-dev-assistant/commit/96fe39d94956374e78b1b7c9c0d326014f9d689d))

## [0.1.6](https://github.com/timerwhou/team-dev-assistant/compare/v0.1.5...v0.1.6) (2026-10-16)


### Bug Fixes

* **release:** 对齐版本策略与里程碑规划 ([#31](https://github.com/timerwhou/team-dev-assistant/issues/31)) ([5302732](https://github.com/timerwhou/team-dev-assistant/commit/5302732614a1eda0df257be54a33071152d3d0bd))

## [0.1.5](https://github.com/timerwhou/team-dev-assistant/compare/v0.1.4...v0.1.5) (2026-10-16)


### Features

* **mcp:** 升级到 v2 SDK (2026-07-28 规范) ([#27](https://github.com/timerwhou/team-dev-assistant/issues/27)) ([fe13864](https://github.com/timerwhou/team-dev-assistant/commit/fe1386444b3e0b2bc47c5c1fa855e1a435c293c2))
* **mcp:** 用 @olaservo/ext-skills 实现原生 Skills Extension ([#29](https://github.com/timerwhou/team-dev-assistant/issues/29)) ([e41eeb8](https://github.com/timerwhou/team-dev-assistant/commit/e41eeb8a02fbe5d3138bcdd96ce4425b7f119ab0))

## [0.1.4](https://github.com/timerwhou/team-dev-assistant/compare/v0.1.3...v0.1.4) (2026-10-16)


### Features

* **docs:** Skill 文档自动聚合 ([#26](https://github.com/timerwhou/team-dev-assistant/issues/26)) ([37fef4f](https://github.com/timerwhou/team-dev-assistant/commit/37fef4f73bb681f7e8e9908036221087669e195b))
* **skills:** Skill 目录结构适配 SEP-2640 ([#19](https://github.com/timerwhou/team-dev-assistant/issues/19)) ([022baaf](https://github.com/timerwhou/team-dev-assistant/commit/022baaf10b37302b2ccf059479105748d25123b8))

## [0.1.3](https://github.com/timerwhou/team-dev-assistant/compare/v0.1.2...v0.1.3) (2026-10-16)


### Bug Fixes

* **docs:** 版本号从 package.json 动态读取 ([#10](https://github.com/timerwhou/team-dev-assistant/issues/10)) ([cb602e9](https://github.com/timerwhou/team-dev-assistant/commit/cb602e92a8263d9021d610322bf2f95708a7d3f6))

## [0.1.2](https://github.com/timerwhou/team-dev-assistant/compare/v0.1.1...v0.1.2) (2026-10-16)


### Bug Fixes

* **ci:** labeler v5 语法 —— 用 changed-files + any-glob-to-any-file ([aff3583](https://github.com/timerwhou/team-dev-assistant/commit/aff35839e01951b67d74fa2e558b1bd41275286d))
* **ci:** 改用聚合门禁（aggregate gate）作为唯一 Required check ([1a6a5c4](https://github.com/timerwhou/team-dev-assistant/commit/1a6a5c4ea53ed78397e1b5fc738c0fce2c8a8d8f))

## [0.1.1](https://github.com/timerwhou/team-dev-assistant/compare/v0.1.0...v0.1.1) (2026-10-16)


### Features

* **a2a:** @tda/a2a 协议层 ([56e178a](https://github.com/timerwhou/team-dev-assistant/commit/56e178aa4d4352b9683ca975f97f486408a121ef))
* **cli:** @tda/cli 命令行入口 ([035975c](https://github.com/timerwhou/team-dev-assistant/commit/035975c00ce8f8f4555ee2266d037448528ff427))
* **core:** @tda/core 纯逻辑层 ([5ee8141](https://github.com/timerwhou/team-dev-assistant/commit/5ee8141a28562502ffcc1eca346007afd199a393))
* **core:** 可观测性 —— LLM/Agent trace ([37c598f](https://github.com/timerwhou/team-dev-assistant/commit/37c598fb00b9a328a5c5eaa2126ba5a674215075))
* **docker:** 容器化 —— 单阶段构建 + compose 一键起多 Agent ([34ec809](https://github.com/timerwhou/team-dev-assistant/commit/34ec80993f9b14c715deeb2cf51e3fe677ffe3da))
* **eval:** 评估集 —— 8 个用例覆盖 review/investigate/security ([cdc00f4](https://github.com/timerwhou/team-dev-assistant/commit/cdc00f4c113783b84f88d451eafe05a12ffbfaa2))
* **mcp:** @tda/mcp-server MCP 层 ([d23a85a](https://github.com/timerwhou/team-dev-assistant/commit/d23a85a776aacb7ffff81504a21ec9a999d347ba))
* **skills:** @tda/skills Skill 系统 ([48b4169](https://github.com/timerwhou/team-dev-assistant/commit/48b41690f21dde93c262987ad1de3789d67d0055))
* **tools:** @tda/tools 工具集 ([843ac9c](https://github.com/timerwhou/team-dev-assistant/commit/843ac9cf94da6fad7e3b9430ec23fafdba5d100f))
* v0-v5 完成 + 安全加固 + 端到端打通 ([9b3457b](https://github.com/timerwhou/team-dev-assistant/commit/9b3457be82822112fcd217c58c1b262193726c44))
* 完整 monorepo 重构（v0-v5） ([6d8ef39](https://github.com/timerwhou/team-dev-assistant/commit/6d8ef399f03efa0fa9704aeb9084b2825be1c2af))


### Bug Fixes

* **mcp:** prompt argsSchema 用 ZodRawShape；补齐 openai 依赖 ([f65c513](https://github.com/timerwhou/team-dev-assistant/commit/f65c5139941bdfca2c180271fd608cbb6344de8e))
