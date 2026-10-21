# Changelog

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
