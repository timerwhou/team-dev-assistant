import "@tda/core/lib/env";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent, recorder } from "@tda/core";
import type { TraceEvent } from "@tda/core";
import { executeToolCalls, openAITools } from "@tda/tools";
import { skillsByName } from "@tda/skills";
import type {
  BenchmarkCase,
  BenchmarkRun,
  BenchmarkReport,
} from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(__dirname, "results");

function filterTools(skillName: string) {
  const skill = skillsByName.get(skillName);
  if (!skill) throw new Error(`未知 skill: ${skillName}`);
  return openAITools.filter(
    (t) => t.type === "function" && skill.tools.includes(t.function.name)
  );
}

/**
 * 跑一次 Agent，收集 trace 数据。
 *
 * 关键：目标不是"对比压缩前后"，而是"量化单次工具结果压缩收益"。
 * 因为 LLM 决策非确定——无压缩时可能少读文件，有压缩反而多读。
 */
async function runOnce(
  c: BenchmarkCase,
  mode: "no-compress" | "compressed"
): Promise<BenchmarkRun> {
  const skill = skillsByName.get(c.skill);
  if (!skill) throw new Error(`未知 skill: ${c.skill}`);

  const events: TraceEvent[] = [];
  const reporterName = `benchmark-${c.id}-${mode}-${Date.now()}`;
  recorder.register({
    name: reporterName,
    report: (e: TraceEvent) => {
      events.push(e);
    },
  });

  const shape = (skill.parameters as any).shape ?? {};
  const keys = Object.keys(shape);
  const args: Record<string, unknown> = {};
  if (keys.length > 0) args[keys[0]] = c.input;

  const parsed = skill.parameters.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `参数校验失败：${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const userMessage = skill.buildUserMessage({
    input: c.input,
    args: parsed.data as Record<string, unknown>,
    cwd: process.cwd(),
  });

  const start = Date.now();
  let output = "";
  let timedOut = false;

  try {
    output = await Promise.race([
      runAgent(skill.system, userMessage, {
        verbose: false,
        maxSteps: skill.maxSteps,
        tools: filterTools(c.skill),
        executeTools: executeToolCalls,
        compressorOptions:
          mode === "no-compress"
            ? {
                readFileMaxLines: 999999,
                searchCodeMaxMatches: 999999,
                listIssuesMaxItems: 999999,
              }
            : undefined,
      }),
      new Promise<string>((_, rej) =>
        setTimeout(
          () => rej(new Error("benchmark timeout 180s")),
          180_000
        )
      ),
    ]);
  } catch (e: any) {
    const isTimeout = e?.message?.includes("timeout");
    if (isTimeout) {
      timedOut = true;
      output = `[TIMEOUT] ${e.message}`;
    } else {
      console.error(`   ❌ 未预期错误：${e.message}`);
      console.error(`   stack: ${e.stack?.slice(0, 800)}`);
      throw e;
    }
  }

  const durationMs = Date.now() - start;

  const llmEvents = events.filter((e) => e.kind === "llm_call");
  const agentRun = events.find((e) => e.kind === "agent_run");
  const ctxBuilds = events.filter((e) => e.kind === "context_build");

  const totalPromptTokens = llmEvents.reduce(
    (s, e: any) => s + (e.promptTokens || 0),
    0
  );
  const totalCompletionTokens = llmEvents.reduce(
    (s, e: any) => s + (e.completionTokens || 0),
    0
  );
  const totalCostUSD = llmEvents.reduce(
    (s, e: any) => s + (e.costUSD || 0),
    0
  );

  const beforeTokens = ctxBuilds.reduce(
    (s, e: any) => s + (e.beforeTokens || 0),
    0
  );
  const afterTokens = ctxBuilds.reduce(
    (s, e: any) => s + (e.afterTokens || 0),
    0
  );
  const compressedCount = ctxBuilds.filter(
    (e: any) => e.action === "truncate"
  ).length;

  return {
    caseId: c.id,
    mode,
    output: output.slice(0, 200),
    llmCalls: llmEvents.length,
    steps: (agentRun as any)?.steps ?? 0,
    toolCalls: (agentRun as any)?.toolCalls ?? 0,
    totalPromptTokens,
    totalCompletionTokens,
    totalCostUSD,
    contextBuilds: {
      total: ctxBuilds.length,
      compressed: compressedCount,
      beforeTokens,
      afterTokens,
    },
    durationMs,
    stopReason: (agentRun as any)?.stopReason,
    timedOut,
  };
}

async function main() {
  const casesFile = path.join(__dirname, "../cases/investigate.json");
  const cases: BenchmarkCase[] = JSON.parse(
    fs.readFileSync(casesFile, "utf-8")
  );

  console.log(`\n🚀 Context Engineering 收益量化`);
  console.log(`   用例数：${cases.length}`);
  console.log(`   目标：量化单次工具结果压缩收益\n`);

  const runs: BenchmarkRun[] = [];

  for (const c of cases) {
    console.log(`\n🧪 ${c.id}`);
    console.log(`   ${c.description || c.input}`);

    console.log(`   [无压缩] 跑...`);
    const noCompress = await runOnce(c, "no-compress");
    console.log(
      `      tokens: ${noCompress.totalPromptTokens} | 成本: $${noCompress.totalCostUSD.toFixed(6)} | ${noCompress.durationMs}ms${noCompress.timedOut ? " (超时)" : ""}`
    );
    runs.push(noCompress);

    console.log(`   [有压缩] 跑...`);
    const compressed = await runOnce(c, "compressed");
    console.log(
      `      tokens: ${compressed.totalPromptTokens} | 成本: $${compressed.totalCostUSD.toFixed(6)} | ${compressed.durationMs}ms${compressed.timedOut ? " (超时)" : ""}`
    );
    runs.push(compressed);
  }

  // ===== 单次工具结果压缩收益统计 =====
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 单次工具结果压缩收益`);
  console.log(`${"=".repeat(60)}`);

  // 从所有 run 的 contextBuilds 里统计
  const allBuilds = runs.flatMap((r) => [
    {
      mode: r.mode,
      before: r.contextBuilds.beforeTokens,
      after: r.contextBuilds.afterTokens,
      total: r.contextBuilds.total,
      compressed: r.contextBuilds.compressed,
    },
  ]);

  const totalBuilds = allBuilds.reduce((s, b) => s + b.total, 0);
  const totalCompressed = allBuilds.reduce((s, b) => s + b.compressed, 0);
  const totalBefore = allBuilds.reduce((s, b) => s + b.before, 0);
  const totalAfter = allBuilds.reduce((s, b) => s + b.after, 0);
  const savedTokens = totalBefore - totalAfter;
  const compressionRatio =
    totalBefore > 0 ? (savedTokens / totalBefore) * 100 : 0;

  console.log(`   总工具调用：${totalBuilds}`);
  console.log(`   触发压缩：${totalCompressed}`);
  console.log(`   压缩前 tokens：${totalBefore}`);
  console.log(`   压缩后 tokens：${totalAfter}`);
  console.log(`   累计节省：${savedTokens}`);
  console.log(`   平均压缩比：${compressionRatio.toFixed(1)}%`);

  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    totalCases: cases.length,
    runs,
    summary: {
      totalBuilds,
      totalCompressed,
      totalBeforeTokens: totalBefore,
      totalAfterTokens: totalAfter,
      savedTokens,
      compressionRatio,
    },
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  const reportFile = path.join(resultsDir, `benchmark-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(resultsDir, "latest.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n   报告：${reportFile}`);
  console.log(`   最新：${path.join(resultsDir, "latest.json")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
