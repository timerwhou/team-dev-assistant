# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Pruner（依据拓扑修剪 Monorepo 最小子集）
# ==========================================
FROM node:24-slim AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
# 针对核心对外暴露服务裁剪（拓扑自动纳入 core/a2a/skills 等上游）
RUN turbo prune @tda/mcp-server --docker

# ==========================================
# Stage 2: Builder（构建依赖缓存层与拓扑产物）
# ==========================================
FROM node:24-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12

# 🌟 依赖缓存层：仅复制裁剪后的 package.json 与 lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 代码改动时，此步骤百分之百命中 Docker 缓存（0.1 秒跳过）
RUN CI=true pnpm install --frozen-lockfile

# 复制修剪后的源码与根配置
COPY --from=pruner /app/out/full/ .
COPY tsconfig.base.json turbo.json ./

# 🌟 由 Turbo 自动按拓扑构建依赖
RUN pnpm turbo run build --filter=@tda/mcp-server...

# 生成隔离的纯净生产环境部署目录
RUN pnpm --filter @tda/mcp-server --prod deploy /prod/app

# ==========================================
# Stage 3: Runner（极致精简生产运行时，无任何开发编译器）
# ==========================================
FROM node:24-slim AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="Team Dev Assistant"
LABEL org.opencontainers.image.description="具备自演进架构记忆的研发基座"
LABEL org.opencontainers.image.source="https://github.com/timerwhou/team-dev-assistant"
LABEL org.opencontainers.image.licenses="MIT"

# 安装 Agent 核心能力工具链 (ripgrep / git)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ripgrep git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 安全合规：创建专属非 root 用户
RUN useradd -m -u 10001 appuser
USER appuser

# 仅从 builder 阶段拷入纯净的生产部署包（零 build 垃圾）
COPY --from=builder --chown=appuser:appuser /prod/app ./

ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_HTTP_PORT=3000

EXPOSE 3000

# 默认启动 MCP Server 运行时
CMD ["node", "dist/index.js"]
