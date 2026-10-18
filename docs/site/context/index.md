> **延伸阅读**：Context Engineering 解决了“工具结果太长”的压缩问题，而 [Team Playbook](/guide/playbook) 解决了“模型缺乏项目背景”的幻觉问题。两者结合，构成了完整的上下文注入闭环。

# Context Engineering

显式化上下文组装层，实现工具结果压缩与 Token 预算控制。

## 上下文层次

```
┌─────────────────────────────────────────┐
│           ContextBuilder                │
├─────────────────────────────────────────┤
│  Instruction  │  SystemPrompt 组装      │
├─────────────────────────────────────────┤
│  Tool         │  工具结果压缩           │
├─────────────────────────────────────────┤
│  History      │  历史消息管理           │
└─────────────────────────────────────────┘
```

## 核心能力

| 能力 | 说明 |
|---|---|
| **Tool Context 压缩** | `read_file` 超 500 行、`search_code` 超 20 匹配时截断 |
| **Token 预算** | 总上下文不超过配置的 max tokens |
| **Trace 记录** | 每次压缩决策被 trace（`context_build` 事件） |

## 收益量化

### 单次工具结果压缩

| 指标 | 值 |
|---|---|
| 总工具调用 | 24 |
| 触发压缩 | 2（8%） |
| 压缩前 tokens | 251,169 |
| 压缩后 tokens | 172,079 |
| **累计节省** | **79,090 tokens** |
| **平均压缩比** | **31.5%** |

### 端到端对比

| 用例 | 无压缩 | 有压缩 | 节省 | 耗时变化 |
|---|---|---|---|---|
| investigate-no-sql | 55,594 | 4,969 | **-91.1%** | 38s → 11s |
| investigate-command-injection | 14,545 | 11,788 | **-19.0%** | 10s → 14s |
| investigate-convergence | 240,160 | 3,830 | **-98.4%** | 28s → 10s |

**关键观察**：

1. **高上下文任务收益最显著**：`investigate-convergence` 从 240,160 降到 3,830 tokens（**-98.4%**），接近 Anthropic Code Execution with MCP 的 98.7% 缩减案例
2. **低上下文任务收益有限**：`investigate-command-injection` 只省 19%（大部分工具结果在阈值内）
3. **延迟同步下降**：`investigate-no-sql` 从 38s 降到 11s（-71%）

## 相关文档

- [设计文档](/context/design)
- [ADR-0005: Introduce Context Engineering Layer](/adr/0005-context-engineering)
- [ADR-0006: Decouple Versioning from Milestones](/adr/0006-decouple-versioning-from-milestones)
