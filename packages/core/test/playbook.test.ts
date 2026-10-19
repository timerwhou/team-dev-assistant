import { test } from "node:test";
import assert from "node:assert/strict";
import { extractFactsFromCode } from "../src/playbook/scanner";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { PlaybookEntry } from "../src/playbook/types";
import { BM25Retriever, AsyncHybridRetriever, VectorRetriever } from "../src/playbook/retriever";
import { MockEmbeddingProvider } from "../src/playbook/embedding/mock";

test("extractFactsFromCode 支持多语言", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "playbook-test-"));
  await fs.writeFile(path.join(tmpDir, "a.ts"), `// @fact [finance] 必须使用 CostService\n`);
  await fs.writeFile(path.join(tmpDir, "b.go"), `// @fact [auth] 必须使用 JWT\n`);
  await fs.writeFile(path.join(tmpDir, "c.py"), `# @fact [db] 禁止直接写 SQL\n`);

  const facts = await extractFactsFromCode(tmpDir);
  assert.equal(facts.length, 3);
  assert.equal(facts.find(f => f.domain === "finance")?.content, "必须使用 CostService");
  
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const sampleEntries: PlaybookEntry[] = [
  { id: "jwt", type: "fact", domain: "security", status: "active", title: "必须校验 JWT 签名", content: "安全基线", path: "jwt.md" },
  { id: "kafka", type: "stack", domain: "infra", status: "active", title: "消息推送选型", content: "统一使用 Kafka", alternatives: ["否决 Redis Pub/Sub，不支持持久化"], path: "kafka.md" },
  { id: "redis-alt", type: "fact", domain: "infra", status: "active", title: "为什么不用 Redis Pub/Sub", content: "高并发下会丢消息", path: "redis.md" }
];

test("BM25Retriever 支持关键词召回", () => {
  const retriever = new BM25Retriever();
  const result = retriever.retrieve("JWT 鉴权", sampleEntries);
  assert.ok(result.some(e => e.id === "jwt"));
});

test("VectorRetriever (Mock) 支持语义召回", async () => {
  const retriever = new VectorRetriever(new MockEmbeddingProvider());
  const result = await retriever.retrieveAsync("我要做登录", sampleEntries);
  assert.ok(result.some(e => e.id === "jwt"));
});

test("AsyncHybridRetriever 自动进行决策图谱 1-hop 扩展", async () => {
  // 显式注入基于 Mock 的 VectorRetriever，避免测试环境依赖真实 API Key
  const mockVectorRetriever = new VectorRetriever(new MockEmbeddingProvider());
  const hybrid = new AsyncHybridRetriever(60, 5, mockVectorRetriever);
  
  const result = await hybrid.retrieveAsync("消息队列选型", sampleEntries);
  // 命中 kafka，会自动扩展召回 redis-alt
  assert.ok(result.some(e => e.id === "kafka"));
  assert.ok(result.some(e => e.id === "redis-alt"));
});
