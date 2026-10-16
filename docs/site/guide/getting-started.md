# 快速开始

## 前置要求

- Node.js 22+
- pnpm 10+
- ripgrep（用于 `search_code`）

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
pnpm dev "/issues --state=open"
```

### 多 Agent 协作（A2A）

```bash
pnpm start:all "apps/cli/src/index.ts" "项目里有没有 SQL 注入"
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
