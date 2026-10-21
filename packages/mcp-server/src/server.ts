import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer, McpServerFactory } from "@modelcontextprotocol/server";
import { init } from "@telemetry-dev/sdk";
import { discoverSkills, registerSkillResources } from "@olaservo/ext-skills/server";
import { loadPlaybook, capabilityRegistry, WorkflowParser } from "@tda/core";
import type { WorkflowManifest } from "@tda/core";
import { createServer, IncomingMessage, ServerResponse, Server } from "node:http";
import path from "node:path";
import { handleProtectedResourceMetadata, requireScope, verifyToken } from "./auth";
import { SlidingWindowRateLimiter } from "./rate-limiter";
import { resolveTenantContext, TenantContext } from "./tenant";
import { registerCodeReviewPrompt } from "./prompts/code-review";
import { registerProjectFilesResource } from "./resources/project-files";
import { registerReadFile } from "./tools/read-file";

if (process.env.OTEL_ENABLED === "true") {
  init({ serviceName: "team-dev-assistant-mcp" });
}

const rateLimiter = new SlidingWindowRateLimiter(60, 60000);
rateLimiter.startCleanup();

function maskUrlForLog(url: string | undefined): string {
  if (!url) return "not-configured";
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "invalid-url";
  }
}

export function buildServer(ctx: TenantContext, manifest?: WorkflowManifest): McpServer {
  const server = new McpServer(
    { name: "team-dev-assistant", version: "1.3.0" },
    { capabilities: { resources: {} } },
  );

  const skillsRoot = path.resolve(ctx.rootDir, "packages/skills/skills");
  const skillMap = discoverSkills(skillsRoot);

  // 1. 注册原有的强依赖/资源类工具
  registerReadFile(server, ctx.rootDir);
  registerCodeReviewPrompt(server);
  registerProjectFilesResource(server, ctx.rootDir);
  
  registerSkillResources(server, skillMap, skillsRoot, {
    template: true,
    directoryRead: true,
    ttlMs: 60_000,
    cacheScope: "public",
  });

  // 2. 动态装配能力包（Capability Registry）
  const packs = capabilityRegistry.getCapabilities();
  for (const pack of packs) {
    server.registerTool(
      pack.metadata.name, // 🌟 使用向后兼容的 name 暴露给客户端
      {
        description: pack.metadata.description,
        inputSchema: pack.inputSchema.shape,
      },
      // 🌟 边界防腐层：通过强断言阻断 SDK 的复杂泛型推导，保证 CapabilityPack 的纯净性
      (async (args: any) => {
        const result = await pack.execute(args, {
          tenantId: ctx.tenantId,
          rootDir: ctx.rootDir,
          env: process.env,
        });
        return result;
      }) as any
    );
  }

  server.registerResource(
    "team-playbook",
    "project://playbook",
    {
      title: "Team Playbook",
      description: "团队业务事实与技术规约",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const entries = loadPlaybook(ctx.playbookDir); 
      const text =
        entries.length === 0
          ? "当前项目暂无 Playbook 规约。"
          : entries
              .map((e) => `### [${e.type.toUpperCase()}] ${e.title}\n${e.content}`)
              .join("\n\n---\n\n");
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
    },
  );
  
  return server;
}

export function startHttpServer(port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10)): Promise<Server> {
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  const expectedApiKey = process.env.MCP_API_KEY;
  const useOAuth = !!process.env.OAUTH_ISSUER;

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    if (handleProtectedResourceMetadata(req, res)) return;

    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin) && !origin.startsWith("http://localhost") && !origin.startsWith("http://127.0.0.1")) {
      res.writeHead(403);
      res.end("Forbidden Origin");
      return;
    }

    if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
      
      let tenantId = "default-tenant";

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

        tenantId = auth.tenantId!;
      } else if (expectedApiKey) {
        if (!token || token !== expectedApiKey) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized: Invalid or missing Bearer Token" }));
          return;
        }
      }

      if (!rateLimiter.consume(tenantId)) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Too Many Requests", message: "Rate limit exceeded." }));
        return;
      }

      const ctx = resolveTenantContext(tenantId);
      const serverFactory: McpServerFactory = () => buildServer(ctx);
      const handler = createMcpHandler(serverFactory);
      const nodeHandler = toNodeHandler(handler);

      await nodeHandler(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  return new Promise((resolve) => {
    httpServer.listen(port, "0.0.0.0", () => {
      console.error(`[mcp] Streamable HTTP server listening on http://0.0.0.0:${port}/mcp`);
      console.error(`[mcp] Security: ${useOAuth ? "OAuth 2.1 (JWT)" : expectedApiKey ? "Static API Key" : "DISABLED"}`);
      if (useOAuth) {
        console.error(`[mcp] OAuth Issuer (masked): ${maskUrlForLog(process.env.OAUTH_ISSUER)}`);
        console.error(`[mcp] Canonical URI (masked): ${maskUrlForLog(process.env.MCP_CANONICAL_URI)}`);
      }
      resolve(httpServer);
    });
  });
}
