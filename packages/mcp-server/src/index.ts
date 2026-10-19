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

// 将 Server 的构建逻辑提取为工厂函数，确保 HTTP 模式下每次请求都是无状态的独立实例
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

  registerSkillResources(server, skillMap, skillsRoot, {
    template: true,
    directoryRead: true,
    ttlMs: 60_000,
    cacheScope: "public",
  });

  server.registerResource(
    "team-playbook",
    "project://playbook",
    {
      title: "Team Playbook",
      description: "团队业务事实与技术规约，包含 Fact 和 Stack",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const entries = loadPlaybook();
      if (entries.length === 0) {
        return {
          contents: [{ uri: uri.href, mimeType: "text/markdown", text: "当前项目暂无 Playbook 规约。" }],
        };
      }
      const text = entries.map(e => `### [${e.type.toUpperCase()}] ${e.title}\n${e.content}`).join("\n\n---\n\n");
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text }],
      };
    }
  );

  return server;
}

// --- 双轨制启动逻辑 ---
const transportMode = process.env.MCP_TRANSPORT || "stdio";

if (transportMode === "http") {
  const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10);
  
  // 本地开发默认允许的 Origin
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://127.0.0.1:3000"];

  const handler = createMcpHandler(buildServer);
  const nodeHandler = toNodeHandler(handler);

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // 1. 健康检查端点
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    // 2. 安全防护：Origin 校验（防跨站请求/DNS重绑定）
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin) && !origin.startsWith("http://localhost") && !origin.startsWith("http://127.0.0.1")) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden Origin");
      return;
    }

    // 3. 路由 MCP 请求
    if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
      // 预留：此处可以插入 Bearer Token 认证中间件
      await nodeHandler(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  httpServer.listen(port, "0.0.0.0", () => {
    console.error(`[mcp] Streamable HTTP server listening on http://0.0.0.0:${port}/mcp`);
    console.error(`[mcp] Transport: Streamable HTTP (Stateless)`);
  });

  process.on("SIGINT", () => {
    httpServer.close();
    process.exit(0);
  });

} else {
  // --- 默认的 stdio 模式 ---
  const handle = serveStdio(buildServer);
  process.on("SIGINT", () => {
    void handle.close();
  });
  console.error(`[mcp] stdio mode running, root=${rootDir}, skills=${skillMap.size}`);
}
