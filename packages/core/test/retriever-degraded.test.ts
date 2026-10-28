import { test } from "node:test";
import assert from "node:assert/strict";
import { VectorRetriever, AsyncHybridRetriever } from "../src/playbook/retriever";
import { MockEmbeddingProvider } from "../src/playbook/embedding/mock";
import type { EmbeddingProvider } from "../src/playbook/embedding/types";
import type { PlaybookEntry } from "../src/playbook/types";
import { recorder } from "../src/trace/recorder";
import type { TraceEvent, RetrieverDegradedTrace } from "../src/trace/types";

const sampleEntries: PlaybookEntry[] = [
  { id: "jwt", type: "fact", domain: "security", status: "active", title: "必须校验 JWT 签名", content: "安全基线", path: "jwt.md" },
  { id: "kafka", type: "stack", domain: "infra", status: "active", title: "消息推送选型", content: "统一使用 Kafka", alternatives: ["否决 Redis Pub/Sub，不支持持久化"], path: "kafka.md" },
  { id: "redis-alt", type: "fact", domain: "infra", status: "active", title: "为什么不用 Redis Pub/Sub", content: "高并发下会丢消息", path: "redis.md" }
];

test("向量检索失败时发射 retriever_degraded 结构化事件", async () => {
  const events: TraceEvent[] = [];
  recorder.register({
    name: "test-retriever-degraded",
    report: (e: TraceEvent) => { events.push(e); },
  });

  const failing: EmbeddingProvider = {
    embed: async () => {
      throw new Error("ECONNREFUSED");
    },
  };

  const retriever = new VectorRetriever(failing);
  const result = await retriever.retrieveAsync("我要做登录", sampleEntries);

  // 降级行为：本层返回空结果
  assert.deepEqual(result, []);

  // 降级 Trace：结构化字段齐全、可聚合
  assert.equal(events.length, 1);
  const e = events[0] as RetrieverDegradedTrace;
  assert.equal(e.kind, "retriever_degraded");
  assert.equal(e.retriever, "vector");
  assert.equal(e.operation, "embed");
  assert.equal(e.errorName, "Error");
  assert.equal(e.errorMessage, "ECONNREFUSED");
  assert.equal(e.fallback, "empty_result");
  assert.ok(e.id);
  assert.ok(e.timestamp);

  // 不再复用 context_build 伪造降级
  assert.ok(!events.some((ev) => ev.kind === "context_build"));
});

test("语义检索成功时不发射降级事件", async () => {
  const events: TraceEvent[] = [];
  recorder.register({
    name: "test-retriever-healthy",
    report: (e: TraceEvent) => { events.push(e); },
  });

  const retriever = new VectorRetriever(new MockEmbeddingProvider());
  const result = await retriever.retrieveAsync("我要做登录", sampleEntries);

  assert.ok(result.length > 0);
  assert.equal(events.length, 0);
});

test("混合检索在向量通道降级时由 BM25 兜底并发射降级事件", async () => {
  const events: TraceEvent[] = [];
  recorder.register({
    name: "test-retriever-hybrid-degraded",
    report: (e: TraceEvent) => { events.push(e); },
  });

  const failing: EmbeddingProvider = {
    embed: async () => {
      throw new Error("model overloaded");
    },
  };
  const hybrid = new AsyncHybridRetriever(60, 5, new VectorRetriever(failing));

  const result = await hybrid.retrieveAsync("消息队列选型", sampleEntries);

  // BM25 字面召回兜底仍然生效
  assert.ok(result.some((entry) => entry.id === "kafka"));

  // 降级事件已发射且携带错误详情
  const degraded = events.filter((ev): ev is RetrieverDegradedTrace => ev.kind === "retriever_degraded");
  assert.equal(degraded.length, 1);
  assert.equal(degraded[0].errorMessage, "model overloaded");
});

test("非 Error 异常归一化为结构化字段", async () => {
  const events: TraceEvent[] = [];
  recorder.register({
    name: "test-retriever-non-error",
    report: (e: TraceEvent) => { events.push(e); },
  });

  const rejecting: EmbeddingProvider = {
    embed: () => Promise.reject("model overloaded"),
  };

  const retriever = new VectorRetriever(rejecting);
  await retriever.retrieveAsync("我要做登录", sampleEntries);

  assert.equal(events.length, 1);
  const e = events[0] as RetrieverDegradedTrace;
  assert.equal(e.errorName, "Error");
  assert.equal(e.errorMessage, "model overloaded");
});
