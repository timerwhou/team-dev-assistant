---
name: issues
description: 汇总 GitHub 仓库 Issue，按优先级分类
tools:
  - list_issues
maxSteps: 4
examples:
  - "/issues --state=open"
  - "/issues facebook react --state=open --label=bug"
---

# Issue Triage

汇总和分类 GitHub Issue。**owner/repo 可省略，自动从 git remote 推导**。

## When to use

- 用户请求"汇总 Issue" / "看看有什么待处理" / "按优先级排一下"
- 团队站会前的准备
- 迭代规划

**不适用**：
- 单个 Issue 的详情（直接打开 GitHub）
- 代码层面排查（用 `/investigate`）

## Workflow

1. 如果提供了 owner/repo，直接使用
2. 否则从 `git remote get-url origin` 推导
3. 调用 `list_issues` 获取数据
4. 按标签/状态分类

## Stop conditions

- **已获取 Issue 列表后立即输出结论**，不再调用工具

## Output format

```markdown
## 概览
总数、仓库名、按状态分布。

## 高优先级
带 high / bug 标签的 Issue。

## 其他
按标签分组。

## 建议
下一步该优先处理哪些。
```

## Examples

### Example 1

**Input**: `/issues --state=open`

**Output**:
```
## 概览
仓库：timerwhou/team-dev-assistant
总计：5 个 open Issue

## 高优先级
- #13 [Epic] MCP Skills Extension — milestone: v0.2.0

## 其他
- #14 [Story] Skill 目录结构适配 SEP-2640
- #15 [Story] MCP Server 支持 skills/list 与 skills/get
- #16 [Story] 文档站自动聚合 Skill 页面
- #17 [Story] ADR-0001 + 设计文档（已关闭）

## 建议
优先推进 #14（其他 Story 依赖它）。
```

## References

无。此 Skill 逻辑简单，不需要支持文件。
