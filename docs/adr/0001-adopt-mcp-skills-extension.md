# 1. 采用 MCP Skills Extension 分发 Skill

## 背景

早期系统中的 `defineSkill()` 是项目内部私有格式，无法被外部 MCP 客户端发现。2026 年 MCP 发布 SEP-2640 Skills Extension，将 Skill 定义为协议层资源。

## 设计目标

- **协议原生**：让 Skill 能被任何 MCP 客户端（Claude Desktop、Cursor）原生发现。
- **可分发**：支持通过标准 URI（`skill://`）直接读取 Skill 定义与附属文件。
- **向后兼容**：现有的 CLI 消费逻辑不受破坏。

## 架构设计

系统将 Skill 的源文件定义为 `SKILL.md`（包含 YAML frontmatter 和结构化正文），并通过 `@olaservo/ext-skills` 将此目录结构暴露为 MCP Resources。CLI 解析层仍通过 `defineSkill` 投影运行时对象，实现单一数据源。

## 影响评估

- **正向**：打通了 MCP 生态，Skill 成为可复用资产。
- **负向**：引入了 YAML 解析依赖，且目录名必须与 frontmatter 强一致。
