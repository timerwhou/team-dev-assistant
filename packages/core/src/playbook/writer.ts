import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "../lib/env";
import { loadPlaybook } from "./loader";
import type { PlaybookEntry } from "./types";

export interface SavePlaybookParams {
  type: "fact" | "stack";
  domain: string;
  title: string;
  decision: string;
  rationale: string;
  content: string;
  alternatives?: string[];
  force?: boolean; // 如果为 true，则忽略冲突直接覆盖
}

export class PlaybookConflictError extends Error {
  constructor(public conflicts: PlaybookEntry[]) {
    super(`检测到 ${conflicts.length} 条潜在冲突的 Playbook 条目`);
    this.name = "PlaybookConflictError";
  }
}

// 安全的纯文本处理：切断污点流，移除控制字符，限制长度防 DoS
function sanitizeTextInput(input: string): string {
  if (!input) return "";
  // eslint-disable-next-line no-control-regex
  const clean = String(input).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return clean.slice(0, 100000);
}

/**
 * 冲突检测：同 domain 下，标题或决策高度相似的条目视为冲突
 */
export function detectConflict(params: SavePlaybookParams): PlaybookEntry[] {
  const entries = loadPlaybook();
  const normalizedTitle = params.title.replace(/\s+/g, "").toLowerCase();
  const normalizedDecision = params.decision.replace(/\s+/g, "").toLowerCase();

  return entries.filter((e) => {
    if (e.status !== "active") return false;
    // 不同 domain 不视为直接冲突
    if (e.domain !== params.domain) return false;

    const eTitle = e.title.replace(/\s+/g, "").toLowerCase();
    const eDecision = (e.decision || "").replace(/\s+/g, "").toLowerCase();

    // 冲突判定规则：
    // 1. 标题完全一致
    // 2. 决策文本完全一致
    // 3. 标题互相包含（长度超过 5 字符，避免误判）
    return (
      eTitle === normalizedTitle ||
      (eDecision && eDecision === normalizedDecision) ||
      (normalizedTitle.length > 5 &&
        (eTitle.includes(normalizedTitle) || normalizedTitle.includes(eTitle)))
    );
  });
}

export function savePlaybookEntry(params: SavePlaybookParams): string {
  const conflicts = detectConflict(params);
  if (conflicts.length > 0 && !params.force) {
    throw new PlaybookConflictError(conflicts);
  }

  const dir = path.resolve(getMonorepoRoot(), "docs/playbook");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const timestamp = Date.now();
  const safeTitle = sanitizeTextInput(params.title)
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-")
    .slice(0, 20);
  const fileName = path.basename(`fact-${timestamp}-${safeTitle}.md`);
  const filePath = path.join(dir, fileName);
  const today = new Date().toISOString().split("T")[0];

  let alternativesYaml = "[]";
  if (params.alternatives && params.alternatives.length > 0) {
    alternativesYaml =
      "\n" + params.alternatives.map((a) => `  - ${sanitizeTextInput(a)}`).join("\n");
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
