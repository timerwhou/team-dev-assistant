import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "../lib/env";
import type { PlaybookEntry, Retriever } from "./types";
import { BM25Retriever, AsyncHybridRetriever } from "./retriever";

/**
 * 加载 Playbook 规约。
 * @param customDir 可选：多租户隔离目录。如果不传，默认加载根目录的 docs/playbook
 */
export function loadPlaybook(customDir?: string): PlaybookEntry[] {
  // 🌟 兼容多租户：如果传了 customDir，则去该目录找 playbook 子目录；否则默认找 docs/playbook
  const targetDir = customDir 
    ? path.join(customDir, "docs/playbook") 
    : path.join(getMonorepoRoot(), "docs/playbook");

  if (!fs.existsSync(targetDir)) return [];
  
  const entries: PlaybookEntry[] = [];
  const files = fs.readdirSync(targetDir).filter(f => f.endsWith(".md") && f !== "README.md");

  for (const file of files) {
    const filePath = path.join(targetDir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;

    const yaml = match[1];
    const body = match[2].trim();
    const get = (key: string) => {
      const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
      return m ? m[1].trim() : "";
    };

    const getArray = (key: string) => {
      const m = yaml.match(new RegExp(`^${key}:\\s*\\n((?:\\s*-\\s*.+\\n?)*)`, "m"));
      if (!m) return [];
      return m[1].split("\n").map(l => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
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
      supersedes: getArray("supersedes"),
      relates_to: getArray("relates_to"),
      depends_on: getArray("depends_on"),
      path: file,
    });
  }
  return entries;
}

/**
 * 上下文图谱 1-hop 遍历（v1.3.0）
 * 给定初始命中的条目，自动沿着 relates_to 和 depends_on 扩展检索
 */
export function expandContextGraph(
  initialEntries: PlaybookEntry[],
  allEntries: PlaybookEntry[]
): PlaybookEntry[] {
  const expanded = new Map(initialEntries.map(e => [e.id, e]));
  
  for (const entry of initialEntries) {
    const relatedIds = [...(entry.relates_to || []), ...(entry.depends_on || [])];
    for (const relId of relatedIds) {
      const relatedEntry = allEntries.find(e => e.id === relId && e.status === "active");
      if (relatedEntry) {
        expanded.set(relatedEntry.id, relatedEntry);
      }
    }
  }
  
  return Array.from(expanded.values());
}

// 提取公共的 Prompt 格式化逻辑
function formatContextPrompt(requirement: string, relevant: PlaybookEntry[]): string {
  if (relevant.length === 0) return "";

  let prompt = `# 项目架构基座与业务事实（上下文注入）\n\n针对需求：${requirement}\n\n`;
  const facts = relevant.filter((r: PlaybookEntry) => r.type === "fact");
  const stacks = relevant.filter((r: PlaybookEntry) => r.type === "stack");

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

// 1.0 同步入口（兼容现有 MCP / 纯本地场景）
export function getContextPack(requirement: string, retriever?: Retriever, customDir?: string): string {
  const entries = loadPlaybook(customDir);
  const activeRetriever = retriever || new BM25Retriever();
  let relevant = activeRetriever.retrieve(requirement, entries);
  // v1.3.0: 触发图谱扩展
  relevant = expandContextGraph(relevant, entries);
  return formatContextPrompt(requirement, relevant);
}

// 1.1 异步入口（支持语义检索，供 CLI /inject 等场景使用）
export async function getContextPackAsync(requirement: string, customDir?: string): Promise<string> {
  const entries = loadPlaybook(customDir);
  const hybridRetriever = new AsyncHybridRetriever();
  let relevant = await hybridRetriever.retrieveAsync(requirement, entries);
  // v1.3.0: 触发图谱扩展
  relevant = expandContextGraph(relevant, entries);
  return formatContextPrompt(requirement, relevant);
}
