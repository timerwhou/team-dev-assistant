import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import { startHttpServer } from "../src/server";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("Workflow API 集成测试", () => {
  let server: any;
  const port = 4011;
  const baseUrl = `http://127.0.0.1:${port}`;

  before(async () => {
    process.env.MCP_TRANSPORT = "http";
    // 测试隔离: 数据写入临时目录（MCP_ROOT 接线，对齐 multi-tenant.test.ts 参考实现）
    process.env.MCP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "tda-test-"));
    server = await startHttpServer(port);
  });

  after(() => {
    if (server) server.close();
    // 测试隔离: 清理临时数据目录（防泄漏）
    const tmpRoot = process.env.MCP_ROOT;
    if (tmpRoot && tmpRoot.includes("tda-test-")) fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  test("非法 JSON 载荷应返回 400", async () => {
    const res = await fetch(`${baseUrl}/api/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bad: "data" }),
    });
    assert.strictEqual(res.status, 400);
  });

  test("合法 Workflow 应保存并可通过 GET 获取", async () => {
    const validManifest = {
      name: "test-workflow-api",
      description: "Test API",
      stages: ["context-gathering", "execution"],
      stageCapabilities: { "context-gathering": ["tool"], "execution": ["tool"] }
    };

    const postRes = await fetch(`${baseUrl}/api/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validManifest),
    });
    assert.strictEqual(postRes.status, 201);
    
    const getRes = await fetch(`${baseUrl}/api/assets`);
    assert.strictEqual(getRes.status, 200);
    const list = await getRes.json();
    assert.ok(list.some((w: any) => w.name === "test-workflow-api"));
  });
});
