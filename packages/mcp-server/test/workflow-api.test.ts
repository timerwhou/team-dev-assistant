import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import { startHttpServer } from "../src/server";

describe("Workflow API 集成测试", () => {
  let server: any;
  const port = 4011;
  const baseUrl = `http://127.0.0.1:${port}`;

  before(async () => {
    process.env.MCP_TRANSPORT = "http";
    server = await startHttpServer(port);
  });

  after(() => {
    if (server) server.close();
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
