import { z } from "zod";
import { defineSkill } from "./types";
import { findSkillByName } from "./loader";

const loaded = findSkillByName("investigate");
if (!loaded) {
  throw new Error("未找到 investigate skill 的 SKILL.md");
}

export const investigateSkill = defineSkill({
  name: loaded.frontmatter.name,
  description: loaded.frontmatter.description,
  parameters: z.object({
    question: z.string().describe("要排查的问题"),
  }),
  tools: loaded.frontmatter.tools,
  maxSteps: loaded.frontmatter.maxSteps,
  system: loaded.body,
  buildUserMessage: ({ args }) => `请排查：\n${args.question}`,
  examples: loaded.frontmatter.examples,
});
