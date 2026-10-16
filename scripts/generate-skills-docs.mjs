#!/usr/bin/env node
// 从 packages/skills/skills/<name>/SKILL.md 生成 VitePress 页面
//
// 输入: packages/skills/skills/<name>/SKILL.md
// 输出: docs/site/skills/<name>.md
// 副作用: 更新 docs/site/skills/index.md 和 _sidebar.json
//
// 每次 pnpm docs:build / docs:dev 前运行

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SKILLS_SRC = path.join(repoRoot, "packages/skills/skills");
const DOCS_DEST = path.join(repoRoot, "docs/site/skills");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(msg) {
  console.log(`[skills-docs] ${msg}`);
}

function main() {
  if (!fs.existsSync(SKILLS_SRC)) {
    console.error(`[skills-docs] 源目录不存在: ${SKILLS_SRC}`);
    process.exit(1);
  }

  ensureDir(DOCS_DEST);

  const skillDirs = fs
    .readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const generated = [];

  for (const skillDir of skillDirs) {
    const skillFile = path.join(SKILLS_SRC, skillDir, "SKILL.md");
    if (!fs.existsSync(skillFile)) {
      log(`跳过 ${skillDir}: 无 SKILL.md`);
      continue;
    }

    const raw = fs.readFileSync(skillFile, "utf-8");
    const { data, content } = matter(raw);

    const name = data.name || skillDir;
    const description = data.description || "";
    const tools = data.tools || [];
    const maxSteps = data.maxSteps || "";

    const lines = [];
    lines.push("---");
    lines.push(`title: ${name}`);
    lines.push(`description: ${description}`);
    lines.push("---");
    lines.push("");
    lines.push(`# ${name}`);
    lines.push("");
    lines.push(`> ${description}`);
    lines.push("");
    lines.push("| 属性 | 值 |");
    lines.push("|---|---|");
    lines.push(`| name | \`${name}\` |`);
    lines.push(
      `| tools | ${tools.map((t) => `\`${t}\``).join(", ") || "（无）"} |`
    );
    lines.push(`| maxSteps | ${maxSteps} |`);
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push(content.trim());
    lines.push("");

    const refDir = path.join(SKILLS_SRC, skillDir, "references");
    if (fs.existsSync(refDir)) {
      const refs = fs.readdirSync(refDir).filter((f) => !f.startsWith("."));
      if (refs.length > 0) {
        lines.push("## 支持文件");
        lines.push("");
        for (const ref of refs) {
          lines.push(
            `- [\`${ref}\`](https://github.com/timerwhou/team-dev-assistant/blob/main/packages/skills/skills/${skillDir}/references/${ref})`
          );
        }
        lines.push("");
      }
    }

    const outFile = path.join(DOCS_DEST, `${skillDir}.md`);
    fs.writeFileSync(outFile, lines.join("\n"));
    log(`生成 ${path.relative(repoRoot, outFile)}`);
    generated.push({ dir: skillDir, name, description });
  }

  // 索引页
  const indexLines = [];
  indexLines.push("# Skills");
  indexLines.push("");
  indexLines.push(
    "项目提供的所有 AI Skill。每个 Skill 定义在 `packages/skills/skills/<name>/SKILL.md`。"
  );
  indexLines.push("");
  indexLines.push("| Skill | 说明 |");
  indexLines.push("|---|---|");
  for (const g of generated) {
    indexLines.push(`| [/${g.name}](/skills/${g.dir}) | ${g.description} |`);
  }
  indexLines.push("");
  indexLines.push("## 使用方式");
  indexLines.push("");
  indexLines.push("### CLI");
  indexLines.push("");
  indexLines.push("```bash");
  for (const g of generated) {
    indexLines.push(`pnpm dev "/${g.name} <参数>"`);
  }
  indexLines.push("```");
  indexLines.push("");
  indexLines.push("### MCP 客户端（v0.3.0 起）");
  indexLines.push("");
  indexLines.push(
    "v0.3.0 升级到 MCP v2 后，Skill 会作为协议层资源暴露，Claude Desktop / Cursor 可原生发现。"
  );
  indexLines.push("");

  const indexFile = path.join(DOCS_DEST, "index.md");
  fs.writeFileSync(indexFile, indexLines.join("\n"));
  log(`生成 ${path.relative(repoRoot, indexFile)}`);

  // sidebar 数据
  const sidebarData = {
    skills: [
      { text: "总览", link: "/skills/" },
      ...generated.map((g) => ({ text: g.name, link: `/skills/${g.dir}` })),
    ],
  };
  const dataFile = path.join(DOCS_DEST, "_sidebar.json");
  fs.writeFileSync(dataFile, JSON.stringify(sidebarData, null, 2));
  log(`生成 ${path.relative(repoRoot, dataFile)}`);

  log(`完成: ${generated.length} 个 Skill`);
}

main();
