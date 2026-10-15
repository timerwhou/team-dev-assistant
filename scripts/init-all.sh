#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 根 devDependencies"
pnpm add -Dw typescript tsx @types/node concurrently

echo "==> @tda/core"
pnpm --filter @tda/core add openai zod
pnpm --filter @tda/core add -D typescript

echo "==> @tda/tools"
pnpm --filter @tda/tools add @tda/core@workspace:* zod
pnpm --filter @tda/tools add -D typescript

echo "==> @tda/skills"
pnpm --filter @tda/skills add @tda/core@workspace:* zod
pnpm --filter @tda/skills add -D typescript

echo "==> @tda/a2a"
pnpm --filter @tda/a2a add express
pnpm --filter @tda/a2a add -D @types/express typescript

echo "==> @tda/mcp-server"
pnpm --filter @tda/mcp-server add @modelcontextprotocol/sdk zod
pnpm --filter @tda/mcp-server add -D typescript tsx

echo "==> @tda/cli"
pnpm --filter @tda/cli add @tda/core@workspace:* @tda/tools@workspace:* @tda/skills@workspace:* dotenv
pnpm --filter @tda/cli add -D typescript tsx

for app in reviewer investigator coordinator; do
  echo "==> @tda/$app"
  pnpm --filter "@tda/$app" add @tda/core@workspace:* @tda/tools@workspace:* @tda/a2a@workspace:* dotenv express
  pnpm --filter "@tda/$app" add -D typescript tsx @types/express
done

echo "✅ 依赖安装完成"
