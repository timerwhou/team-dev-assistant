# Skill 迁移设计文档

> 关联：ADR-0001 · Epic #13 · Story #14 #15 #16

## 1. 现状

### 1.1 当前 Skill 定义（私有格式）

`packages/skills/src/review.ts`：

```ts
export const reviewSkill = defineSkill({
  name: "review",
  description: "评审指定文件或代码片段",
  parameters: z.object({
    target: z.string(),
    language: z.string().optional(),
  }),
  tools: ["read_file", "search_code"],
  maxSteps: 8,
  system: `你是资深代码评审专家...`,
  buildUserMessage: ({ input, args }) => `请评审以下 ${args.language || "typescript"} 代码：\n${args.target}`,
  examples: ["/review src/index.ts"],
});
```

### 1.2 当前消费路径

```
packages/skills/src/review.ts
    ↓ (registry.ts)
skillsByName.get("review")
    ↓ (apps/cli/src/index.ts)
runAgent(skill.system, userMessage, { tools, executeTools })
```

只有 `apps/cli` 能消费。

### 1.3 问题

- MCP 客户端（Claude Desktop、Cursor）**看不到** Skill
- Skill 内容（Prompt、示例、检查清单）混在 TypeScript 里，**不可独立引用**
- 里程碑二的 Context Engineering **无法复用** Skill 元数据

## 2. 目标

### 2.1 目录结构（SEP-2640 兼容）

```
packages/skills/
├── skills/                       ← 新增：Skill 源文件目录
│   ├── code-review/
│   │   ├── SKILL.md              ← 主定义
│   │   └── references/
│   │       └── checklist.md      ← 可选：支持文件
│   ├── investigate/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── evidence-template.md
│   └── issue-triage/
│       └── SKILL.md
├── src/
│   ├── loader.ts                 ← 新增：从 SKILL.md 加载
│   ├── review.ts                 ← 保留：defineSkill 投影
│   ├── investigate.ts
│   ├── issues.ts
│   ├── registry.ts
│   └── types.ts
└── package.json
```

### 2.2 SKILL.md 格式

```markdown
---
name: code-review
description: 评审指定文件或代码片段，输出结构化问题清单
---

# Code Review

## When to use

- 用户请求"评审这段代码" / "review this file"
- 代码提交前的自动审查
- 需要发现 bug、安全隐患、性能问题、可读性问题

## Workflow

1. 如果 target 是文件路径，用 `read_file` 读取
2. 如果是代码片段，直接评审
3. 需要上下文时用 `search_code` 查找相关定义
4. 通读后逐项检查：正确性、边界、安全、性能、可读性

## Output format

### 结论
一句话总结。

### 问题清单
| 严重程度 | 位置 | 问题 | 建议 |
|---|---|---|---|

### 评分
0-100 分，说明扣分理由。

## Examples

**Input**: `function add(a, b) { return a + b; }`
**Output**: 结论：函数正确，缺少类型标注；评分：85

参见 `references/checklist.md` 获取完整评审清单。
```

### 2.3 MCP 协议暴露

```
skills/list      → 返回所有 Skill 的 { name, description, uri }
skills/get       → 传入 skill://<name>/<path>，返回文件内容
```

URI 约定：

- `skill://code-review/SKILL.md` — 主定义
- `skill://code-review/references/checklist.md` — 支持文件

## 3. 迁移步骤

### PR 1（Story #14）：目录结构

- 新建 `packages/skills/skills/` 目录
- 为每个 Skill 写 `SKILL.md`
- 保留 `packages/skills/src/*.ts` 作为**运行时投影**（从 SKILL.md 读取）
- 验证：`pnpm -r --no-bail typecheck` 和 `pnpm --filter @tda/cli dev /help` 通过

### PR 2（Story #15）：MCP Server 集成

- `packages/mcp-server/src/index.ts` 注册 `skills/list` 和 `skills/get`
- capabilities 声明 `io.modelcontextprotocol/skills`
- 验证：MCP Inspector 能列出 3 个 Skill

### PR 3（Story #16）：文档站聚合

- `docs/site/.vitepress/config.mts` 动态扫描 `packages/skills/skills/`
- 为每个 Skill 生成 VitePress 页面
- 验证：文档站出现 `/skills/code-review` 页面

## 4. 兼容性策略

| 层 | 现状 | 迁移后 |
|---|---|---|
| **源文件** | TypeScript 内联 | `SKILL.md` |
| **运行时消费** | `skillsByName.get("review")` | 不变（加载器负责从 SKILL.md 构建对象） |
| **CLI 参数** | `/review src/index.ts` | 不变 |
| **工具白名单** | `skill.tools` | 不变（从 frontmatter 或映射表读取） |

**关键原则**：`defineSkill` API 保持不变，只是数据源从 TypeScript 内联改为从 `SKILL.md` 加载。

## 5. 验证方法

### 5.1 单元测试

- `packages/skills/test/loader.test.ts`：测试 SKILL.md 解析
- 断言 frontmatter 字段正确解析、正文保持完整

### 5.2 集成测试

- `packages/mcp-server/test/skills.test.ts`：测试 `skills/list` 和 `skills/get`
- 断言返回内容与 SKILL.md 一致

### 5.3 回归测试

- 现有 `pnpm eval` 全部通过
- `pnpm --filter @tda/cli dev /review src/index.ts` 输出与迁移前一致

### 5.4 手动验证

```bash
npx @modelcontextprotocol/inspector npx tsx packages/mcp-server/src/index.ts
# 期望：Skills 标签下显示 3 个 Skill，点击能读取内容
```

## 6. 风险和缓解

| 风险 | 缓解 |
|---|---|
| YAML frontmatter 解析失败 | 用成熟的 `gray-matter` 库；测试覆盖异常输入 |
| SKILL.md 与 TypeScript 定义漂移 | SKILL.md 作为唯一源；TypeScript 只做投影 |
| 现有 CLI 破坏 | 迁移前先写回归测试；PR 1 单独可回滚 |
| MCP Inspector 不支持 Skills Extension | 提供 curl 测试脚本作为备选验证 |

## 7. 参考

- ADR-0001：`docs/adr/0001-adopt-mcp-skills-extension.md`
- MCP SEP-2640 规范
- Epic #13
