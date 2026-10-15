import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getMonorepoRoot } from "@tda/core";
import { defineTool } from "./registry";

export const readFileTool = defineTool({
  name: "read_file",
  description: "读取项目内的文本文件。只允许读取 monorepo 根目录下的文件。",
  readOnly: true,
  parameters: z.object({
    path: z.string().describe("相对 monorepo 根目录的文件路径，例如 apps/cli/src/index.ts"),
    maxLines: z.number().int().positive().optional().describe("最多读取行数，默认 200"),
  }),
  execute: async ({ path: p, maxLines = 200 }) => {
    const root = process.env.TDA_ROOT || getMonorepoRoot();
    const abs = path.resolve(root, p);
    if (!abs.startsWith(root)) throw new Error(`越权：只能读取 ${root} 下的文件`);
    try {
      const content = await fs.readFile(abs, "utf-8");
      const lines = content.split("\n").slice(0, maxLines);
      return { path: p, totalLines: content.split("\n").length, content: lines.join("\n") };
    } catch (e: any) {
      if (e.code === "ENOENT") {
        throw new Error(`文件不存在：${p}。请先用 search_code 确认路径。`);
      }
      throw e;
    }
  },
});
