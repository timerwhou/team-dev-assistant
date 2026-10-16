# 架构

## 总览

```
                      ┌──────────────────────────────────────┐
                      │             用户入口                 │
                      └──────────────────────────────────────┘
                        │               │              │
                        ▼               ▼              ▼
                    ┌──────┐      ┌──────────┐    ┌─────────┐
                    │ CLI  │      │ A2A 多   │    │ MCP     │
                    │      │      │ Agent    │    │ Server  │
                    └──────┘      └──────────┘    └─────────┘
                        │               │              │
                        └───────────────┼──────────────┘
                                        ▼
                      ┌──────────────────────────────────────┐
                      │           @tda/skills                │
                      │  review / investigate / issues       │
                      │  (SystemPrompt + 工具白名单 + 步数)  │
                      └──────────────────────────────────────┘
                                        ▼
                      ┌──────────────────────────────────────┐
                      │           @tda/core                  │
                      │  ┌────────────────────────────────┐  │
                      │  │ runAgent                       │  │
                      │  │  ├─ LLM 调用（traced）         │  │
                      │  │  ├─ Tool Use 多轮链路          │  │
                      │  │  ├─ 收敛机制（语义进展信号）   │  │
                      │  │  └─ trace 记录                 │  │
                      │  └────────────────────────────────┘  │
                      └──────────────────────────────────────┘
                                        ▼
                      ┌──────────────────────────────────────┐
                      │           @tda/tools                 │
                      │  read_file / search_code / list_issues│
                      │  (Zod Schema + 安全校验)             │
                      └──────────────────────────────────────┘
```

## 数据流（三个入口）

### 入口 1：CLI（本地调试）

```
用户输入 /review apps/cli/src/index.ts
    ↓
apps/cli 解析参数 + 校验
    ↓
skillsByName.get("review") → 拿到 SystemPrompt + 工具白名单
    ↓
runAgent(system, user, { tools, executeTools })
    ↓
LLM 决定调 read_file / search_code
    ↓
executeToolCalls 并行执行只读工具
    ↓
结果回传 LLM，循环直到收敛
    ↓
输出 Markdown 报告 + 写 trace
```

### 入口 2：A2A（多 Agent 协作）

```
coordinator 启动
    ↓
GET /.well-known/agent.json 拿到两个 Agent Card
    ↓
POST reviewer / investigator 派活（tasks/send）
    ↓
Agent 内部走 @tda/core 的 runAgent
    ↓
coordinator 轮询 tasks/get 直到 completed
    ↓
汇总两份 artifact
```

### 入口 3：MCP（外部 AI 客户端接入）

```
Claude Desktop / Cursor
    ↓ stdio
@tda/mcp-server 暴露 Tools / Prompts / Resources
    ↓
客户端调用 read_file / search_code / code_review prompt
    ↓
MCP Server 用 @tda/tools 实现，复用业务逻辑
```

## 技术决策

### 为什么用 monorepo（pnpm workspace）

- **包边界清晰**：core / tools / skills / a2a / mcp 各司其职
- **依赖单向**：apps → packages，packages 内部也单向
- **共享类型**：@tda/core 导出 AgentOptions、ToolCallResult 等，所有消费方复用
- **独立演进**：改 skills 不影响 tools，反之亦然

### 为什么 Agent 用惰性初始化 LLM client

- 允许 app 在 import 后才加载 .env
- 测试时可以不设 key
- 避免模块加载时抛异常

### 为什么收敛机制有三层

| 层级 | 机制 | 触发 |
|---|---|---|
| 软 | Prompt 完成条件清单 | 模型自判 |
| 中 | 语义进展信号（seenFiles 集合） | 连续 2 轮无新文件 |
| 硬 | 连续失败 / 工具总量 / 最大步数 | 兜底 |

**从"按次数停"升级到"按信息增量停"，是当前 Agent 工程的主流做法。**

### 为什么用 A2A 而不是自定义协议

- **标准化**：Agent Card + JSON-RPC + Task 生命周期
- **可发现**：/.well-known/agent.json
- **可组合**：任何实现 A2A 的 Agent 都能接入
- **对齐前沿**：Google 开源，已捐给 Linux Foundation

### 为什么 MCP 和 A2A 都做

- **MCP**：向下连工具和数据（给 Claude Desktop / Cursor 用）
- **A2A**：向右连 Agent 和 Agent（给多 Agent 协作用）
- **互补**，不冲突

## 安全设计

| 风险 | 防护 |
|---|---|
| 命令注入 | `execFile` + 参数数组，不走 shell |
| 路径穿越 | `path.relative` 校验，拒绝 `..` 逃逸 |
| 越权读文件 | `TDA_ROOT` 限制作用域 |
| 密钥泄露 | `.env` 不进 git、不进镜像 |
| Prompt 注入 | input 与 args 分离，flag 不进 prompt |

## 可观测性

- 每次 LLM 调用记录：model / tokens / 耗时 / 成本
- 每次 Agent 运行记录：steps / toolCalls / stopReason
- JSONL 输出到 `.traces/YYYY-MM-DD.jsonl`
- `TDA_TRACE=0` 关闭，`TDA_TRACE_CONSOLE=1` 打到控制台

