import { z } from "zod";
import { searchCode } from "../../index"; // 假设 searchCode 仍从原位置导出
import type { CapabilityPack } from "../types";

export const searchCodeCapability: CapabilityPack = {
  metadata: {
    id: "native:search_code",
    name: "search_code",
    kind: "tool",
    version: "1.0.0",
    description: "用 ripgrep 在项目内搜索关键词。",
    stage: "context-gathering", // 属于上下文收集阶段
    sideEffects: ["read"],
  },
  inputSchema: z.object({
    query: z.string().describe("搜索关键词，支持正则"),
    glob: z.string().optional().describe("文件过滤，例如 '*.ts'"),
    maxResults: z.number().int().positive().optional().describe("最多返回条数，默认 20"),
  }),
  async execute({ query, glob, maxResults = 20 }, context) {
    try {
      const result = await searchCode({ query, glob, maxResults, cwd: context.rootDir });
      if (result.count === 0) {
        return { content: [{ type: "text", text: `未找到匹配：${query}` }] };
      }
      const text = result.matches
        .map((m) => `${m.file}:${m.line}: ${m.text}`)
        .join("\n");
      return { content: [{ type: "text", text }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: e.message }], isError: true };
    }
  },
};
