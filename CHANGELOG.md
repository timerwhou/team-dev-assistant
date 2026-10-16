# Changelog

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
