#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const rootDir = process.env.MCP_ROOT || process.cwd();
const server = new McpServer({ name: "team-dev-assistant", version: "0.1.0" });

server.registerTool(
  "read_file",
  {
    description: "读取项目内的文本文件。",
    inputSchema: z.object({
      path: z.string(),
      maxLines: z.number().int().positive().optional(),
    }),
  },
  async ({ path: p, maxLines = 200 }) => {
    const fs = await import("node:fs/promises");
    const pathMod = await import("node:path");
    const abs = pathMod.resolve(rootDir, p);
    if (!abs.startsWith(rootDir)) {
      return { content: [{ type: "text", text: "越权" }], isError: true };
    }
    const content = await fs.readFile(abs, "utf-8");
    return {
      content: [{ type: "text", text: content.split("\n").slice(0, maxLines).join("\n") }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[mcp] running, root=${rootDir}`);
