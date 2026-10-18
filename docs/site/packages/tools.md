# @tda/tools

工具集：`read_file` / `search_code` / `list_issues`。

## 安全与容错机制

- **防路径穿越**：`read_file` 使用 `path.relative` 校验，拒绝 `..` 逃逸。
- **自动降级**：`search_code` 优先使用 `ripgrep`（如果系统已安装），否则自动降级到系统的 `grep`。
- **Zod 校验**：所有工具的入参均受 Zod Schema 严格约束。

## 定义新工具

```ts
import { defineTool } from "@tda/tools";
import { z } from "zod";

export const myTool = defineTool({
  name: "my_tool",
  description: "工具用途",
  readOnly: true,
  parameters: z.object({
    input: z.string().describe("参数说明"),
  }),
  execute: async ({ input }) => {
    return { result: input };
  },
});
```
