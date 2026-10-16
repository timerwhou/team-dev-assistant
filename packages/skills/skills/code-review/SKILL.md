---
name: review
description: 评审指定文件或代码片段，输出结构化问题清单
tools:
  - read_file
  - search_code
maxSteps: 8
examples:
  - "/review src/index.ts"
  - "/review src/agent/loop.ts --language=typescript"
---

# Code Review

资深代码评审。发现 bug、安全隐患、性能问题和可读性问题。

## When to use

- 用户请求"评审这段代码" / "review this file" / "帮我看看这段代码"
- 代码提交前的自动审查
- 需要发现 bug、安全隐患、性能问题、可读性问题

**不适用**：
- 需要重构整个模块（用未来可能的 `/refactor`）
- 只需要格式化（用 formatter）

## Workflow

1. 如果 target 是文件路径，用 `read_file` 读取
2. 如果是代码片段，直接评审
3. 需要上下文时用 `search_code` 查找相关定义
4. 通读后逐项检查：正确性、边界、安全、性能、可读性

## Stop conditions

满足**任意一条**，立即停止调用工具并输出结论：

1. 已完整读取目标文件或已拿到完整代码片段
2. 需要上下文时最多再读 2 个相关文件，之后停止
3. 工具调用失败 1 次以上，直接基于已有内容评审

## Tool discipline

- 目标为文件路径时，先 `read_file` 读取
- 需要查定义时用 `search_code`，不盲猜文件
- 同一文件只读一次

## Output format

```markdown
## 结论
一句话总结。

## 问题清单
| 严重程度 | 位置 | 问题 | 建议 |
|---|---|---|---|

## 评分
0-100 分，并说明扣分理由。
```

## Examples

### Example 1：简单函数

**Input**: `function add(a, b) { return a + b; }`

**Output**:
```
## 结论
函数实现正确，但缺少类型标注。

## 问题清单
| 严重程度 | 位置 | 问题 | 建议 |
|---|---|---|---|
| low | L1 | 参数缺少类型标注 | 为 a、b 添加 number 类型 |

## 评分
85 — 逻辑正确，扣分在类型安全
```

### Example 2：SQL 注入风险

**Input**:
```js
function getUser(id) {
  const sql = "SELECT * FROM users WHERE id = " + id;
  return db.query(sql);
}
```

**Output**:
```
## 结论
存在 SQL 注入漏洞，必须修复。

## 问题清单
| 严重程度 | 位置 | 问题 | 建议 |
|---|---|---|---|
| high | L2 | 字符串拼接 SQL 导致注入风险 | 用参数化查询：db.query('SELECT * FROM users WHERE id = ?', [id]) |

## 评分
30 — 高危安全问题
```

## References

- `references/checklist.md` — 完整评审清单
