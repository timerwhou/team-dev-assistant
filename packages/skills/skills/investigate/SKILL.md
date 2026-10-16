---
name: investigate
description: 在代码库中排查问题，给出证据链和结论
tools:
  - search_code
  - read_file
maxSteps: 12
examples:
  - "/investigate 项目里有没有 SQL 注入"
  - "/investigate 为什么登录接口偶发 500"
---

# Investigate

在代码库中定位问题并给出证据链。**结论必须有文件:行号支撑**。

## When to use

- 用户问"项目里有没有 X" / "为什么 Y 会失败" / "排查一下 Z"
- 代码审计（安全、性能、依赖）
- 问题定位（bug、异常、行为不符预期）

**不适用**：
- 单纯代码评审（用 `/review`）
- 只需要格式化（用 formatter）

## Workflow

1. **先搜索，后读文件**：优先用 `search_code` 定位候选文件，不盲猜文件名
2. **精准读取**：一次最多读 2-3 个文件；只在必要时读
3. **不重复读**：同一文件不读第二次
4. **失败即换路**：`read_file` 报"不存在"或 `search_code` 返回空，立刻换关键词或路径

## Stop conditions

满足**任意一条**，立即停止调用工具并输出结论：

1. 找到明确证据（文件:行号 + 具体代码）能直接回答用户问题
2. 连续 2 次 `search_code` 返回的匹配文件与上次高度重叠（检索饱和）
3. 已读取 3 个以上不同文件，但未发现任何与问题相关的代码
4. 工具调用失败 2 次以上

**信息不足也要给结论**：基于已有信息给出"部分结论 + 未能确认的部分"，不无限尝试。

## Tool discipline

- 同一文件只读一次
- `search_code` 返回空结果后，不再用相似关键词重试
- 优先 `search_code` 定位，不盲猜文件名
- `read_file` 报"不存在"，立刻换路径，不重试

## Output format

```markdown
## 结论
直接回答问题。即使信息不全，也要给出当前能给出的判断。

## 证据
- 文件:行号 — 说明

## 建议
具体可执行的建议。

## 未能确认的信息
列出无法获取的部分和原因。
```

## Examples

### Example 1：安全审计

**Input**: `/investigate 项目里有没有 SQL 注入`

**Output**:
```
## 结论
未发现 SQL 注入。项目不包含数据库层。

## 证据
- packages/core/src/index.ts — 无数据库相关导入
- 全仓检索 SELECT/INSERT/UPDATE/DELETE FROM — 0 匹配
- 全仓检索 prisma|sequelize|knex|typeorm — 0 匹配

## 建议
无需整改。若后续引入数据库，使用参数化查询。
```

### Example 2：收敛但未完全确认

**Input**: `/investigate 项目里有没有命令注入`

**Output**:
```
## 结论
未发现命令注入风险。

## 证据
- packages/tools/src/search-code.ts:25 — 使用 execFile + 参数数组，不走 shell
- packages/mcp-server/src/tools/search-code.ts:30 — 同上

## 建议
维持现状。新增子进程调用时沿用 execFile + 参数数组。

## 未能确认的信息
- node_modules 内的第三方包未审计（供应链范畴）
```

## References

- `references/evidence-template.md` — 证据链模板
