import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { MemoryStore } from "../src/runtime/memory-store";
import { runAgenticInject } from "../src/runtime/agentic-presets";

describe("Agent 记忆与长期演化测试", () => {
  const testMemoryPath = path.join(process.cwd(), ".tda/memory-test.json");
  let store: MemoryStore;

  before(() => {
    if (fs.existsSync(testMemoryPath)) fs.unlinkSync(testMemoryPath);
    store = new MemoryStore(testMemoryPath);
  });

  after(() => {
    if (fs.existsSync(testMemoryPath)) fs.unlinkSync(testMemoryPath);
  });

  test("MemoryStore 能够正确记录并计算平均迭代次数", () => {
    store.recordExecution("我要做登录鉴权", 1);
    store.recordExecution("我要做登录鉴权", 3);

    const expected = store.getExpectedIterations("我要做登录鉴权");
    assert.strictEqual(expected, 2, "平均轮数应为 (1+3)/2 = 2");
    
    // 验证归一化：空格和大小写不影响 Hash
    const expected2 = store.getExpectedIterations(" 我要做 登录鉴权 ");
    assert.strictEqual(expected2, 2);
  });
});
