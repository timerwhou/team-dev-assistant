import "@tda/core/lib/env";
import { runAgent, getContextPack, extractFactsFromCode, getMonorepoRoot } from "@tda/core";
import { recorder, createJsonlReporter, createConsoleReporter } from "@tda/core";
import { executeToolCalls, openAITools, toolsByName } from "@tda/tools";
import { skillsByName, listSkills } from "@tda/skills";
import fs from "node:fs";
import path from "node:path";

recorder.register(createJsonlReporter());
if (process.env.TDA_TRACE_CONSOLE === "1") {
  recorder.register(createConsoleReporter());
}

export function parseSkillArgs(
  argv: string[],
  skill: { parameters: { shape?: Record<string, unknown> } }
): { args: Record<string, unknown>; positional: string[] } {
  const args: Record<string, unknown> = {};
  const positional: string[] = [];
  for (const token of argv) {
    const m = token.match(/^--?([\w-]+)=(.*)$/);
    if (m) {
      args[m[1]] = m[2];
    } else if (token.startsWith("--") || token.startsWith("-")) {
      args[token.replace(/^-+/, "")] = true;
    } else {
      positional.push(token);
    }
  }
  const shape = skill.parameters?.shape ?? {};
  const keys = Object.keys(shape);
  let i = 0;
  for (const key of keys) {
    if (i >= positional.length) break;
    if (args[key] === undefined) {
      args[key] = positional[i++];
    }
  }
  return { args, positional };
}

async function main() {
  const raw = process.argv.slice(2).join(" ").trim();

  // === 拦截 /inject ===
  if (raw.startsWith("/inject ")) {
    const requirement = raw.slice(8).trim();
    const pack = getContextPack(requirement);
    if (!pack) {
      console.log("⚠️ 未找到相关上下文，请确保 docs/playbook 中已沉淀相关资产。");
    } else {
      console.log("\n=== 请复制以下内容发送给外部模型 ===\n");
      console.log(pack);
      console.log("=====================================\n");
    }
    return;
  }

  // === 拦截 /sync-facts ===
  if (raw === "/sync-facts") {
    console.log("正在扫描代码中的 @fact 注释...");
    const root = getMonorepoRoot();
    const facts = await extractFactsFromCode(root);
    
    if (facts.length === 0) {
      console.log("✅ 未发现新的 @fact 注释。");
      return;
    }
    
    const dir = path.resolve(root, "docs/playbook");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let count = 0;
    for (const fact of facts) {
      const fileName = `fact-${Date.now()}-${count}.md`;
      const today = new Date().toISOString().split("T")[0];
      
      // 专业标准：生成的 Markdown 模板必须包含决策与理由字段，与 1.0 Schema 完全对齐
      const content = `---
id: fact-${Date.now()}-${count}
type: fact
domain: ${fact.domain}
status: active
title: 从代码 ${fact.sourceFile} 提取
decision: ${fact.content}
alternatives: []
rationale: 从代码注释中自动捕获的业务约束，请人工复核补充决策上下文
decided_at: ${today}
supersedes: []
---
${fact.content}`;
      
      fs.writeFileSync(path.join(dir, fileName), content);
      count++;
    }
    console.log(`✅ 成功提取并保存 ${count} 条 Fact 到 docs/playbook/。`);
    return;
  }

  // === 常规 Skill 执行 ===
  if (!raw || raw === "/help" || raw === "help") {
    console.log("可用命令：\n" + listSkills());
    console.log("\n附加命令：");
    console.log("  /inject <需求>  提取项目上下文，供外部模型使用");
    console.log("  /sync-facts     扫描代码中的 @fact 注释生成文档");
    return;
  }

  const parts = raw.split(/\s+/);
  const command = parts[0];

  const skillName = command.startsWith("/") ? command.slice(1) : command;
  const skill = skillsByName.get(skillName);

  if (!skill) {
    console.error(`未知命令：${command}\n\n可用命令：\n${listSkills()}`);
    process.exitCode = 2;
    return;
  }

  const unknownTools = skill.tools.filter((t) => !toolsByName.has(t));
  if (unknownTools.length > 0) {
    console.error(`❌ skill "${skill.name}" 声明了未注册的工具：${unknownTools.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const { args, positional } = parseSkillArgs(parts.slice(1), skill as any);

  const parsed = skill.parameters.safeParse(args);
  if (!parsed.success) {
    console.error("参数错误：");
    for (const i of parsed.error.issues) {
      console.error(`  ${i.path.join(".")}: ${i.message}`);
    }
    process.exitCode = 2;
    return;
  }

  const userMessage = skill.buildUserMessage({
    input: positional.join(" "),
    args: parsed.data as Record<string, unknown>,
    cwd: process.cwd(),
  });

  const allowedTools = openAITools.filter(
    (t) => t.type === "function" && skill.tools.includes(t.function.name)
  );

  const verbose = process.env.TDA_VERBOSE !== "0" && args.quiet !== true;

  console.log(`\n🚀 /${skill.name}\n`);
  const answer = await runAgent(skill.system, userMessage, {
    verbose,
    maxSteps: skill.maxSteps,
    tools: allowedTools,
    executeTools: executeToolCalls,
  });
  console.log(`\n${answer}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    recorder.flush().catch((e) => console.error("[trace] flush 失败:", e));
  });
