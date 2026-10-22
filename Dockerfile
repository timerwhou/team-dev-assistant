# ---- 构建阶段 ----
FROM node:22-slim AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制所有源码
COPY . .

# 安装依赖并构建
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tda/mcp-server build
RUN pnpm --filter studio build

# ---- 运行阶段 ----
FROM node:22-slim AS runner
WORKDIR /app

RUN npm install -g pnpm

# 仅复制必要文件
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/node_modules /app/node_modules
# 复制 Studio 构建产物
COPY --from=builder /app/apps/studio/build /app/apps/studio/build

ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_HTTP_PORT=3000

EXPOSE 3000

# 启动命令
CMD ["node", "packages/mcp-server/dist/index.js"]
