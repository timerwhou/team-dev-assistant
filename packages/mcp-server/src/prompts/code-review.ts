import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCodeReviewPrompt(server: McpServer) {
  server.registerPrompt(
    "code_review",
    {
      description: "资深代码评审：给出结论、问题清单、评分",
      argsSchema: z.object({
        code: z.string().describe("要评审的代码或文件路径"),
        language: z.string().optional().describe("语言，默认 typescript"),
      }),
    },
    ({ code, language = "typescript" }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `请评审以下 ${language} 代码：\n\n${code}\n\n按以下格式输出：\n## 结论\n一句话总结。\n\n## 问题清单\n| 严重程度 | 位置 | 问题 | 建议 |\n|---|---|---|---|\n\n## 评分\n0-100 分，说明理由。`,
          },
        },
      ],
    })
  );
}
