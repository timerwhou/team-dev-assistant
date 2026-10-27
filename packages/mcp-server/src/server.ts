import { A2AClient } from "@tda/a2a";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer, McpServerFactory } from "@modelcontextprotocol/server";
import { init } from "@telemetry-dev/sdk";
import { discoverSkills, registerSkillResources } from "@olaservo/ext-skills/server";
import { loadPlaybook, capabilityRegistry, WorkflowParser, traceBus, WorkflowManifestSchema } from "@tda/core";
import type { WorkflowManifest } from "@tda/core";
import { createServer, IncomingMessage, ServerResponse, Server } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { handleProtectedResourceMetadata, requireScope, verifyToken } from "./auth";
import { SlidingWindowRateLimiter } from "./rate-limiter";
import { resolveTenantContext, TenantContext } from "./tenant";
import { registerCodeReviewPrompt } from "./prompts/code-review";
import { registerProjectFilesResource } from "./resources/project-files";
import { registerReadFile } from "./tools/read-file";
import { WorkflowStore } from "./workflow-store";
import { handleWebhook } from "./api/webhook-handler";
import { MemoryStore, a2aBus } from "@tda/core";


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

  registerReadFile(server, ctx.rootDir);
  registerCodeReviewPrompt(server);
  registerProjectFilesResource(server, ctx.rootDir);
  
  registerSkillResources(server, skillMap, skillsRoot, {
    template: true,
    directoryRead: true,
    ttlMs: 60_000,
    cacheScope: "public",
  });

  const packs = manifest 
    ? WorkflowParser.resolveCapabilities(manifest, manifest.stages[0])
    : capabilityRegistry.getCapabilities();

  for (const pack of packs) {
    server.registerTool(
      pack.metadata.name,
      {
        description: pack.metadata.description,
        inputSchema: pack.inputSchema.shape,
      },
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
  // 🌟 从环境变量读取白名单，默认仅在开发环境允许本地 Studio
  const defaultDevOrigins = process.env.NODE_ENV === "production" ? [] : [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(",") || defaultDevOrigins;

  const expectedApiKey = process.env.MCP_API_KEY;
  const useOAuth = !!process.env.OAUTH_ISSUER;

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // 🌟 Webhook 拦截（必须在所有业务路由之前）
    if (await handleWebhook(req, res)) return;

    // 🌟 A2A 协同 SSE 流
    if (req.url?.startsWith("/api/a2a/stream/") && req.method === "GET") {
      const workflowId = req.url.split("/api/a2a/stream/")[1];
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      res.flushHeaders();

      const handler = (event: any) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };
      
      a2aBus.on(`a2a:${workflowId}`, handler);

      req.on("close", () => {
        a2aBus.off(`a2a:${workflowId}`, handler);
      });
      return;
    }
    // 🌟 全局 CORS 头部处理
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    // 🌟 处理 OPTIONS 预检请求
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // 🌟 Webhook 拦截（必须在所有业务路由之前）
    if (await handleWebhook(req, res)) return;

    // 🌟 托管 Studio 静态资源
    if (req.url?.startsWith("/studio")) {
      // 将 /studio 映射到静态文件目录
      const studioDist = path.resolve(process.cwd(), "apps/studio/build");
      
      // 如果是 API 请求则放行
      if (req.url.startsWith("/studio/api")) {
         // 为了安全，不推荐在 /studio 下做 API，但兜底
      } else {
        let filePath = req.url.replace("/studio", "");
        if (filePath === "/" || filePath === "") filePath = "/index.html";
        
        // 🛡️ 安全修复：使用 path.resolve 规范化路径，防止 ../ 穿越攻击
        const safePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
        const absolutePath = path.resolve(studioDist, "." + safePath);
        const rootDir = path.resolve(studioDist);

        // 校验绝对路径是否越出根目录
        if (!absolutePath.startsWith(rootDir + path.sep) && absolutePath !== rootDir) {
          res.writeHead(403);
          res.end("Forbidden: Path traversal detected");
          return;
        }
        
        // 如果文件存在，直接返回；否则回退到 index.html（支持前端 SPA 路由）
        if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
          const ext = path.extname(absolutePath);
          const mimeTypes: Record<string, string> = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".json": "application/json",
          };
          res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
          fs.createReadStream(absolutePath).pipe(res);
          return;
        } else {
          // SPA 路由回退
          const indexPath = path.join(studioDist, "index.html");
          if (fs.existsSync(indexPath)) {
            res.writeHead(200, { "Content-Type": "text/html" });
            fs.createReadStream(indexPath).pipe(res);
            return;
          }
        }
      }
    }

    // 🌟 A2A HITL 审批接口
    if (req.url === "/api/a2a/approve" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const { agentUrl, taskId, requestState, confirm } = JSON.parse(body);
          const client = new A2AClient(agentUrl);
          await client.resumeTask(requestState, { confirm });
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ success: true }));
        } catch (e: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }

    if (handleProtectedResourceMetadata(req, res)) return;

    // 🌟 触发工作流执行 (Mock 演示)
    if (req.url?.startsWith("/api/workflows/execute") && req.method === "POST") {
      const workflowId = "wf-" + Date.now();
      
      // 返回触发成功
      res.writeHead(200, { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      });
      res.end(JSON.stringify({ workflowId, message: "工作流已开始执行" }));

      // 🌟 修复：显式声明为 AgenticTraceEvent 数组，防止 TypeScript 推断为 string
      const mockTrace: import("@tda/core").AgenticTraceEvent[] = [];
      
      setTimeout(() => {
        const evt = { iteration: 1, action: "retrieve" as const, detail: "context-gathering", timestamp: Date.now() };
        mockTrace.push(evt);
        traceBus.publish(workflowId, evt);
      }, 1000);

      setTimeout(() => {
        const evt = { iteration: 1, action: "execute" as const, detail: "execution", timestamp: Date.now() };
        mockTrace.push(evt);
        traceBus.publish(workflowId, evt);
      }, 2500);
      
      setTimeout(() => {
        const evt = { iteration: 1, action: "complete" as const, detail: "review", timestamp: Date.now() };
        mockTrace.push(evt);
        traceBus.publish(workflowId, evt);
        
        // 🌟 将完整 Trace 落盘
        const store = new MemoryStore();
        store.recordTrace(workflowId, "Studio Mock Execution", mockTrace, 1, "completed");
      }, 4000);

      return;
    }

    // 🌟 获取最近执行历史
    if (req.url === "/api/traces" && req.method === "GET") {
      const store = new MemoryStore();
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify(store.listRecentExecutions()));
      return;
    }

    // 🌟 获取单次执行详情
    if (req.url?.startsWith("/api/traces/") && req.method === "GET") {
      const workflowId = req.url.split("/api/traces/")[1];
      const store = new MemoryStore();
      const record = store.getTrace(workflowId);
      if (record) {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(record));
      } else {
        res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ error: "Trace not found" }));
      }
      return;
    }

    // 🌟 获取可用能力列表
    if (req.url === "/api/capabilities" && req.method === "GET") {
      // 从注册中心获取所有能力包
      const packs = capabilityRegistry.getCapabilities();
      const list = packs.map(pack => ({
        id: pack.metadata.id,
        name: pack.metadata.name,
        kind: pack.metadata.kind,
        description: pack.metadata.description,
        stage: pack.metadata.stage,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(list));
      return;
    }

    // 🌟 工作流资产 CRUD
    if (req.url?.startsWith("/api/assets")) {
      const tenantCtx = resolveTenantContext("default-tenant");
      const store = new WorkflowStore(tenantCtx.rootDir);

      // 列出所有资产
      if (req.url === "/api/assets" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(store.listAssets()));
        return;
      }

      // 创建新资产
      if (req.url === "/api/assets" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            if (!body.trim()) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Empty payload" }));
              return;
            }
            const rawData = JSON.parse(body);
            const parseResult = WorkflowManifestSchema.safeParse(rawData);
            if (!parseResult.success) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: parseResult.error.issues.map((e: any) => e.message).join(", ") }));
              return;
            }
            const asset = store.createAsset(parseResult.data);
            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify(asset));
          } catch (e: any) {
            console.error("❌ 后端真实 JSON 解析报错:", e.message);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON: " + e.message }));
          }
        });
        return;
      }

      // 获取单个资产详情
      if (req.url.startsWith("/api/assets/") && req.method === "GET") {
        const id = req.url.split("/api/assets/")[1];
        const asset = store.getAsset(id);
        if (asset) {
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(asset));
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
        }
        return;
      }

      // 更新资产
      if (req.url.startsWith("/api/assets/") && req.method === "PUT") {
        const id = req.url.split("/api/assets/")[1];
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            const rawData = JSON.parse(body);
            const parseResult = WorkflowManifestSchema.safeParse(rawData.manifest);
            if (!parseResult.success) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: parseResult.error.issues.map((e: any) => e.message).join(", ") }));
              return;
            }
            const result = store.updateAsset(id, parseResult.data, rawData.version);
            if (result.success) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result.asset));
            } else {
              res.writeHead(409, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: result.error }));
            }
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        });
        return;
      }

      // 删除资产
      if (req.url.startsWith("/api/assets/") && req.method === "DELETE") {
        const id = req.url.split("/api/assets/")[1];
        const success = store.deleteAsset(id);
        if (success) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
        }
        return;
      }
    }

    // 🌟 触发工作流执行 (Mock 演示)
    if (req.url?.startsWith("/api/workflows/execute") && req.method === "POST") {
      const workflowId = "wf-" + Date.now();
      
      res.writeHead(200, { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      });
      res.end(JSON.stringify({ workflowId, message: "工作流已开始执行" }));

      const mockTrace: import("@tda/core").AgenticTraceEvent[] = [];
      
      setTimeout(() => {
        const evt = { iteration: 1, action: "retrieve" as const, detail: "context-gathering", timestamp: Date.now() };
        mockTrace.push(evt);
        traceBus.publish(workflowId, evt);
      }, 1000);

      setTimeout(() => {
        const evt = { iteration: 1, action: "execute" as const, detail: "execution", timestamp: Date.now() };
        mockTrace.push(evt);
        traceBus.publish(workflowId, evt);
      }, 2500);
      
      setTimeout(() => {
        const evt = { iteration: 1, action: "complete" as const, detail: "review", timestamp: Date.now() };
        mockTrace.push(evt);
        traceBus.publish(workflowId, evt);
        
        const store = new MemoryStore();
        store.recordTrace(workflowId, "Studio Mock Execution", mockTrace, 1, "completed");
      }, 4000);

      return;
    }

    // 🌟 获取最近执行历史
    if (req.url === "/api/traces" && req.method === "GET") {
      const store = new MemoryStore();
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify(store.listRecentExecutions()));
      return;
    }

    // 🌟 获取单次执行详情
    if (req.url?.startsWith("/api/traces/") && req.method === "GET") {
      const workflowId = req.url.split("/api/traces/")[1];
      const store = new MemoryStore();
      const record = store.getTrace(workflowId);
      if (record) {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(record));
      } else {
        res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ error: "Trace not found" }));
      }
      return;
    }

    // 🌟 获取可用能力列表
    if (req.url === "/api/capabilities" && req.method === "GET") {
      // 从注册中心获取所有能力包
      const packs = capabilityRegistry.getCapabilities();
      const list = packs.map(pack => ({
        id: pack.metadata.id,
        name: pack.metadata.name,
        kind: pack.metadata.kind,
        description: pack.metadata.description,
        stage: pack.metadata.stage,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(list));
      return;
    }

    

    if (req.url?.startsWith("/trace/")) {
      const rawId = req.url.split("/trace/")[1];
      
      if (!rawId || !/^[a-zA-Z0-9-]+$/.test(rawId)) {
        console.error("[mcp] 安全警报：检测到非法的 workflowId 格式，已被拒绝。");
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid workflowId format" }));
        return;
      }

      const workflowId = rawId;
      console.error("[mcp] 建立 SSE 连接"); 
      
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*", // 🌟 必须允许跨域，否则前端接收不到
      });
      res.flushHeaders();

      const handler = (event: any) => {
        console.error("[mcp] SSE 发送事件");
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };
      
      traceBus.on(`trace:${workflowId}`, handler);
      
      req.on("close", () => {
        console.error("[mcp] 断开 SSE 连接");
        traceBus.off(`trace:${workflowId}`, handler);
      });
      
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
