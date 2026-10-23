# ---- 生产镜像构建 ----
# 🌟 锁定到 2026年10月安全版本
FROM node:22.23.4-slim

LABEL org.opencontainers.image.title="Team Dev Assistant"
LABEL org.opencontainers.image.description="具备自演进架构记忆的研发基座"
LABEL org.opencontainers.image.source="https://github.com/timerwhou/team-dev-assistant"
LABEL org.opencontainers.image.licenses="MIT"

# 安装系统依赖 (ripgrep 用于 search_code, git 用于代码操作)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ripgrep git ca-certificates \
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

# 🌟 拓扑构建：构建所有角色的产物
RUN pnpm --filter @tda/a2a build
RUN pnpm --filter @tda/mcp-server build
RUN pnpm --filter studio build
RUN pnpm --filter @tda/reviewer build
RUN pnpm --filter @tda/investigator build
RUN pnpm --filter @tda/coordinator build

# 使用 pnpm deploy 生成纯净的生产依赖（供 mcp-server 使用）
RUN pnpm --filter @tda/mcp-server --prod deploy /prod/mcp-server

# 创建非 root 用户
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app /prod
USER appuser

ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_HTTP_PORT=3000

EXPOSE 3000

# 默认启动 MCP Server（Studio 静态资源由它托管）
# 其他 Agent 在 compose 中通过 command 覆盖启动
CMD ["node", "/prod/mcp-server/dist/index.js"]
