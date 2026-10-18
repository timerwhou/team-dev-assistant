# 生产环境建议使用 LTS 版本，如 node:22-slim
FROM node:22-slim

# 增加 OCI 元数据标签 (GHCR 会自动识别并关联到 GitHub 仓库)
LABEL org.opencontainers.image.title="Team Dev Assistant"
LABEL org.opencontainers.image.description="具备自演进架构记忆的研发基座"
LABEL org.opencontainers.image.source="https://github.com/timerwhou/team-dev-assistant"
LABEL org.opencontainers.image.licenses="MIT"

# 安装系统依赖 (ripgrep 用于 search_code)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ripgrep git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 安装 pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# 优先复制 lockfile 和 package.json 以利用 Docker 缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY scripts/ ./scripts/
COPY docs/ ./docs/
COPY tsconfig.base.json ./

# 安装依赖
RUN CI=true pnpm install --frozen-lockfile --prod=false

# 构建 MCP Server 产物 (如果依赖 workspace 包，这里确保产物存在)
RUN pnpm --filter @tda/mcp-server build

# 创建非 root 用户
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

# 默认启动 CLI 模式（为了兼容旧有行为）
# 如需作为 MCP Server 运行，可覆盖此 CMD：
# docker run ghcr.io/timerwhou/team-dev-assistant node /app/packages/mcp-server/dist/index.js
CMD ["node_modules/.bin/tsx", "apps/cli/src/index.ts", "--", "/help"]
