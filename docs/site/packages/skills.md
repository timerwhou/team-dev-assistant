# @tda/skills

Skill 系统：声明式的 Prompt + 工具白名单 + 步数配置。

## 已注册 Skill

| Skill | 用途 | 工具 | 最大步数 |
|---|---|---|---|
| `review` | 代码评审 | read_file, search_code | 8 |
| `investigate` | 问题排查 | search_code, read_file | 12 |
| `issues` | Issue 汇总 | list_issues | 4 |

## 定义新 Skill

```ts
import { defineSkill } from "@tda/skills";
import { z } from "zod";

export const refactorSkill = defineSkill({
  name: "refactor",
  description: "重构指定文件",
  parameters: z.object({
    target: z.string().describe("文件路径"),
  }),
  tools: ["read_file", "search_code"],
  maxSteps: 6,
  system: `你是资深重构专家。
输出 Markdown：## 目标、## 步骤、## 风险、## 收益。`,
  buildUserMessage: ({ args }) => `请重构：${args.target}`,
  examples: ["/refactor apps/cli/src/index.ts"],
});
```

在 `packages/skills/src/registry.ts` 注册后，CLI 就能用 `/refactor` 调用。
