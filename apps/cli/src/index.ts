import "dotenv/config";
import { runAgent } from "@tda/core";
import { executeToolCalls, openAITools } from "@tda/tools";
import { skillsByName, listSkills } from "@tda/skills";

async function main() {
  const raw = process.argv.slice(2).join(" ").trim();

  if (!raw || raw === "/help" || raw === "help") {
    console.log("可用命令：\n" + listSkills());
    return;
  }

  const [command, ...rest] = raw.split(/\s+/);
  const skillName = command.startsWith("/") ? command.slice(1) : command;
  const skill = skillsByName.get(skillName);

  if (!skill) {
    console.log(`未知命令：${command}\n\n可用命令：\n${listSkills()}`);
    return;
  }

  const args: Record<string, unknown> = {};
  const positional: string[] = [];
  for (const token of rest) {
    const m = token.match(/^--?([\w-]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
    else positional.push(token);
  }
  const shape = (skill.parameters as any).shape ?? {};
  const firstKey = Object.keys(shape)[0];
  if (firstKey && args[firstKey] === undefined && positional.length > 0) {
    args[firstKey] = positional.join(" ");
  }

  const parsed = skill.parameters.safeParse(args);
  if (!parsed.success) {
    console.log("参数错误：");
    for (const i of parsed.error.issues) console.log(`  ${i.path.join(".")}: ${i.message}`);
    return;
  }

  const userMessage = skill.buildUserMessage({
    input: rest.join(" "),
    args: parsed.data as Record<string, unknown>,
    cwd: process.cwd(),
  });

  const allowedTools = openAITools.filter(
    (t) => t.type === "function" && skill.tools.includes(t.function.name)
  );

  console.log(`\n🚀 /${skill.name}\n`);
  const answer = await runAgent(skill.system, userMessage, {
    verbose: true,
    maxSteps: skill.maxSteps,
    tools: allowedTools,
    executeTools: executeToolCalls,
  });
  console.log(`\n${answer}\n`);
}

main().catch(console.error);
