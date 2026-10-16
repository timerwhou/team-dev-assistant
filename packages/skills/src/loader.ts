import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** SKILL.md 的 frontmatter 结构 */
export type SkillFrontmatter = {
  name: string;
  description: string;
  tools: string[];
  maxSteps: number;
  examples?: string[];
};

/** 解析后的 SKILL.md */
export type LoadedSkill = {
  /** frontmatter 字段 */
  frontmatter: SkillFrontmatter;
  /** Markdown 正文（去掉 frontmatter） */
  body: string;
  /** 关联的 references 文件列表（相对 skill 目录） */
  references: string[];
  /** SKILL.md 的绝对路径 */
  filePath: string;
  /** skill 目录的绝对路径 */
  dirPath: string;
};

/** 扫描 `packages/skills/skills/` 下的所有 SKILL.md */
export function scanSkills(): LoadedSkill[] {
  const skillsRoot = path.resolve(__dirname, "../skills");

  if (!fs.existsSync(skillsRoot)) {
    throw new Error(
      `Skills 目录不存在：${skillsRoot}。请确认 packages/skills/skills/ 已创建。`
    );
  }

  const dirs = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  return dirs.map((dir) => loadSkill(path.join(skillsRoot, dir)));
}

/** 加载单个 skill 目录 */
export function loadSkill(dirPath: string): LoadedSkill {
  const skillFile = path.join(dirPath, "SKILL.md");

  if (!fs.existsSync(skillFile)) {
    throw new Error(`SKILL.md 不存在：${skillFile}`);
  }

  const raw = fs.readFileSync(skillFile, "utf-8");
  const parsed = matter(raw);

  const fm = parsed.data as Partial<SkillFrontmatter>;
  if (!fm.name || typeof fm.name !== "string") {
    throw new Error(`${skillFile} 缺少有效的 name 字段`);
  }
  if (!fm.description || typeof fm.description !== "string") {
    throw new Error(`${skillFile} 缺少有效的 description 字段`);
  }
  if (!Array.isArray(fm.tools) || fm.tools.length === 0) {
    throw new Error(`${skillFile} 缺少 tools 字段（应为非空数组）`);
  }
  if (typeof fm.maxSteps !== "number" || fm.maxSteps <= 0) {
    throw new Error(`${skillFile} 缺少有效的 maxSteps（应为正整数）`);
  }

  const referencesDir = path.join(dirPath, "references");
  const references = fs.existsSync(referencesDir)
    ? fs
        .readdirSync(referencesDir, { withFileTypes: true })
        .filter((f) => f.isFile())
        .map((f) => f.name)
    : [];

  return {
    frontmatter: fm as SkillFrontmatter,
    body: parsed.content.trim(),
    references,
    filePath: skillFile,
    dirPath,
  };
}

/** 按 name 查找 skill */
export function findSkillByName(name: string): LoadedSkill | undefined {
  return scanSkills().find((s) => s.frontmatter.name === name);
}
