# 评估集与 Eval Gate

评估集用于防止 Prompt 或 Context 改动导致 Agent 能力静默退化。本项目采用 **“云端 API（本地开发） + 本地模型（CI 门禁）”** 的双轨制方案，在确保质量的同时彻底摆脱了 CI 中的额度限制。

## 本地运行评估

在本地开发时，你可以使用云端大模型（如 OpenAI、DeepSeek）来运行全量评估，以获得最精准的测试结果：

```bash
# 跑全量评估（依赖 .env 中的 API Key）
pnpm eval

# 只跑 critical 子集（CI 门禁使用的同等子集）
EVAL_SUBSET=critical pnpm eval
```

## CI 门禁 (零额度依赖架构)

在 GitHub Actions 中，为了彻底摆脱对第三方 API Key 和额度（Rate Limit）的限制，我们引入了 **Ollama 本地推理 + 缓存加速** 方案：

1. **缓存模型**：利用 `actions/cache` 缓存 `~/.ollama/models` 目录。首次运行需下载约 300MB 的极轻量模型（`qwen2.5:0.5b`），后续运行直接命中缓存，耗时仅为秒级。
2. **本地拉起**：在 Runner 内部直接 `ollama serve` 启动本地服务。
3. **无缝对接**：Eval 脚本通过 OpenAI 兼容协议，将 `OPENAI_BASE_URL` 指向 `http://localhost:11434/v1`，无需修改业务代码。

这保证了即使在没有配置任何云端 API Key 的情况下，CI 依然能执行高可靠、确定性的质量门禁。

## 轨迹断言（Trace Evaluation）

评估集不仅检查最终输出，还通过 `recorder` 捕获 Trace 事件，断言：
- **stopReason**：Agent 是否正常收口。
- **mustUseTools**：Agent 是否调用了预期的工具（如 `search_code`）。
- **maxToolCalls**：是否陷入打转（步数超标）。
- **mustHaveContextBuild**：长任务中是否触发了 Context 压缩。

## 用例结构

```json
{
  "id": "investigate-no-sql",
  "skill": "investigate",
  "input": "项目里有没有 SQL 注入",
  "mustContain": ["结论"],
  "expect": {
    "mustUseTools": ["search_code"],
    "maxToolCalls": 10
  }
}
```

## 质量仪表盘

在 GitHub Actions 的 `eval-gate` job 中，如果 critical 用例失败，PR 将被阻塞。质量仪表盘会展示在文档站的 [Eval](/eval/) 页面。
