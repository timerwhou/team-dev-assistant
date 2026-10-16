import { z } from "zod";
import { defineSkill } from "./types";
import { findSkillByName } from "./loader";

const loaded = findSkillByName("review");
if (!loaded) {
  throw new Error("未找到 review skill 的 SKILL.md");
}

export const reviewSkill = defineSkill({
  name: loaded.frontmatter.name,
  description: loaded.frontmatter.description,
  parameters: z.object({
    target: z.string().describe("文件路径或代码片段"),
    language: z.string().optional().describe("语言，默认 typescript"),
  }),
  tools: loaded.frontmatter.tools,
  maxSteps: loaded.frontmatter.maxSteps,
  system: loaded.body,
  buildUserMessage: ({ input, args }) => {
    const target = (args.target as string) || input;
    const language = (args.language as string) || "typescript";
    return `请评审以下 ${language} 代码（若是路径请先读取）：\n${target}`;
  },
  examples: loaded.frontmatter.examples,
});
