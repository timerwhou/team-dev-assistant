# 简历素材

## 项目名

**Team Dev Assistant —— 多 Agent 研发协作系统**

## 一句话

基于 MCP + A2A 协议的 AI Agent 系统，支持代码评审、问题排查、Issue 汇总，多 Agent 协作 + 可观测性 + 评估集 + 容器化部署。

## 技术栈

TypeScript · Node.js 24 · pnpm workspace · OpenAI SDK · Zod · Express · Model Context Protocol (MCP) · Agent-to-Agent (A2A) · Docker · GitHub Actions

## 简历 bullet（选 4-6 条）

1. **设计并实现 AI Agent 核心循环**：支持 Function Calling / 多轮 Tool Use，实现三层收敛机制（Prompt 完成条件 + 语义进展信号 + 硬兜底），解决 Agent 打转问题，收敛步数从 8+ 降到 3-5。

2. **标准化协议接入**：实现 MCP Server（Tools + Prompts + Resources）供 Claude Desktop / Cursor 接入；实现 A2A 协议（Agent Card + JSON-RPC + Task 生命周期）支撑多 Agent 协作。

3. **安全加固**：用 `execFile` + 参数数组替代 `exec`，消除 `search_code` 的命令注入；用 `path.relative` 校验替代前缀匹配，消除 `read_file` 的路径穿越。编写回归测试覆盖攻击用例。

4. **可观测性**：设计 LLM/Agent/Tool trace 体系，记录 model / tokens / 耗时 / 成本 / stopReason，输出 JSONL 供离线分析；提供 `trace-stats.sh` 一键统计。

5. **评估集**：建 8 个用例覆盖 review / investigate / security 场景，命令行跑分 + JSON 报告，用于防止 prompt 改动导致的能力退化。

6. **工程化**：pnpm workspace monorepo（11 个包）；Docker 多 Agent 编排（healthcheck + depends_on）；GitHub Actions CI（typecheck + test + eval）。

7. **用 AI 突破不熟悉领域**：全程用 Cursor + Claude Code 加速，包括生成 A2A 协议实现、排查 Docker 软链问题、审计自身代码的安全漏洞。

## 面试 Q&A 准备

### Q1：你怎么知道 prompt 改了之后 Agent 变好还是变差？

**答**：建了评估集，8 个用例覆盖 3 个 skill，每次改 prompt 先跑 `pnpm eval`，通过率 8/8 才提交。评估集能挂到 CI（手动触发 + 每周定时），防止退化。

### Q2：Agent 会打转吗？怎么解决？

**答**：会。最初 Agent 跑满 8 步没结论，我实现了三层收敛：
- **软**：Prompt 里写完成条件清单（满足任意一条即停）
- **中**：语义进展信号——跟踪已检索文件集合，连续 2 轮无新文件就强制收口
- **硬**：连续失败 / 工具总量 / 最大步数

从"按次数停"升级到"按信息增量停"，收敛步数从 8+ 降到 3-5。

### Q3：MCP 和 A2A 有什么区别？

**答**：
- **MCP**（Model Context Protocol）：连 Agent 和工具/数据。我实现了一个 MCP Server，暴露 `read_file` / `search_code` / `code_review` prompt，Claude Desktop 和 Cursor 都能接。
- **A2A**（Agent-to-Agent）：连 Agent 和 Agent。我实现了 coordinator 通过 A2A 发现 reviewer / investigator 两个 Agent，派活、等待、汇总。
- 两者互补：MCP 向下连工具，A2A 向右连同伴。

### Q4：怎么保证 Agent 的安全？

**答**：
- **命令注入**：`search_code` 最初用 `exec`，Reviewer Agent 自己发现了这个漏洞（`$(id)` 会被执行），改成 `execFile` + 参数数组，不走 shell
- **路径穿越**：`read_file` 最初用 `startsWith(root)` 校验，可被 `../root-evil/secret` 绕过，改成 `path.relative` + 拒绝 `..`
- **回归测试**：写了 4 个路径穿越攻击用例，2 个正常用例，全部通过
- **密钥隔离**：`.env` 不进 git、不进 Docker 镜像，CI 用 GitHub Secrets

### Q5：项目的可观测性怎么做？

**答**：设计了三类 trace event（llm_call / agent_run / tool_call），每次 LLM 调用记录 model / tokens / 耗时 / 成本（含定价表），每次 Agent 运行记录 steps / toolCalls / stopReason。Reporter 可插拔（JSONL + Console），`TDA_TRACE=0` 可关闭。`trace-stats.sh` 一键统计最新文件。

### Q6：为什么用 monorepo？

**答**：
- **包边界清晰**：core（纯逻辑）/ tools（工具）/ skills（Prompt）/ a2a（协议）/ mcp（协议）/ apps（入口）
- **依赖单向**：apps → packages，避免循环依赖
- **共享类型**：`@tda/core` 导出 AgentOptions、ToolCallResult 等，所有消费方复用
- **独立演进**：改 skills 不影响 tools

### Q7：怎么用 AI 加速开发的？

**答**：
- **Cursor 写代码**：生成 MCP / A2A 协议实现的样板代码
- **Claude Code 排查**：Docker 软链问题、类型报错
- **Reviewer Agent 审计**：把我自己的 CLI 代码交给 Agent 评审，它发现了 9 个真实问题（`join/split` 破坏空格、`flush` 未 await、`as any` 绕过类型等）
- **用 AI 突破不熟悉领域**：A2A 协议、Docker 多阶段构建、pnpm workspace 都是我边学边做

## 项目链接

- GitHub：https://github.com/timerwhou/team-dev-assistant
- CI 徽章：![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)
- Eval 徽章：![Eval](https://github.com/timerwhou/team-dev-assistant/actions/workflows/eval.yml/badge.svg)
