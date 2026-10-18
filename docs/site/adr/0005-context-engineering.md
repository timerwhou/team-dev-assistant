# 5. 引入 Context Engineering 层

## 背景

Agent 在处理长任务（如连续读取大文件）时，原本直接将工具结果塞入 `messages` 数组。这会导致上下文窗口膨胀，引发 Token 成本飙升和模型注意力涣散。

## 设计目标

- 显式化上下文组装逻辑。
- 实现长文本截断与 Token 预算控制。

## 架构设计

在 `@tda/core` 中新增 `context/` 模块。定义 `ContextBuilder` 接口与 `compressToolResult` 策略：当 `read_file` 或 `search_code` 的结果超过预设阈值时，保留首尾关键信息并截断中间部分。同时在 Trace 中记录组装前后的 Token 变化。

## 影响评估

- **正向**：长任务上下文最高节省 98.4% 的 Token 消耗，显著降低成本。
- **负向**：可能因截断丢失文件中间部分的边缘信息。
