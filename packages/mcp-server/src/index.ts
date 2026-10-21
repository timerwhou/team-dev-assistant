#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { startHttpServer, buildServer } from "./server";
import { resolveTenantContext } from "./tenant";

const transportMode = process.env.MCP_TRANSPORT || "stdio";

async function main() {
  if (transportMode === "http") {
    const httpServer = await startHttpServer();
    process.on("SIGINT", () => {
      httpServer.close();
      process.exit(0);
    });
  } else {
    const defaultCtx = resolveTenantContext("default-tenant");
    const handle = serveStdio(() => buildServer(defaultCtx));
    process.on("SIGINT", () => {
      void handle.close();
    });
    console.error(`[mcp] stdio mode running, root=${defaultCtx.rootDir}`);
  }
}

main().catch((err) => {
  console.error("[mcp] Fatal error:", err);
  process.exit(1);
});
