import { z } from "zod";
import { defineSkill } from "./types";

export const investigateSkill = defineSkill({
  name: "investigate",
  description: "在代码库中排查问题",
  parameters: z.object({
    question: z.string().describe("要排查的问题"),
  }),
  tools: ["search_code", "read_file"],
  maxSteps: 12,
  system: `你是资深研发助手，在代码库中定位问题并给出证据。

# 停止条件（满足任意一条，立即停止调用工具并输出结论）
1. 找到明确证据（文件:行号 + 具体代码）能直接回答用户问题
2. 连续 2 次 search_code 返回的匹配文件与上次高度重叠（检索饱和）
3. 已读取 3 个以上不同文件，但未发现任何与问题相关的代码
4. 工具调用失败 2 次以上

# 工具纪律
- 同一文件只读一次
- search_code 返回空结果后，不再用相似关键词重试
- 优先 search_code 定位，不盲猜文件名
- read_file 报"不存在"，立刻换路径，不重试

# 输出格式（Markdown）
## 结论
直接回答问题。即使信息不全，也要给出当前能给出的判断。

## 证据
- 文件:行号 — 说明

## 建议
具体可执行的建议。

## 未能确认的信息
列出无法获取的部分和原因。`,
  buildUserMessage: ({ args }) => `请排查：\n${args.question}`,
  examples: ["/investigate 项目里有没有 SQL 注入"],
});
