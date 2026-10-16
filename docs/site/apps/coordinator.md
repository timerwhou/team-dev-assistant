# Coordinator

多 Agent 协调器：发现能力 → 派活 → 等待 → 汇总。

## 启动全部

```bash
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"
```

脚本会：
1. 启动 reviewer（4101）
2. 启动 investigator（4102）
3. 健康检查
4. 启动 coordinator

## 环境变量

| 变量 | 默认值 |
|---|---|
| `REVIEWER_URL` | `http://localhost:4101` |
| `INVESTIGATOR_URL` | `http://localhost:4102` |

## Docker 里

`docker/compose.yml` 使用服务名作为主机名：

```
REVIEWER_URL=http://reviewer:4101
INVESTIGATOR_URL=http://investigator:4102
```
