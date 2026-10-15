import { z } from "zod";
import { defineSkill } from "./types";

export const issuesSkill = defineSkill({
  name: "issues",
  description: "汇总 GitHub 仓库 Issue（owner/repo 可省略，自动从 git remote 推导）",
  parameters: z.object({
    owner: z.string().optional().describe("仓库所有者，省略时从 git remote 推导"),
    repo: z.string().optional().describe("仓库名，省略时从 git remote 推导"),
    state: z.enum(["open", "closed", "all"]).optional(),
    label: z.string().optional(),
  }),
  tools: ["list_issues"],
  maxSteps: 4,
  system: `你是项目管理助手，负责汇总和分类 Issue。

# 停止条件
- 已获取 Issue 列表后立即输出结论，不再调用工具

# 输出格式（Markdown）
## 概览
总数、仓库名、按状态分布。

## 高优先级
带 high / bug 标签的 Issue。

## 其他
按标签分组。

## 建议
下一步该优先处理哪些。`,
  buildUserMessage: ({ args }) => {
    const parts = [`请汇总 Issue 列表。`];
    if (args.owner && args.repo) parts.push(`仓库：${args.owner}/${args.repo}`);
    if (args.state) parts.push(`状态：${args.state}`);
    if (args.label) parts.push(`标签：${args.label}`);
    return parts.join("\n");
  },
  examples: [
    "/issues --state=open",
    "/issues facebook react --state=open --label=bug",
  ],
});
