# Changelog

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
