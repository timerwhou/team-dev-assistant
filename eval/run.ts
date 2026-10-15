import "@tda/core/lib/env";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "@tda/core";
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
  // 简单策略：单参数 skill 全给第一个 key
  return { [keys[0]]: input };
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

  let output = "";
  let toolCallCount = 0;

  // 包一层工具执行器统计调用次数
  const countingExecutor = async (calls: any[]) => {
    toolCallCount += calls.length;
    return executeToolCalls(calls);
  };

  try {
    output = await runAgent(skill.system, userMessage, {
      verbose: false,
      maxSteps: skill.maxSteps,
      tools: allowedTools,
      executeTools: countingExecutor,
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
      toolCalls: toolCallCount,
    };
  }

  // 断言
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

  return {
    id: c.id,
    skill: c.skill,
    input: c.input,
    passed: failures.length === 0,
    durationMs: Date.now() - start,
    output,
    failures,
    toolCalls: toolCallCount,
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

  // 写报告
  fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  // 最新报告软链
  const latest = path.join(reportDir, "latest.json");
  fs.writeFileSync(latest, JSON.stringify(report, null, 2));

  console.log(`\n📊 结果：${passed}/${results.length} 通过，耗时 ${(report.durationMs / 1000).toFixed(1)}s`);
  console.log(`📄 报告：${reportFile}`);
  console.log(`📄 最新：${latest}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
