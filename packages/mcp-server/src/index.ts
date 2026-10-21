#!/usr/bin/env node
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import {
  discoverSkills,
  registerSkillResources,
} from "@olaservo/ext-skills/server";
import { getMonorepoRoot, loadPlaybook } from "@tda/core";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { handleProtectedResourceMetadata, requireScope, verifyToken } from "./auth";
import { registerCodeReviewPrompt } from "./prompts/code-review";
import { registerProjectFilesResource } from "./resources/project-files";
import { registerListIssues } from "./tools/list-issues";
import { registerReadFile } from "./tools/read-file";
import { registerSearchCode } from "./tools/search-code";

const rootDir = process.env.MCP_ROOT || getMonorepoRoot();
const skillsRoot = path.resolve(rootDir, "packages/skills/skills");
const skillMap = discoverSkills(skillsRoot);

// 安全规范：日志脱敏函数，仅保留协议与主机名，防止 CodeQL 高危告警
function maskUrlForLog(url: string | undefined): string {
  if (!url) return "not-configured";
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "invalid-url";
  }
}

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "team-dev-assistant", version: "1.3.0" },
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
      description: "团队业务事实与技术规约",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const entries = loadPlaybook();
      const text =
        entries.length === 0
          ? "当前项目暂无 Playbook 规约。"
          : entries
              .map(
                (e) => `### [${e.type.toUpperCase()}] ${e.title}\n${e.content}`,
              )
              .join("\n\n---\n\n");
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
    },
  );
  return server;
}

const transportMode = process.env.MCP_TRANSPORT || "stdio";

if (transportMode === "http") {
  const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10);
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  const expectedApiKey = process.env.MCP_API_KEY;
  const useOAuth = !!process.env.OAUTH_ISSUER;

  const handler = createMcpHandler(buildServer);
  const nodeHandler = toNodeHandler(handler);

  const httpServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
        return;
      }

      // RFC 9728: 暴露受保护资源元数据
      if (handleProtectedResourceMetadata(req, res)) return;

      const origin = req.headers.origin;
      if (
        origin &&
        !allowedOrigins.includes(origin) &&
        !origin.startsWith("http://localhost") &&
        !origin.startsWith("http://127.0.0.1")
      ) {
        res.writeHead(403);
        res.end("Forbidden Origin");
        return;
      }

      if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : undefined;

        // --- OAuth 2.1 资源服务器鉴权（生产模式）---
        if (useOAuth) {
          if (!token) {
            res.writeHead(401, {
              "Content-Type": "application/json",
              "WWW-Authenticate": `Bearer resource_metadata="${process.env.MCP_CANONICAL_URI}/.well-known/oauth-protected-resource"`,
            });
            res.end(JSON.stringify({ error: "missing_token" }));
            return;
          }

          const auth = await verifyToken(token);
          if (!auth.ok) {
            res.writeHead(auth.status || 401, {
              "Content-Type": "application/json",
              "WWW-Authenticate": `Bearer error="${auth.error}"`,
            });
            res.end(JSON.stringify({ error: auth.error }));
            return;
          }

          if (!requireScope(auth.scopes, "playbook:read")) {
            res.writeHead(403, {
              "Content-Type": "application/json",
              "WWW-Authenticate": `Bearer error="insufficient_scope", scope="playbook:read"`,
            });
            res.end(JSON.stringify({ error: "insufficient_scope" }));
            return;
          }
        } else if (expectedApiKey) {
          // --- 降级：静态 API Key（仅本地开发/过渡期）---
          if (!token || token !== expectedApiKey) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized: Invalid or missing Bearer Token" }));
            return;
          }
        }

        await nodeHandler(req, res);
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    },
  );

  httpServer.listen(port, "0.0.0.0", () => {
    console.error(
      `[mcp] Streamable HTTP server listening on http://0.0.0.0:${port}/mcp`,
    );
    console.error(
      `[mcp] Security: ${useOAuth ? "OAuth 2.1 (JWT)" : expectedApiKey ? "Static API Key" : "DISABLED"}`,
    );
    if (useOAuth) {
      // 采用脱敏输出，兼顾安全与可运维性
      console.error(`[mcp] OAuth Issuer (masked): ${maskUrlForLog(process.env.OAUTH_ISSUER)}`);
      console.error(`[mcp] Canonical URI (masked): ${maskUrlForLog(process.env.MCP_CANONICAL_URI)}`);
    }
  });

  process.on("SIGINT", () => {
    httpServer.close();
    process.exit(0);
  });
} else {
  const handle = serveStdio(buildServer);
  process.on("SIGINT", () => {
    void handle.close();
  });
  console.error(`[mcp] stdio mode running, root=${rootDir}`);
}
