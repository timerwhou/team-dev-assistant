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

export function savePlaybookEntry(params: SavePlaybookParams): string {
  const dir = path.resolve(getMonorepoRoot(), "docs/playbook");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const timestamp = Date.now();
  const safeTitle = params.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-").slice(0, 20);
  const fileName = `fact-${timestamp}-${safeTitle}.md`;
  const filePath = path.join(dir, fileName);
  const today = new Date().toISOString().split("T")[0];

  let alternativesYaml = "[]";
  if (params.alternatives && params.alternatives.length > 0) {
    alternativesYaml = "\n" + params.alternatives.map(a => `  - ${a}`).join("\n");
  }

  const content = `---
id: fact-${timestamp}
type: ${params.type}
domain: ${params.domain}
status: active
title: ${params.title}
decision: ${params.decision}
alternatives: ${alternativesYaml}
rationale: ${params.rationale}
decided_by: HITL-Agent
decided_at: ${today}
supersedes: []
---
${params.content}`;

  fs.writeFileSync(filePath, content, "utf-8");
  return fileName;
}
