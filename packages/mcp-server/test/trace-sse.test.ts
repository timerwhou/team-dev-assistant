import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import http from "node:http";
import { startHttpServer } from "../src/server";
import { traceBus } from "@tda/core";

describe("Trace SSE 端点集成测试", () => {
  let server: any;
  const port = 4010;

  before(async () => {
    process.env.MCP_TRANSPORT = "http";
    process.env.MCP_API_KEY = "test-secret";
    server = await startHttpServer(port);
  });

  after(() => {
    if (server) server.close();
  });

  test("客户端应能通过 SSE 接收到 Trace", async () => {
    const workflowId = "test-workflow-sse";
    
    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${port}/trace/${workflowId}`, (res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers["content-type"], "text/event-stream");

        let receivedData = "";

        res.on("data", (chunk) => {
          receivedData += chunk.toString();
          if (receivedData.includes("测试结束")) {
            req.destroy();
            try {
              assert.match(receivedData, /"action":"retrieve"/);
              assert.match(receivedData, /"action":"complete"/);
              assert.match(receivedData, /"detail":"测试结束"/);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });

        res.on("error", reject);

        // 🌟 使用 nextTick 或 setImmediate 确保不阻塞 Event Loop，并在连接建立后立刻广播
        setTimeout(() => {
          traceBus.publish(workflowId, { iteration: 1, action: "retrieve", detail: "测试开始", timestamp: Date.now() });
          traceBus.publish(workflowId, { iteration: 1, action: "complete", detail: "测试结束", timestamp: Date.now() });
        }, 50);
      });

      req.on("error", reject);
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("测试超时：未在规定时间内收到 SSE 数据。"));
      });
    });
  });
});
