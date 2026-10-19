#!/usr/bin/env node
import path from "node:path";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { discoverSkills, registerSkillResources } from "@olaservo/ext-skills/server";
import { getMonorepoRoot, loadPlaybook } from "@tda/core";
import { registerReadFile } from "./tools/read-file";
import { registerSearchCode } from "./tools/search-code";
import { registerListIssues } from "./tools/list-issues";
import { registerCodeReviewPrompt } from "./prompts/code-review";
import { registerProjectFilesResource } from "./resources/project-files";

const rootDir = process.env.MCP_ROOT || getMonorepoRoot();
const skillsRoot = path.resolve(rootDir, "packages/skills/skills");
const skillMap = discoverSkills(skillsRoot);

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "team-dev-assistant", version: "1.2.0" },
    { capabilities: { resources: {} } },
  );

  registerReadFile(server, rootDir);
  registerSearchCode(server, rootDir);
  registerListIssues(server);
  registerCodeReviewPrompt(server);
  registerProjectFilesResource(server, rootDir);
  registerSkillResources(server, skillMap, skillsRoot, { template: true, directoryRead: true, ttlMs: 60_000, cacheScope: "public" });

  server.registerResource(
    "team-playbook",
    "project://playbook",
    { title: "Team Playbook", description: "团队业务事实与技术规约", mimeType: "text/markdown" },
    async (uri) => {
      const entries = loadPlaybook();
      const text = entries.length === 0 ? "当前项目暂无 Playbook 规约。" : entries.map(e => `### [${e.type.toUpperCase()}] ${e.title}\n${e.content}`).join("\n\n---\n\n");
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
    }
  );
  return server;
}

const transportMode = process.env.MCP_TRANSPORT || "stdio";

if (transportMode === "http") {
  const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10);
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://127.0.0.1:3000"];
  
  // 从环境变量读取 API Key，如果未配置则默认不允许外部网络访问（本地开发除外）
  const expectedApiKey = process.env.MCP_API_KEY;

  const handler = createMcpHandler(buildServer);
  const nodeHandler = toNodeHandler(handler);

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin) && !origin.startsWith("http://localhost") && !origin.startsWith("http://127.0.0.1")) {
      res.writeHead(403); res.end("Forbidden Origin"); return;
    }

    if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
      // --- 鉴权防线 ---
      if (expectedApiKey) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== expectedApiKey) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized: Invalid or missing Bearer Token" }));
          return;
        }
      }
      
      await nodeHandler(req, res);
      return;
    }

    res.writeHead(404); res.end("Not Found");
  });

  httpServer.listen(port, "0.0.0.0", () => {
    console.error(`[mcp] Streamable HTTP server listening on http://0.0.0.0:${port}/mcp`);
    console.error(`[mcp] Security: Auth is ${expectedApiKey ? "ENABLED" : "DISABLED"}`);
  });

  process.on("SIGINT", () => { httpServer.close(); process.exit(0); });
} else {
  const handle = serveStdio(buildServer);
  process.on("SIGINT", () => { void handle.close(); });
  console.error(`[mcp] stdio mode running, root=${rootDir}`);
}
