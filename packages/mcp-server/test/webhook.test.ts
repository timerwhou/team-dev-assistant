import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { startHttpServer } from "../src/server";
import { WorkflowStore } from "../src/workflow-store";
import { resolveTenantContext } from "../src/tenant";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("Webhook 触发与 HMAC 验签测试", () => {
  let server: any;
  const port = 4012;
  const baseUrl = `http://127.0.0.1:${port}`;
  const secret = "my-super-secret";
  const token = "test-webhook-token";

  before(async () => {
    process.env.MCP_TRANSPORT = "http";
    // 测试隔离: 数据写入临时目录（MCP_ROOT 接线，对齐 multi-tenant.test.ts 参考实现）
    // 必须在 resolveTenantContext/createAsset 之前设置
    process.env.MCP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "tda-test-"));
    
    // 1. 预先创建带 trigger 的工作流资产
    const ctx = resolveTenantContext("default-tenant");
    const store = new WorkflowStore(ctx.rootDir);
    store.createAsset({
      name: "webhook-test-workflow",
      description: "for webhook testing",
      stages: ["context-gathering"],
      stageCapabilities: { "context-gathering": ["tool"] },
      triggers: [{ type: "webhook", token, secret }],
    });

    server = await startHttpServer(port);
  });

  after(() => {
    if (server) server.close();
    // 测试隔离: 清理临时数据目录（防泄漏）
    const tmpRoot = process.env.MCP_ROOT;
    if (tmpRoot && tmpRoot.includes("tda-test-")) fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  test("缺少签名时应返回 401", async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/${token}`, {
      method: "POST",
      body: JSON.stringify({ payload: "test" }),
    });
    assert.strictEqual(res.status, 401);
  });

  test("签名错误时应返回 401", async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/${token}`, {
      method: "POST",
      headers: { "X-TDA-Signature-256": "sha256=wronghash" },
      body: JSON.stringify({ payload: "test" }),
    });
    assert.strictEqual(res.status, 401);
  });

  test("签名正确时应触发执行并返回 200", async () => {
    const payload = JSON.stringify({ event: "push" });
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    
    const res = await fetch(`${baseUrl}/api/webhooks/${token}`, {
      method: "POST",
      headers: { "X-TDA-Signature-256": `sha256=${expectedSig}` },
      body: payload,
    });
    
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });
});
