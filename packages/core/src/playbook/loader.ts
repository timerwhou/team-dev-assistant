import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "../lib/env";
import type { PlaybookEntry } from "./types";

const PLAYBOOK_DIR = path.join(getMonorepoRoot(), "docs/playbook");

export function loadPlaybook(): PlaybookEntry[] {
  if (!fs.existsSync(PLAYBOOK_DIR)) return [];
  
  const entries: PlaybookEntry[] = [];
  const files = fs.readdirSync(PLAYBOOK_DIR).filter(f => f.endsWith(".md") && f !== "README.md");

  for (const file of files) {
    const filePath = path.join(PLAYBOOK_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    
    // 解析 YAML frontmatter
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;

    const yaml = match[1];
    const body = match[2].trim();

    const get = (key: string) => {
      const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim() : "";
    };

    entries.push({
      id: get("id") || file.replace(".md", ""),
      type: (get("type") as any) || "fact",
      domain: get("domain") || "general",
      status: (get("status") as any) || "active",
      title: get("title") || file,
      content: body,
      path: file,
    });
  }
  return entries;
}

export function getContextPack(requirement: string): string {
  const entries = loadPlaybook();
  const keywords = requirement.split(/\s+/).filter(k => k.length > 1);
  
  // 极简关键词匹配，后续可升级为向量检索
  const relevant = entries.filter(e => 
    e.status === "active" && 
    (keywords.some(k => e.title.includes(k) || e.content.includes(k) || e.domain.includes(k)))
  );

  if (relevant.length === 0) return "";

  let prompt = `# 项目架构基座与业务事实（上下文注入）\n\n针对需求：${requirement}\n\n`;
  
  const facts = relevant.filter(r => r.type === "fact");
  const stacks = relevant.filter(r => r.type === "stack");

  if (stacks.length > 0) {
    prompt += `## 技术规约 (Stack)\n`;
    for (const s of stacks) prompt += `- **${s.title}**：${s.content}\n`;
    prompt += `\n`;
  }
  if (facts.length > 0) {
    prompt += `## 业务事实 (Facts)\n`;
    for (const f of facts) prompt += `- **${f.title}**：${f.content}\n`;
    prompt += `\n`;
  }
  
  prompt += `> 请在基于上述技术选型和业务逻辑的前提下，完成代码设计与实现，禁止偏离。\n`;
  return prompt;
}
