import { z } from "zod";
import { defineSkill } from "./types";
import { findSkillByName } from "./loader";

const loaded = findSkillByName("issues");
if (!loaded) {
  throw new Error("未找到 issues skill 的 SKILL.md");
}

export const issuesSkill = defineSkill({
  name: loaded.frontmatter.name,
  description: loaded.frontmatter.description,
  parameters: z.object({
    owner: z.string().optional().describe("仓库所有者，省略时从 git remote 推导"),
    repo: z.string().optional().describe("仓库名，省略时从 git remote 推导"),
    state: z.enum(["open", "closed", "all"]).optional(),
    label: z.string().optional(),
  }),
  tools: loaded.frontmatter.tools,
  maxSteps: loaded.frontmatter.maxSteps,
  system: loaded.body,
  buildUserMessage: ({ args }) => {
    const parts = [`请汇总 Issue 列表。`];
    if (args.owner && args.repo) parts.push(`仓库：${args.owner}/${args.repo}`);
    if (args.state) parts.push(`状态：${args.state}`);
    if (args.label) parts.push(`标签：${args.label}`);
    return parts.join("\n");
  },
  examples: loaded.frontmatter.examples,
});
