# @tda/skills

Skill 系统：声明式的 Prompt + 工具白名单 + 步数配置。

## 已注册 Skill

| Skill | 用途 | 工具 | 最大步数 |
|---|---|---|---|
| `review` | 代码评审 | read_file, search_code | 8 |
| `investigate` | 问题排查 | search_code, read_file | 12 |
| `issues` | Issue 汇总 | list_issues | 4 |

## 目录结构（SEP-2640 兼容）

```text
packages/skills/skills/
├── review/
│   ├── SKILL.md
│   └── references/
└── investigate/
    ├── SKILL.md
    └── references/
```
*注意：SEP-2640 要求目录名必须等于 frontmatter 的 `name`。*
