#!/usr/bin/env node
/**
 * 从 eval/report/latest.json 生成 VitePress 页面。
 *
 * 输出：docs/site/eval/index.md
 *
 * 每次 pnpm docs:build / docs:dev 前运行。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const REPORT_FILE = path.join(repoRoot, "eval/report/latest.json");
const DEST_DIR = path.join(repoRoot, "docs/site/eval");

function main() {
  if (!fs.existsSync(REPORT_FILE)) {
    console.warn(`[eval-docs] 报告不存在：${REPORT_FILE}`);
    console.warn(`[eval-docs] 跳过生成。先运行 pnpm eval。`);
    return;
  }

  const report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf-8"));

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const passRate = ((report.passed / report.total) * 100).toFixed(1);
  const duration = (report.durationMs / 1000).toFixed(1);

  const lines = [];
  lines.push("# 质量仪表盘");
  lines.push("");
  lines.push(`> 最新评估：${new Date(report.timestamp).toLocaleString("zh-CN")}`);
  lines.push("");
  lines.push("## 总览");
  lines.push("");
  lines.push("| 指标 | 值 |");
  lines.push("|---|---|");
  lines.push(`| **通过率** | **${report.passed}/${report.total}（${passRate}%）** |`);
  lines.push(`| 总耗时 | ${duration}s |`);
  lines.push(`| 生成时间 | ${new Date(report.timestamp).toLocaleString("zh-CN")} |`);
  lines.push("");
  lines.push("## 用例明细");
  lines.push("");
  lines.push("| 用例 | Skill | 状态 | 步数 | 工具调用 |");
  lines.push("|---|---|---|---|---|");
  for (const r of report.results) {
    const status = r.passed ? "✅" : "❌";
    lines.push(
      `| \`${r.id}\` | ${r.skill} | ${status} | ${r.steps ?? "-"} | ${r.toolCalls ?? "-"} |`
    );
  }
  lines.push("");
  lines.push("## 如何运行");
  lines.push("");
  lines.push("```bash");
  lines.push("# 跑全量评估");
  lines.push("pnpm eval");
  lines.push("");
  lines.push("# 只跑 critical 子集（CI 用）");
  lines.push("EVAL_SUBSET=critical pnpm eval");
  lines.push("```");
  lines.push("");
  lines.push("## 相关文档");
  lines.push("");
  lines.push("- [设计文档](/design/context-engineering)");
  lines.push("- [ADR-0005: Context Engineering](/adr/0005-context-engineering)");
  lines.push("");

  const outFile = path.join(DEST_DIR, "index.md");
  fs.writeFileSync(outFile, lines.join("\n"));
  console.log(`[eval-docs] 生成 ${path.relative(repoRoot, outFile)}`);
}

main();
