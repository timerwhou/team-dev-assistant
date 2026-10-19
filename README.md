# Team Dev Assistant

[![CI](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/timerwhou/team-dev-assistant/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/timerwhou/team-dev-assistant?color=orange&label=release)](https://github.com/timerwhou/team-dev-assistant/releases/latest)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io%2Ftimerwhou%2Fteam--dev--assistant-blue?logo=docker)](https://github.com/timerwhou/team-dev-assistant/pkgs/container/team-dev-assistant)
[![Eval](https://img.shields.io/badge/Eval-passing-brightgreen)](https://timerwhou.github.io/team-dev-assistant/eval/)
[![CodeQL](https://img.shields.io/badge/CodeQL-passing-brightgreen)](https://github.com/timerwhou/team-dev-assistant/security/code-scanning)

**面向 AI Agent 研发的团队级架构记忆体**。

> 💡 **为什么需要它？**
> 当你的团队使用 Cursor 或网页版大模型开发时，是否遇到过这些痛点：
> 1. **重复造轮子**：AI 不知道项目里已有 `CostService`，强行手写了计算逻辑，导致资金对账漏洞。
> 2. **决策被遗忘**：新同事问 AI“为什么不用 Redis 做消息队列？”，AI 顺着问题胡编乱造，不知道你们曾因为丢消息踩过坑。
> 3. **上下文断裂**：在网页版试错出的新架构，无法带回内部 IDE。
> 
> **Team Dev Assistant** 通过将业务事实（Facts）与技术规约（Stacks）沉淀为可演进的 `Playbook`，彻底消除跨模型/跨工作流的认知偏差。

## 🎯 典型应用场景

### 场景 A：新需求遇到旧代码（防重复造轮子）
*   **痛点**：写新页面时，AI 自己写了一行 `total = price + tax`。
*   **解法**：系统拦截需求，自动从 Playbook 注入事实：“严禁自行计算，必须调用 `CostService.calculate()`”。

### 场景 B：跨端投喂（外部模型懂架构）
*   **痛点**：去网页版 ChatGPT 设计消息推送，结果版本与项目不符。
*   **解法**：执行 CLI `/inject` 提取背景包，新模型直接基于 `kafkajs ^2.2.4` 规约输出代码。

### 场景 C：自动沉淀（决策资产化）
*   **痛点**：评审确认修改后，宝贵经验随风飘散。
*   **解法**：HITL 确认 `y` 后，系统自动将“决策与理由”写入 Playbook，实现长期记忆。

---

## 🏗️ 架构设计与前沿技术 (v1.2.0)

```text
[ 本地 IDE (Cursor) ]      [ 远程 Agent (Dify/Coze) ]
        |                           |
   (stdio 模式)              (Streamable HTTP 模式)
        +-------------+-------------+
                      |
              [ 安全校验防线 ]
             (Bearer Token / 限流)
                      |
+-------------------------------------------+
|                MCP Server                 |
|  (动态技能发现、资源路由、Playbook 暴露)  |
+-------------------------------------------+
                      |
+-------------------------------------------+
|             Team Playbook 引擎            |
|  [捕获] -> [存储] -> [检索] -> [注入]     |
|    |          |          |          |     |
| @fact      Markdown   语义混合检索   MCP  |
| HITL       YAML决策   (BM25+向量) /inject |
+-------------------------------------------+
```

- **语义混合检索**：引入 BM25 + Embedding 与 RRF 融合算法，跨词精准召回（如“登录鉴权”匹配“JWT”）。
- **双轨制 MCP 接入**：同时支持本地 `stdio` 与远程 `Streamable HTTP` 传输层。
- **原生 Skills (SEP-2640)**：将 Prompt 与工具白名单标准化为可分发的 AI 资产。

## 🚀 快速接入矩阵

### 1. 本地 IDE (Cursor / Claude Code)
在配置文件中直接通过 `npx` 拉起：
```json
{
  "mcpServers": {
    "team-dev-assistant": {
      "command": "npx",
      "args": ["-y", "@tda/mcp-server"]
    }
  }
}
```

### 2. 远程 Agent (Dify / Coze)
开启 HTTP 模式并强制鉴权：
```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 MCP_API_KEY=your-secret pnpm --filter @tda/mcp-server dev
```
*(端点 `http://<ip>:3000/mcp`，请求头需携带 `Authorization: Bearer <key>`)*

### 3. 终端 CLI (一键生成背景包)
```bash
pnpm dev "/inject 我要做一个登录鉴权"
```

## 🛡️ 生产级安全部署

企业级部署建议使用 Docker，并严格遵循最小权限原则：

```bash
docker run -d --rm \
  -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e MCP_API_KEY=your-secure-token \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  -v $(pwd)/docs/playbook:/app/docs/playbook:ro \
  ghcr.io/timerwhou/team-dev-assistant:latest
```
- **只读挂载** (`--read-only` & `:ro`)：防止文件篡改。
- **能力剥离** (`--cap-drop=ALL`)：防容器逃逸。

## 📚 文档
详细设计思路与部署指南：[Team Dev Assistant 文档站](https://timerwhou.github.io/team-dev-assistant/)

## 📄 License
[MIT](LICENSE)
