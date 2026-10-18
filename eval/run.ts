import "@tda/core/lib/env";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent, recorder } from "@tda/core";
import type { TraceEvent } from "@tda/core";
import { executeToolCalls, openAITools } from "@tda/tools";
import { skillsByName } from "@tda/skills";
import type { EvalCase, EvalResult, EvalReport } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesDir = path.join(__dirname, "cases");
const reportDir = path.join(__dirname, "report");

/** 解析 input，映射到 skill 参数 */
function parseInput(skillName: string, input: string): Record<string, unknown> {
  const skill = skillsByName.get(skillName);
  if (!skill) throw new Error(`未知 skill: ${skillName}`);
  const shape = (skill.parameters as any).shape ?? {};
  const keys = Object.keys(shape);
  if (keys.length === 0) return {};
  return { [keys[0]]: input };
}

/** 从 trace 事件里提取统计 */
function extractTraceStats(events: TraceEvent[]) {
  const agentRun = events.find((e) => e.kind === "agent_run");
  const toolCalls = events.filter((e) => e.kind === "tool_call");
  const ctxBuilds = events.filter((e) => e.kind === "context_build");

  return {
    stopReason: (agentRun as any)?.stopReason,
    steps: (agentRun as any)?.steps ?? 0,
    toolCalls: (agentRun as any)?.toolCalls ?? toolCalls.length,
    usedTools: Array.from(new Set(toolCalls.map((e: any) => e.name))),
    contextBuilds: ctxBuilds.length,
  };
}

async function runCase(c: EvalCase): Promise<EvalResult> {
  const start = Date.now();
  const failures: string[] = [];
  const skill = skillsByName.get(c.skill);

  if (!skill) {
    return {
      id: c.id,
      skill: c.skill,
      input: c.input,
      passed: false,
      durationMs: 0,
      output: "",
      failures: [`未知 skill: ${c.skill}`],
    };
  }

  const args = parseInput(c.skill, c.input);
  const parsed = skill.parameters.safeParse(args);
  if (!parsed.success) {
    return {
      id: c.id,
      skill: c.skill,
      input: c.input,
      passed: false,
      durationMs: 0,
      output: "",
      failures: [`参数校验失败：${parsed.error.issues.map((i) => i.message).join(", ")}`],
    };
  }

  const userMessage = skill.buildUserMessage({
    input: c.input,
    args: parsed.data as Record<string, unknown>,
    cwd: process.cwd(),
  });

  const allowedTools = openAITools.filter(
    (t) => t.type === "function" && skill.tools.includes(t.function.name)
  );

  // 收集 trace
  const events: TraceEvent[] = [];
  const reporterName = `eval-${c.id}-${Date.now()}`;
  recorder.register({
    name: reporterName,
    report: (e: TraceEvent) => {
      events.push(e);
    },
  });

  let output = "";

  try {
    output = await runAgent(skill.system, userMessage, {
      verbose: false,
      maxSteps: skill.maxSteps,
      tools: allowedTools,
      executeTools: executeToolCalls,
    });
  } catch (e: any) {
    failures.push(`Agent 异常：${e.message}`);
    return {
      id: c.id,
      skill: c.skill,
      input: c.input,
      passed: false,
      durationMs: Date.now() - start,
      output: "",
      failures,
    };
  }

  // ===== 输出断言 =====
  for (const s of c.mustContain ?? []) {
    if (!output.includes(s)) failures.push(`缺少必须包含："${s}"`);
  }
  for (const s of c.mustNotContain ?? []) {
    if (output.includes(s)) failures.push(`不应包含："${s}"`);
  }
  if (c.mustContainAny && c.mustContainAny.length > 0) {
    if (!c.mustContainAny.some((s) => output.includes(s))) {
      failures.push(`必须包含任一：${c.mustContainAny.join(" | ")}`);
    }
  }

  // ===== 轨迹断言（从 Trace） =====
  const stats = extractTraceStats(events);

  if (c.expect) {
    if (c.expect.stopReason && c.expect.stopReason.length > 0) {
      if (!c.expect.stopReason.includes(stats.stopReason ?? "")) {
        failures.push(
          `stopReason 不符：实际 "${stats.stopReason}"，期望 ${c.expect.stopReason.join(" | ")}`
        );
      }
    }
    if (c.expect.mustUseTools && c.expect.mustUseTools.length > 0) {
      for (const tool of c.expect.mustUseTools) {
        if (!stats.usedTools.includes(tool)) {
          failures.push(`必须调用工具 "${tool}"，实际只调用了 [${stats.usedTools.join(", ")}]`);
        }
      }
    }
    if (c.expect.maxToolCalls != null && stats.toolCalls > c.expect.maxToolCalls) {
      failures.push(
        `工具调用次数超标：实际 ${stats.toolCalls}，上限 ${c.expect.maxToolCalls}`
      );
    }
    if (c.expect.mustHaveContextBuild && stats.contextBuilds === 0) {
      failures.push(`期望有上下文组装记录（context_build），实际为 0`);
    }
  }

  return {
    id: c.id,
    skill: c.skill,
    input: c.input,
    passed: failures.length === 0,
    durationMs: Date.now() - start,
    output,
    failures,
    toolCalls: stats.toolCalls,
    steps: stats.steps,
    stopReason: stats.stopReason,
    usedTools: stats.usedTools,
    contextBuilds: stats.contextBuilds,
  };
}

async function main() {
  const files = fs.readdirSync(casesDir).filter((f) => f.endsWith(".json"));
  const cases: EvalCase[] = [];
  for (const f of files) {
    const content = JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf-8"));
    cases.push(...content);
  }

  console.log(`\n🧪 评估集：${cases.length} 个用例\n`);

  const results: EvalResult[] = [];
  const start = Date.now();

  for (const c of cases) {
    process.stdout.write(`  [${c.skill}] ${c.id} ... `);
    const r = await runCase(c);
    results.push(r);
    console.log(r.passed ? "✅" : "❌");
    if (!r.passed) {
      for (const f of r.failures) console.log(`      ${f}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const report: EvalReport = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    durationMs: Date.now() - start,
    results,
  };

  fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(reportDir, "latest.json"), JSON.stringify(report, null, 2));

  console.log(`\n📊 结果：${passed}/${results.length} 通过，耗时 ${(report.durationMs / 1000).toFixed(1)}s`);
  console.log(`📄 报告：${reportFile}`);
  console.log(`📄 最新：${path.join(reportDir, "latest.json")}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
