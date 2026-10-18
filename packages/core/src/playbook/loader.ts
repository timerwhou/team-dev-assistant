import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "../lib/env";
import type { PlaybookEntry } from "./types";

const PLAYBOOK_DIR = path.join(getMonorepoRoot(), "docs/playbook");

// 抽象检索接口，为 1.1 的语义检索留口子
export interface Retriever {
  retrieve(requirement: string, entries: PlaybookEntry[]): PlaybookEntry[];
}

export function loadPlaybook(): PlaybookEntry[] {
  if (!fs.existsSync(PLAYBOOK_DIR)) return [];
  const entries: PlaybookEntry[] = [];
  const files = fs.readdirSync(PLAYBOOK_DIR).filter(f => f.endsWith(".md") && f !== "README.md");

  for (const file of files) {
    const filePath = path.join(PLAYBOOK_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;

    const yaml = match[1];
    const body = match[2].trim();
    const get = (key: string) => {
      const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim() : "";
    };

    // 简单解析数组（实际项目中可引入 gray-matter 或 js-yaml）
    const getArray = (key: string) => {
      const m = yaml.match(new RegExp(`^${key}:\\s*\\n((?:\\s*-\\s*.+\\n?)*)`, "m"));
      if (!m) return [];
      return m[1].split("\n").map(l => l.replace(/^\\s*-\\s*/, "").trim()).filter(Boolean);
    };

    entries.push({
      id: get("id") || file.replace(".md", ""),
      type: (get("type") as any) || "fact",
      domain: get("domain") || "general",
      status: (get("status") as any) || "active",
      title: get("title") || file,
      content: body,
      decision: get("decision"),
      alternatives: getArray("alternatives"),
      rationale: get("rationale"),
      decided_by: get("decided_by"),
      decided_at: get("decided_at"),
      path: file,
    });
  }
  return entries;
}

// 1.0 默认实现：基于字面+决策字段的加权匹配
export class KeywordRetriever implements Retriever {
  retrieve(requirement: string, entries: PlaybookEntry[]): PlaybookEntry[] {
    const req = requirement.toLowerCase();
    // 提取英文单词和中文 2-gram
    const tokens = new Set<string>();
    const latin = req.match(/[a-zA-Z0-9_]+/g) ?? [];
    for (const w of latin) if (w.length > 1) tokens.add(w);
    const cjkRuns = req.match(/[\u4e00-\u9fff]+/g) ?? [];
    for (const run of cjkRuns) {
      for (let i = 0; i + 1 < run.length; i++) tokens.add(run.slice(i, i + 2));
    }

    return entries.filter((e) => {
      if (e.status !== "active") return false;
      
      // 检索范围：标题、正文、领域、决策记录、理由（命中理由也算强关联）
      const searchSpace = [
        e.title, e.content, e.domain, e.decision || "", e.rationale || "",
        ...(e.alternatives || [])
      ].join(" ").toLowerCase();

      return [...tokens].some((t) => searchSpace.includes(t));
    });
  }
}

// 统一生成 Context Pack 的入口
export function getContextPack(requirement: string, retriever: Retriever = new KeywordRetriever()): string {
  const entries = loadPlaybook();
  const relevant = retriever.retrieve(requirement, entries);

  if (relevant.length === 0) return "";

  let prompt = `# 项目架构基座与业务事实（上下文注入）\n\n针对需求：${requirement}\n\n`;
  const facts = relevant.filter((r) => r.type === "fact");
  const stacks = relevant.filter((r) => r.type === "stack");

  const formatEntry = (e: PlaybookEntry) => {
    let text = `### ${e.title}\n`;
    if (e.decision) text += `- **决策 (Decision)**：${e.decision}\n`;
    if (e.rationale) text += `- **理由 (Rationale)**：${e.rationale}\n`;
    if (e.alternatives && e.alternatives.length > 0) {
      text += `- **否决方案 (Alternatives)**：\n${e.alternatives.map(a => `  - ${a}`).join("\n")}\n`;
    }
    if (e.content) text += `\n**详细规约/事实**：\n${e.content}\n`;
    return text;
  };

  if (stacks.length > 0) {
    prompt += `## 技术规约 (Stack)\n`;
    for (const s of stacks) prompt += formatEntry(s) + "\n";
  }
  if (facts.length > 0) {
    prompt += `## 业务事实 (Facts)\n`;
    for (const f of facts) prompt += formatEntry(f) + "\n";
  }
  
  prompt += `> 请在基于上述技术选型、业务事实与决策理由的前提下，完成代码设计与实现，禁止偏离。\n`;
  return prompt;
}
