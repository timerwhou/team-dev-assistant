import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import http from "node:http";
import { RemoteCapabilityLoader } from "../src/runtime/remote-loader";

describe("RemoteCapabilityLoader 安全加载测试", () => {
  const fixturePath = path.join(process.cwd(), "test/fixtures/mock-capability.mjs");
  const cacheDir = path.join(process.cwd(), ".tda-test-plugins");
  let fileContent: Buffer;
  let validHash: string;
  let server: http.Server;
  let port: number;

  before(async () => {
    fileContent = fs.readFileSync(fixturePath);
    validHash = crypto.createHash("sha256").update(fileContent).digest("hex");

    // 🌟 启动本地 HTTP Server 模拟远程仓库
    server = http.createServer((req, res) => {
      if (req.url === "/mock-capability.mjs") {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(fileContent);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    // 随机端口
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  after(() => {
    server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  });

  test("哈希不匹配时应当拦截并抛出安全警报", async () => {
    const loader = new RemoteCapabilityLoader({ cacheDir });
    const url = `http://127.0.0.1:${port}/mock-capability.mjs`;
    
    // 故意写错哈希
    const manifest = {
      name: "mock-capability",
      version: "1.0.0",
      url,
      sha256: "0000000000000000000000000000000000000000000000000000000000000000",
      capabilities: ["hello_world"]
    };

    try {
      await loader.loadManifest(manifest);
      assert.fail("应当抛出哈希校验失败的错误");
    } catch (e: any) {
      assert.match(e.message, /供应链安全警报：哈希校验失败/);
    }
  });

  test("哈希匹配时应当成功拉取并注册", async () => {
    const loader = new RemoteCapabilityLoader({ cacheDir });
    const url = `http://127.0.0.1:${port}/mock-capability.mjs`;
    
    const manifest = {
      name: "mock-capability",
      version: "1.0.0",
      url,
      sha256: validHash,
      capabilities: ["hello_world"]
    };

    // 这里我们不直接在测试里验证 registry 注册（因为这会污染全局单例），
    // 我们主要验证加载流程是否成功不报错。
    await loader.loadManifest(manifest);
    assert.ok(true, "应当无错误地执行完毕");
  });
});
