# 评估集

防止 prompt 改动导致能力退化。

## 运行

```bash
pnpm eval
```

## 用例结构

```json
{
  "id": "investigate-no-sql",
  "skill": "investigate",
  "input": "项目里有没有 SQL 注入",
  "mustContain": ["结论"],
  "mustNotContain": ["达到了最大步数"],
  "description": "验证 Agent 能收敛并给出结论"
}
```

## 断言类型

| 字段 | 含义 |
|---|---|
| `mustContain` | 输出**必须**包含所有子串 |
| `mustNotContain` | 输出**必须不**包含任何子串 |
| `mustContainAny` | 输出**至少**包含一个子串 |

## 输出

```bash
cat eval/report/latest.json
```

JSON 报告含：通过率、每个用例的耗时、工具调用数、失败原因。
