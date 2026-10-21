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
  force?: boolean;
}

export interface SaveResult {
  status: "active" | "pending_review";
  fileName: string;
  conflicts?: PlaybookEntry[];
}

// 安全的纯文本处理
function sanitizeTextInput(input: string): string {
  if (!input) return "";
  // eslint-disable-next-line no-control-regex
  const clean = String(input).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return clean.slice(0, 100000);
}

export function detectConflict(params: SavePlaybookParams): PlaybookEntry[] {
  const entries = loadPlaybook();
  const normalizedTitle = params.title.replace(/\s+/g, "").toLowerCase();
  const normalizedDecision = params.decision.replace(/\s+/g, "").toLowerCase();

  return entries.filter((e) => {
    if (e.status !== "active") return false;
    if (e.domain !== params.domain) return false;

    const eTitle = e.title.replace(/\s+/g, "").toLowerCase();
    const eDecision = (e.decision || "").replace(/\s+/g, "").toLowerCase();

    return (
      eTitle === normalizedTitle ||
      (eDecision && eDecision === normalizedDecision) ||
      (normalizedTitle.length > 5 &&
        (eTitle.includes(normalizedTitle) || normalizedTitle.includes(eTitle)))
    );
  });
}

export function savePlaybookEntry(params: SavePlaybookParams): SaveResult {
  const conflicts = detectConflict(params);
  const isPending = conflicts.length > 0 && !params.force;

  // 根据是否冲突，决定写入正式目录还是 .pending 暂存目录
  const baseDir = isPending
    ? path.resolve(getMonorepoRoot(), "docs/playbook/.pending")
    : path.resolve(getMonorepoRoot(), "docs/playbook");

  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  const timestamp = Date.now();
  const safeTitle = sanitizeTextInput(params.title)
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-")
    .slice(0, 20);
  const fileName = path.basename(`fact-${timestamp}-${safeTitle}.md`);
  const filePath = path.join(baseDir, fileName);
  const today = new Date().toISOString().split("T")[0];

  let alternativesYaml = "[]";
  if (params.alternatives && params.alternatives.length > 0) {
    alternativesYaml =
      "\n" + params.alternatives.map((a) => `  - ${sanitizeTextInput(a)}`).join("\n");
  }

  const safeContent = sanitizeTextInput(params.content);
  const safeDecision = sanitizeTextInput(params.decision);
  const safeRationale = sanitizeTextInput(params.rationale);
  
  // 如果是 pending_review，记录冲突源 ID
  const conflictWithYaml = isPending && conflicts.length > 0
    ? `\nconflict_with: [${conflicts.map(c => c.id).join(", ")}]`
    : "";

  const content = `---
id: fact-${timestamp}
type: ${params.type}
domain: ${params.domain}
status: ${isPending ? "pending_review" : "active"}${conflictWithYaml}
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
  
  return {
    status: isPending ? "pending_review" : "active",
    fileName,
    conflicts: isPending ? conflicts : undefined,
  };
}
