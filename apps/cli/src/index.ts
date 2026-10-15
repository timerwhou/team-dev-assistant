import "@tda/core/lib/env";
import { runAgent } from "@tda/core";
import { recorder, createJsonlReporter, createConsoleReporter } from "@tda/core";
import { executeToolCalls, openAITools, toolsByName } from "@tda/tools";
import { skillsByName, listSkills } from "@tda/skills";

recorder.register(createJsonlReporter());
if (process.env.TDA_TRACE_CONSOLE === "1") {
  recorder.register(createConsoleReporter());
}

/** 纯函数：解析 CLI 参数 */
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
  // 兼容三种传参：
  //   1. pnpm dev "/review foo.ts"          → 整串在 argv[0]
  //   2. pnpm dev /review foo.ts            → 拆成多个 argv
  //   3. pnpm --filter ... dev -- /review   → argv 含 "--"
  const raw = process.argv
    .slice(2)
    .filter((a) => a !== "--")
    .join(" ")
    .trim();

  if (!raw) {
    console.log("可用命令：\n" + listSkills());
    return;
  }

  const parts = raw.split(/\s+/);
  const command = parts[0];

  if (command === "/help" || command === "help" || command === "--help" || command === "-h") {
    console.log("可用命令：\n" + listSkills());
    return;
  }

  if (command === "--version" || command === "-v") {
    console.log("team-dev-assistant 0.1.0");
    return;
  }

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
