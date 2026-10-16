import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { searchCode } from "@tda/core";

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
      try {
        const result = await searchCode({ query, glob, maxResults, cwd: rootDir });
        if (result.count === 0) {
          return { content: [{ type: "text", text: `未找到匹配：${query}` }] };
        }
        const text = result.matches
          .map((m) => `${m.file}:${m.line}: ${m.text}`)
          .join("\n");
        return { content: [{ type: "text", text }] };
      } catch (e: any) {
        return {
          content: [{ type: "text", text: e.message }],
          isError: true,
        };
      }
    }
  );
}
