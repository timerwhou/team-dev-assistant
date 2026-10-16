import fs from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/server";

const IGNORE = new Set(["node_modules", ".git", "dist", ".next"]);

async function walk(dir: string, root: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) await walk(abs, root, acc);
    else acc.push(path.relative(root, abs));
  }
  return acc;
}

export function registerProjectFilesResource(server: McpServer, rootDir: string) {
  server.registerResource(
    "project-files",
    "project://files",
    {
      title: "Project Files",
      description: "项目文件索引",
      mimeType: "application/json",
    },
    async (uri) => {
      const files = await walk(rootDir, rootDir);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(files, null, 2),
          },
        ],
      };
    }
  );
}
