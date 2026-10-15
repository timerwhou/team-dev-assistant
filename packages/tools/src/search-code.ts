import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { defineTool } from "./registry";

const execAsync = promisify(exec);

type RgJson =
  | { type: "match"; data: { path: { text: string }; line_number: number; lines: { text: string } } }
  | { type: string; data?: unknown };

export const searchCodeTool = defineTool({
  name: "search_code",
  description: "用 ripgrep 在项目内搜索关键词。",
  readOnly: true,
  parameters: z.object({
    query: z.string().describe("搜索关键词，支持正则"),
    glob: z.string().optional().describe("文件过滤，例如 '*.ts'"),
    maxResults: z.number().int().positive().optional().describe("最多返回条数，默认 20"),
  }),
  execute: async ({ query, glob, maxResults = 20 }) => {
    const root = process.env.TDA_ROOT || process.cwd();
    const globArg = glob ? `-g ${JSON.stringify(glob)}` : "";
    const cmd = `rg --json ${globArg} -m ${maxResults} ${JSON.stringify(query)} .`;
    try {
      const { stdout } = await execAsync(cmd, { cwd: root, maxBuffer: 10 * 1024 * 1024 });
      const matches = stdout
        .split("\n")
        .filter(Boolean)
        .map((l): RgJson => JSON.parse(l))
        .filter((j): j is Extract<RgJson, { type: "match" }> => j.type === "match")
        .map((j) => ({ file: j.data.path.text, line: j.data.line_number, text: j.data.lines.text.trim() }));
      return { count: matches.length, matches };
    } catch (e: any) {
      if (e.code === 1) return { count: 0, matches: [] };
      throw new Error(`搜索失败：${e.message}`);
    }
  },
});
