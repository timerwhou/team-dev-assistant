import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { MemoryStore } from "../src/runtime/memory-store";

describe("Agent 记忆与长期演化测试", () => {
  const testMemoryPath = path.join(process.cwd(), ".tda/memory-test-v2.json");
  let store: MemoryStore;

  before(() => {
    if (fs.existsSync(testMemoryPath)) fs.unlinkSync(testMemoryPath);
    store = new MemoryStore(testMemoryPath);
  });

  after(() => {
    if (fs.existsSync(testMemoryPath)) fs.unlinkSync(testMemoryPath);
  });

  test("MemoryStore 能够正确记录 Trace 并查询历史", () => {
    // 记录两次执行
    store.recordTrace("wf-1", "测试需求 A", [{ iteration: 1, action: "retrieve", detail: "test", timestamp: Date.now() }], 1);
    store.recordTrace("wf-2", "测试需求 B", [{ iteration: 2, action: "complete", detail: "test", timestamp: Date.now() }], 2);

    // 验证列表
    const recent = store.listRecentExecutions();
    assert.strictEqual(recent.length, 2);
    assert.strictEqual(recent[0].workflowId, "wf-2"); // 最新的在最前

    // 验证单次详情
    const detail = store.getTrace("wf-1");
    assert.ok(detail);
    assert.strictEqual(detail.iterations, 1);
    assert.strictEqual(detail.trace.length, 1);
  });
});
