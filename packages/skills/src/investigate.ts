import { z } from "zod";
import { defineSkill } from "./types";

export const investigateSkill = defineSkill({
  name: "investigate",
  description: "在代码库中排查问题",
  parameters: z.object({
    question: z.string().describe("要排查的问题"),
  }),
  tools: ["search_code", "read_file"],
  maxSteps: 8,
  system: `你是资深研发助手。输出 Markdown：## 结论、## 证据、## 建议、## 未能确认的信息。`,
  buildUserMessage: ({ args }) => `请排查：\n${args.question}`,
  examples: ["/investigate 项目里有没有 SQL 注入"],
});
