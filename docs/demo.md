# 3 分钟演示脚本

## 准备

```bash
cd team-dev-assistant
pnpm install
cp .env.example .env  # 填 OPENAI_API_KEY
```

## 演示 1：单 Agent CLI（30 秒）

```bash
pnpm dev "/review apps/cli/src/index.ts"
```

**看点**：
- 多轮工具调用（read_file + search_code）
- 结构化输出（结论 / 问题清单 / 评分）
- 收敛（3-5 步内给出结论，不会烧步数）

## 演示 2：安全审计（45 秒）

```bash
pnpm dev "/investigate 项目里有没有命令注入漏洞"
```

**看点**：
- Agent 自主搜索 + 读取源码
- 发现 `execFile` 和 `assertInsideRoot`
- 给出证据链（文件:行号）

## 演示 3：多 Agent A2A（90 秒）

```bash
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"
```

**看点**：
- 两个 Agent 并行启动
- coordinator 发现能力 → 派活 → 等待 → 汇总
- 独立进程、独立端口、标准协议

## 演示 4：容器化一键起（30 秒）

```bash
cd docker
docker compose up -d
sleep 10
docker compose logs --tail=80 coordinator
docker compose down
```

**看点**：
- 一条命令起全部
- 健康检查 + 依赖顺序
- 6 秒启动（不是 43 秒）

## 演示 5：可观测性（20 秒）

```bash
bash scripts/trace-stats.sh
```

**看点**：
- LLM 调用次数、token 数、成本、平均延迟
- 每次 Agent 运行的 steps / toolCalls / stopReason

## 演示 6：评估集（可选，2 分钟）

```bash
pnpm eval
```

**看点**：
- 8 个用例覆盖 review / investigate / security
- 输出 JSON 报告
- 用于防 prompt 退化
