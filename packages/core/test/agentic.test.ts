import { test, describe } from "node:test";
import assert from "node:assert";
import { AgenticLoop } from "../src/runtime/agentic-loop";
import type { AgenticContext } from "../src/runtime/agentic-types";

describe("AgenticLoop 闭环调度与迭代控制", () => {
  test("强制不满足条件：应当跑满最大轮数并触发 abort", async () => {
    const forceIncompleteEvaluator = async (ctx: AgenticContext) => {
      return { complete: false, reason: "Mock: 始终认为不完整" };
    };
    const loop = new AgenticLoop(forceIncompleteEvaluator);
    const ctx = await loop.run("测试需求：我想知道登录怎么做", 3);
    
    assert.strictEqual(ctx.iteration, 3, "应当跑满 3 轮");
    assert.strictEqual(ctx.isComplete, false);
    assert.strictEqual(ctx.accumulatedContext.length, 3, "每一轮都应该收集到上下文");
    assert.ok(ctx.trace.some(t => t.action === "abort"), "应当触发 abort 记录");
  });

  test("自定义评估器：第一轮即认为完成", async () => {
    const forceCompleteEvaluator = async (ctx: AgenticContext) => {
      return { complete: true, reason: "Mock: 强制完成" };
    };
    const loop = new AgenticLoop(forceCompleteEvaluator);
    const ctx = await loop.run("测试需求", 5);
    
    assert.strictEqual(ctx.iteration, 1, "应当在第一轮就停止");
    assert.strictEqual(ctx.isComplete, true);
    assert.ok(ctx.trace.some(t => t.action === "complete"));
  });
});
