import { z } from "zod";
import { searchCode } from "@tda/core";
import { defineTool } from "./registry";

export const searchCodeTool = defineTool({
  name: "search_code",
  description: "用 ripgrep 在 monorepo 内搜索关键词。",
  readOnly: true,
  parameters: z.object({
    query: z.string().describe("搜索关键词，支持正则"),
    glob: z.string().optional().describe("文件过滤，例如 '*.ts'"),
    maxResults: z.number().int().positive().optional().describe("最多返回条数，默认 20"),
  }),
  execute: async ({ query, glob, maxResults }) => {
    return searchCode({ query, glob, maxResults });
  },
});
