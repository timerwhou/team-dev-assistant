FROM node:25-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ripgrep git curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@12.11.2

WORKDIR /app

COPY . .

# 用 CI=true 让 pnpm 在容器内不触发生成 lockfile 的行为，--prod=false 装全部依赖
RUN CI=true pnpm install --frozen-lockfile --prod=false

RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /app
USER appuser

CMD ["node_modules/.bin/tsx", "apps/cli/src/index.ts", "--", "/help"]
