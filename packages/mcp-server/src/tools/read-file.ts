import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerReadFile(server: McpServer, rootDir: string) {
  server.registerTool(
    "read_file",
    {
      description: "读取项目内的文本文件。只允许读取项目根目录下的文件。",
      inputSchema: z.object({
        path: z.string().describe("相对项目根目录的文件路径"),
        maxLines: z.number().int().positive().optional().describe("最多读取行数，默认 200"),
      }),
    },
    async ({ path: p, maxLines = 200 }) => {
      const abs = path.resolve(rootDir, p);
      if (!abs.startsWith(rootDir)) {
        return { content: [{ type: "text", text: "越权：只能读取项目内文件" }], isError: true };
      }
      try {
        const content = await fs.readFile(abs, "utf-8");
        const lines = content.split("\n").slice(0, maxLines);
        return {
          content: [
            {
              type: "text",
              text: `文件：${p}\n总行数：${content.split("\n").length}\n---\n${lines.join("\n")}`,
            },
          ],
        };
      } catch (e: any) {
        if (e.code === "ENOENT") {
          return { content: [{ type: "text", text: `文件不存在：${p}` }], isError: true };
        }
        throw e;
      }
    }
  );
}
