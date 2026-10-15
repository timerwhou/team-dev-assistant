import { z } from "zod";
import { defineSkill } from "./types";

export const reviewSkill = defineSkill({
  name: "review",
  description: "评审指定文件或代码片段",
  parameters: z.object({
    target: z.string().describe("文件路径或代码片段"),
    language: z.string().optional().describe("语言，默认 typescript"),
  }),
  tools: ["read_file", "search_code"],
  maxSteps: 6,
  system: `你是资深代码评审专家。输出 Markdown：## 结论、## 问题清单（表格）、## 评分（0-100）。`,
  buildUserMessage: ({ input, args }) => {
    const target = (args.target as string) || input;
    const language = (args.language as string) || "typescript";
    return `请评审以下 ${language} 代码：\n${target}`;
  },
  examples: ["/review src/index.ts"],
});
