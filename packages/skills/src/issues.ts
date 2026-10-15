import { z } from "zod";
import { defineSkill } from "./types";

export const issuesSkill = defineSkill({
  name: "issues",
  description: "汇总 GitHub 仓库 Issue",
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    state: z.enum(["open", "closed", "all"]).optional(),
    label: z.string().optional(),
  }),
  tools: ["list_issues"],
  maxSteps: 4,
  system: `你是项目管理助手。输出 Markdown：## 概览、## 高优先级、## 其他、## 建议。`,
  buildUserMessage: ({ args }) => {
    const parts = [`请汇总 ${args.owner}/${args.repo} 的 Issue。`];
    if (args.state) parts.push(`状态：${args.state}`);
    if (args.label) parts.push(`标签：${args.label}`);
    return parts.join("\n");
  },
  examples: ["/issues facebook react --state=open --label=bug"],
});
