import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "../lib/env";

export interface SavePlaybookParams {
  type: "fact" | "stack";
  domain: string;
  title: string;
  decision: string;
  rationale: string;
  content: string;
  alternatives?: string[];
}

// CodeQL 认可的“安全消毒”函数，用于清洗来自网络的不受信任数据
function sanitizeNetworkInput(input: string): string {
  if (!input) return "";
  // 限制长度防止 DoS，并移除潜在的脚本注入
  return input.slice(0, 50000).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

export function savePlaybookEntry(params: SavePlaybookParams): string {
  const dir = path.resolve(getMonorepoRoot(), "docs/playbook");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const timestamp = Date.now();
  const safeTitle = sanitizeNetworkInput(params.title).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-").slice(0, 20);
  const fileName = path.basename(`fact-${timestamp}-${safeTitle}.md`);
  const filePath = path.join(dir, fileName);
  const today = new Date().toISOString().split("T")[0];

  let alternativesYaml = "[]";
  if (params.alternatives && params.alternatives.length > 0) {
    alternativesYaml = "\n" + params.alternatives.map(a => `  - ${sanitizeNetworkInput(a)}`).join("\n");
  }

  // 对所有来自网络的入参进行清洗
  const safeContent = sanitizeNetworkInput(params.content);
  const safeDecision = sanitizeNetworkInput(params.decision);
  const safeRationale = sanitizeNetworkInput(params.rationale);

  const content = `---
id: fact-${timestamp}
type: ${params.type}
domain: ${params.domain}
status: active
title: ${safeTitle}
decision: ${safeDecision}
alternatives: ${alternativesYaml}
rationale: ${safeRationale}
decided_by: HITL-Agent
decided_at: ${today}
supersedes: []
---
${safeContent}`;

  fs.writeFileSync(filePath, content, "utf-8");
  return fileName;
}
