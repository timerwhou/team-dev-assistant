# 快速开始

## 前置要求

- **Node.js 22+**
- **pnpm 10+**
- **可选**：`ripgrep`（用于 `search_code` 提供极速搜索，如未安装，工具内部将自动降级为内置的 `grep`）。

```bash
# macOS
brew install ripgrep

# Ubuntu
sudo apt install ripgrep
```

## 安装

```bash
git clone https://github.com/timerwhou/team-dev-assistant.git
cd team-dev-assistant
pnpm install
cp .env.example .env
# 编辑 .env 填入 OPENAI_API_KEY
```

## 使用

### 单 Agent CLI

```bash
pnpm dev "/review apps/cli/src/index.ts"
pnpm dev "/investigate 项目里有没有 SQL 注入"
```

### 多 Agent 协作（A2A）

```bash
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"
```

### 体验 HITL

```bash
# 在终端中运行，遇到提示时输入 y
pnpm --filter @tda/coordinator dev "[elicit] package.json"
```
执行后，终端会提示 `🤖 Agent 需要澄清：你确定要让我评审这个文件吗？`，输入 `y` 后 Agent 会恢复执行并输出结果。

### 体验架构记忆体（Team Playbook）

1. **提取外部模型背景包**
   ```bash
   pnpm dev "/inject 我要做一个订单推送功能"
   ```
   终端会输出一段包含 Kafka 和 CostService 的决策理由（Rationale），你可以直接复制给外部网页模型。

2. **从代码中沉淀 Fact**
   ```bash
   # 在某个代码文件里加一行注释：// @fact [auth] 必须走 JWT
   pnpm dev "/sync-facts"
   ```
   系统会自动扫描注释，并在 `docs/playbook/` 生成标准的 Markdown 资产。

### 体验协同规划与任务治理 (v1.4.0)

1. **无感收集临时任务**
   ```bash
   pnpm dev "/todo 修复登录页在 Safari 下的样式错位"
   ```
   系统会自动将任务记录在本地，并在配置了 `GITHUB_TOKEN` 的情况下自动创建带 `triage` 标签的 GitHub Issue。

2. **AI 辅助拆解需求**
   ```bash
   pnpm dev "/plan 增加基于 OAuth 2.0 的第三方登录"
   ```
   系统会结合项目原有的鉴权基座（如 JWT 规约），自动生成 6-8 个带有依赖关系的结构化任务。确认后，一键批量生成 GitHub Issue。

3. **异步裁决架构冲突**
   如果多个 Agent 或人类同时写入矛盾的 Playbook 事实，系统不会报错卡住，而是自动将其放入 `.pending/`。
   ```bash
   pnpm dev "/review-conflicts"
   ```
   你可以在任意方便的时候，集中查看这些冲突，并一键采纳或丢弃。

### 评估集（Eval Gate）

```bash
# 跑全量评估
pnpm eval

# 只跑核心用例（CI 门禁使用）
EVAL_SUBSET=critical pnpm eval
```

### 容器化

```bash
cd docker
docker compose up -d
docker compose logs -f coordinator
docker compose down
```

## 验证

```bash
bash scripts/health-check.sh
```
