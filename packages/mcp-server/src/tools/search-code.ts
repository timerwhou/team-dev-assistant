import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const execAsync = promisify(exec);

type RgJson =
  | { type: "match"; data: { path: { text: string }; line_number: number; lines: { text: string } } }
  | { type: string; data?: unknown };

export function registerSearchCode(server: McpServer, rootDir: string) {
  server.registerTool(
    "search_code",
    {
      description: "用 ripgrep 在项目内搜索关键词。",
      inputSchema: z.object({
        query: z.string().describe("搜索关键词，支持正则"),
        glob: z.string().optional().describe("文件过滤，例如 '*.ts'"),
        maxResults: z.number().int().positive().optional().describe("最多返回条数，默认 20"),
      }),
    },
    async ({ query, glob, maxResults = 20 }) => {
      const globArg = glob ? `-g ${JSON.stringify(glob)}` : "";
      const cmd = `rg --json ${globArg} -m ${maxResults} ${JSON.stringify(query)} .`;
      try {
        const { stdout } = await execAsync(cmd, { cwd: rootDir, maxBuffer: 10 * 1024 * 1024 });
        const matches = stdout
          .split("\n")
          .filter(Boolean)
          .map((l): RgJson => JSON.parse(l))
          .filter((j): j is Extract<RgJson, { type: "match" }> => j.type === "match")
          .map((j) => ({
            file: j.data.path.text,
            line: j.data.line_number,
            text: j.data.lines.text.trim(),
          }));
        if (matches.length === 0) {
          return { content: [{ type: "text", text: `未找到匹配：${query}` }] };
        }
        const text = matches.map((m) => `${m.file}:${m.line}: ${m.text}`).join("\n");
        return { content: [{ type: "text", text }] };
      } catch (e: any) {
        if (e.code === 1) return { content: [{ type: "text", text: `未找到匹配：${query}` }] };
        return { content: [{ type: "text", text: `搜索失败：${e.message}` }], isError: true };
      }
    }
  );
}
