import fs from "node:fs/promises";
import path from "node:path";

const FACT_REGEX = /^\s*(?:\/\/|#|--|\/\*|<!--)\s*@fact\s*(?:\[(.*?)\])?\s*(.*?)(?:\*\/|-->)?$/;

const SUPPORTED_EXTS = [
  ".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte", 
  ".php", ".go", ".rs", ".java", ".py", ".sql"
];

const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next"];

export interface ExtractedFact {
  domain: string;
  content: string;
  sourceFile: string;
}

export async function extractFactsFromCode(dir: string): Promise<ExtractedFact[]> {
  const facts: ExtractedFact[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (SUPPORTED_EXTS.some(ext => entry.name.endsWith(ext))) {
        const content = await fs.readFile(fullPath, "utf-8");
        const lines = content.split("\n");
        
        for (const line of lines) {
          const match = line.match(FACT_REGEX);
          if (match) {
            facts.push({
              domain: match[1] || "general",
              content: match[2].trim(),
              sourceFile: path.relative(dir, fullPath),
            });
          }
        }
      }
    }
  }

  await walk(dir);
  return facts;
}
