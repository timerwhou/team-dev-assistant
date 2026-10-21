import { test, describe } from "node:test";
import assert from "node:assert";
import { WorkflowParser } from "../src/runtime/workflow-parser";
import type { WorkflowManifest } from "../src/runtime/workflow-types";

describe("WorkflowParser 阶段化能力装配测试", () => {
  const mockManifest: WorkflowManifest = {
    name: "test-workflow",
    description: "用于测试的工作流",
    stages: ["context-gathering", "execution"],
    stageCapabilities: {
      "context-gathering": ["tool", "retriever"],
      "execution": ["tool"]
    },
  };

  test("Phase 1 (context-gathering): 仅应装配 tool 与 retriever", () => {
    const packs = WorkflowParser.resolveCapabilities(mockManifest, "context-gathering");
    // 因为注册中心里目前内置的是两个 tool (search_code, list_issues)
    assert.strictEqual(packs.length, 2, "应当匹配到 2 个能力包");
    assert.ok(packs.every(p => p.metadata.kind === "tool" || p.metadata.kind === "retriever"));
  });

  test("Phase 2 (execution): 仅应装配 tool", () => {
    const packs = WorkflowParser.resolveCapabilities(mockManifest, "execution");
    // 也是两个 tool
    assert.strictEqual(packs.length, 2, "应当匹配到 2 个能力包");
    assert.ok(packs.every(p => p.metadata.kind === "tool"));
  });

  test("未知阶段: 应返回空数组，阻止越权装配", () => {
    const packs = WorkflowParser.resolveCapabilities(mockManifest, "unknown-stage");
    assert.strictEqual(packs.length, 0, "未知阶段不应装配任何能力");
  });
});
