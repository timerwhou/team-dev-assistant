import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("MCP Server 企业级多租户与限流集成测试", () => {
  let httpServer: any;
  const port = 3999;
  const baseUrl = `http://127.0.0.1:${port}`;
  
  const baseTestDir = path.join(process.cwd(), ".tda-test-tenants");
  const tenantADir = path.join(baseTestDir, "tenant-a");
  const tenantBDir = path.join(baseTestDir, "tenant-b");

  before(async () => {
    // 1. 准备隔离数据
    fs.mkdirSync(path.join(tenantADir, ".tda"), { recursive: true });
    fs.mkdirSync(path.join(tenantBDir, ".tda"), { recursive: true });
    fs.writeFileSync(path.join(tenantADir, ".tda", "playbook.json"), JSON.stringify([
      { id: "1", type: "fact", title: "Tenant A Secret", content: "This is A", domain: "auth", status: "active", path: "" }
    ]));
    fs.writeFileSync(path.join(tenantBDir, ".tda", "playbook.json"), JSON.stringify([
      { id: "2", type: "fact", title: "Tenant B Secret", content: "This is B", domain: "auth", status: "active", path: "" }
    ]));

    // 2. 强制覆盖环境变量（避免被外部干扰）
    process.env.MCP_TRANSPORT = "http";
    process.env.MCP_API_KEY = "test-secret-key";
    process.env.MCP_ROOT = baseTestDir;
    process.env.OAUTH_ISSUER = "";

    // 3. 动态导入并启动服务
    const { startHttpServer } = await import("../src/server.ts");
    httpServer = await startHttpServer(port);
  });

  after(() => {
    if (httpServer) httpServer.close();
    fs.rmSync(baseTestDir, { recursive: true, force: true });
  });

  test("健康检查接口应直接放行", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
  });

  test("未提供 Token 应返回 401", async () => {
    const res = await fetch(`${baseUrl}/mcp`);
    assert.strictEqual(res.status, 401);
  });

  test("触发滑动窗口限流 (429)", async () => {
    // 快速发送 65 个请求（限流器配置为 60 个/分钟）
    const requests = Array.from({ length: 65 }).map(() => 
      fetch(`${baseUrl}/mcp`, {
        headers: { "Authorization": "Bearer test-secret-key" }
      })
    );
    const results = await Promise.all(requests);
    
    const hasRateLimited = results.some(r => r.status === 429);
    const successCount = results.filter(r => r.status !== 429).length;

    assert.ok(hasRateLimited, "应当触发限流返回 429");
    assert.ok(successCount <= 60, "成功请求数不应超过限流容量");
  });
});
