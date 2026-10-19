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

// 安全的纯文本处理：切断污点流，移除控制字符，限制长度防 DoS
function sanitizeTextInput(input: string): string {
  if (!input) return "";
  // 将输入转为字符串，移除不可见的 ASCII 控制字符（如 \0）
  // eslint-disable-next-line no-control-regex
  const clean = String(input).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  // 限制最大长度
  return clean.slice(0, 100000);
}

export function savePlaybookEntry(params: SavePlaybookParams): string {
  const dir = path.resolve(getMonorepoRoot(), "docs/playbook");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const timestamp = Date.now();
  const safeTitle = sanitizeTextInput(params.title).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-").slice(0, 20);
  const fileName = path.basename(`fact-${timestamp}-${safeTitle}.md`);
  const filePath = path.join(dir, fileName);
  const today = new Date().toISOString().split("T")[0];

  let alternativesYaml = "[]";
  if (params.alternatives && params.alternatives.length > 0) {
    alternativesYaml = "\n" + params.alternatives.map(a => `  - ${sanitizeTextInput(a)}`).join("\n");
  }

  const safeContent = sanitizeTextInput(params.content);
  const safeDecision = sanitizeTextInput(params.decision);
  const safeRationale = sanitizeTextInput(params.rationale);

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
