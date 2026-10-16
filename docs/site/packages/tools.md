# @tda/tools

工具集：`read_file` / `search_code` / `list_issues`。

## 已注册工具

### `read_file`

读取 monorepo 内的文本文件。

**参数**：
- `path` (string) — 相对 monorepo 根目录的文件路径
- `maxLines` (number, 可选) — 最多读取行数，默认 200

**安全**：`assertInsideRoot` 防止路径穿越。

### `search_code`

用 ripgrep 在 monorepo 内搜索关键词。

**参数**：
- `query` (string) — 搜索关键词，支持正则
- `glob` (string, 可选) — 文件过滤，例如 `*.ts`
- `maxResults` (number, 可选) — 最多返回条数，默认 20

**安全**：`execFile` + 参数数组，不走 shell，杜绝命令注入。

### `list_issues`

查询 GitHub 仓库的 Issue 列表。

**参数**：
- `owner` / `repo` (string, 可选) — 省略时从 `git remote` 自动推导
- `state` (enum, 可选) — `open` / `closed` / `all`
- `label` (string, 可选)
- `limit` (number, 可选)

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

在 `packages/tools/src/index.ts` 注册后，Agent 就能调用。
