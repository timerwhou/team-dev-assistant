import { test } from "node:test";
import assert from "node:assert/strict";
import { recorder } from "../src/trace/recorder";
import type { TraceEvent, ContextBuildTrace } from "../src/trace/types";

test("emitContextBuild 生成正确的事件", async () => {
  const events: TraceEvent[] = [];
  const reporter = {
    name: "test",
    report: (e: TraceEvent) => {
      events.push(e);
    },
  };
  recorder.register(reporter);

  recorder.emitContextBuild({
    agentType: "root",
    layer: "tool",
    action: "truncate",
    toolName: "read_file",
    beforeTokens: 5000,
    afterTokens: 1000,
    reason: "超过 500 行",
  });

  await recorder.flush();

  assert.equal(events.length, 1);
  const e = events[0] as ContextBuildTrace;
  assert.equal(e.kind, "context_build");
  assert.equal(e.agentType, "root");
  assert.equal(e.layer, "tool");
  assert.equal(e.action, "truncate");
  assert.equal(e.toolName, "read_file");
  assert.equal(e.beforeTokens, 5000);
  assert.equal(e.afterTokens, 1000);
  assert.ok(e.id);
  assert.ok(e.timestamp);
});

test("emitContextBuild 支持 instruction 层（SystemPrompt 组装）", async () => {
  const events: TraceEvent[] = [];
  const reporter = {
    name: "test-instruction",
    report: (e: TraceEvent) => {
      events.push(e);
    },
  };
  recorder.register(reporter);

  recorder.emitContextBuild({
    agentType: "root",
    layer: "instruction",
    action: "keep",
    beforeTokens: 500,
    afterTokens: 500,
    reason: "SystemPrompt 未压缩",
  });

  await recorder.flush();

  assert.equal(events.length, 1);
  const e = events[0] as ContextBuildTrace;
  assert.equal(e.layer, "instruction");
  assert.equal(e.action, "keep");
});

test("TDA_TRACE=0 时不记录", async () => {
  const originalEnabled = recorder.isEnabled();
  recorder.setEnabled(false);

  const events: TraceEvent[] = [];
  const reporter = {
    name: "test-disabled",
    report: (e: TraceEvent) => {
      events.push(e);
    },
  };
  recorder.register(reporter);

  recorder.emitContextBuild({
    agentType: "root",
    layer: "tool",
    action: "keep",
    beforeTokens: 100,
    afterTokens: 100,
    reason: "test",
  });

  await recorder.flush();

  assert.equal(events.length, 0);

  recorder.setEnabled(originalEnabled);
});
