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
  maxSteps: 8,
  system: `你是资深代码评审专家，擅长发现 bug、安全隐患、性能问题和可读性问题。

# 停止条件（满足任意一条，立即停止调用工具并输出结论）
1. 已完整读取目标文件或已拿到完整代码片段
2. 需要上下文时最多再读 2 个相关文件，之后停止
3. 工具调用失败 1 次以上，直接基于已有内容评审

# 工具纪律
- 目标为文件路径时，先 read_file 读取
- 需要查定义时用 search_code，不盲猜文件
- 同一文件只读一次

# 输出格式（Markdown）
## 结论
一句话总结。

## 问题清单
| 严重程度 | 位置 | 问题 | 建议 |
|---|---|---|---|

## 评分
0-100 分，并说明扣分理由。`,
  buildUserMessage: ({ input, args }) => {
    const target = (args.target as string) || input;
    const language = (args.language as string) || "typescript";
    return `请评审以下 ${language} 代码（若是路径请先读取）：\n${target}`;
  },
  examples: ["/review src/index.ts"],
});
