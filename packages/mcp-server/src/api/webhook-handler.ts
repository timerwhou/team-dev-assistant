import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { WorkflowStore } from "../workflow-store";
import { MemoryStore, traceBus } from "@tda/core";
import { resolveTenantContext } from "../tenant";

/**
 * 🛡️ 验证 HMAC-SHA256 签名
 * 对齐 GitHub Webhook 标准
 */
function verifySignature(payload: string, secret: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const actualSignature = parts[1];

  // 防止时序攻击
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const actualBuffer = Buffer.from(actualSignature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!req.url?.startsWith("/api/webhooks/") || req.method !== "POST") {
    return false;
  }

  const token = req.url.split("/api/webhooks/")[1];
  if (!token) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing token" }));
    return true;
  }

  // 1. 收集原始请求体
  let rawBody = "";
  for await (const chunk of req) {
    rawBody += chunk.toString();
  }

  // 2. 查找配置了该 token 的工作流
  const tenantCtx = resolveTenantContext("default-tenant");
  const store = new WorkflowStore(tenantCtx.rootDir);
  const assets = store.listAssets();
  
  const targetAsset = assets.find(a => 
    a.manifest.triggers?.some(t => t.type === "webhook" && t.token === token)
  );

  if (!targetAsset) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Workflow not found for this token" }));
    return true;
  }

  // 3. 获取触发器配置，进行验签
  const trigger = targetAsset.manifest.triggers!.find(t => t.token === token)!;
  if (trigger.secret) {
    const signature = req.headers["x-tda-signature-256"] as string | undefined;
    if (!verifySignature(rawBody, trigger.secret, signature)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid signature" }));
      return true;
    }
  }

  // 4. 验签通过，触发执行
  const workflowId = `wh-${Date.now()}`;
  const memoryStore = new MemoryStore();
  
  // 模拟后台执行，推送 Trace
  setTimeout(() => {
    const evt = { iteration: 1, action: "retrieve" as const, detail: "webhook-trigger", timestamp: Date.now() };
    traceBus.publish(workflowId, evt);
  }, 500);

  setTimeout(() => {
    const evt = { iteration: 1, action: "complete" as const, detail: "webhook-complete", timestamp: Date.now() };
    traceBus.publish(workflowId, evt);
    memoryStore.recordTrace(workflowId, `Webhook: ${targetAsset.name}`, [evt], 1, "completed");
  }, 2000);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true, workflowId, message: "Webhook triggered" }));
  return true;
}
