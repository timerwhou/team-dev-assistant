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

## 演示 3：多 Agent A2A 协作（90 秒）

```bash
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"
```

**看点**：
- 两个 Agent 并行启动
- Coordinator 派活与结果汇总
- A2A 协议交互

## 演示 4：HITL 实时介入（30 秒）

```bash
pnpm --filter @tda/coordinator dev "[elicit] package.json"
```

**看点**：
- 终端暂停并询问：`🤖 Agent 需要澄清：你确定要让我评审这个文件吗？`
- 输入 `y` 后 Agent 恢复执行。

## 演示 5：架构记忆体一键注入（30 秒）

```bash
pnpm dev "/inject 设计一个支付回调"
```

**看点**：
- 检索 `docs/playbook/` 中既有的事实与技术栈。
- 秒级输出包含“决策理由(Rationale)”的高密度 Prompt 背景包。
- 复制给外部模型，彻底消除新模型对项目架构的幻觉。

## 演示 6：可观测性（20 秒）

```bash
bash scripts/trace-stats.sh
```

**看点**：
- 查看 Token 消耗、耗时、Context Engineering 压缩比。
