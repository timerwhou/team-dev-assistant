import "@tda/core/lib/env";
import { recorder, createJsonlReporter, createConsoleReporter } from "@tda/core";
import { skillsByName } from "@tda/skills";
import { commandRegistry } from "./commands/registry";
import { initCommand } from "./commands/init";
import { reviewConflictsCommand } from "./commands/review-conflicts";
import { helpCommand } from "./commands/help";
import { syncFactsCommand } from "./commands/sync-facts";
import { injectCommand } from "./commands/inject";
import { todoCommand } from "./commands/todo";
import { planCommand } from "./commands/plan";

recorder.register(createJsonlReporter());
if (process.env.TDA_TRACE_CONSOLE === "1") {
  recorder.register(createConsoleReporter());
}

// 🌟 注册所有内置命令
commandRegistry.register(initCommand);
commandRegistry.register(reviewConflictsCommand);
commandRegistry.register(helpCommand);
commandRegistry.register(syncFactsCommand);
commandRegistry.register(injectCommand);
commandRegistry.register(todoCommand);
commandRegistry.register(planCommand);

async function main() {
  const argv = process.argv.slice(2).filter(arg => arg !== "--");
  const raw = argv.join(" ").trim();

  if (!raw) {
    await commandRegistry.get("help")?.execute({ args: [], raw: "" });
    return;
  }

  const commandName = raw.split(/\s+/)[0].replace(/^\//, "");
  const cmd = commandRegistry.get(commandName);

  if (cmd) {
    await cmd.execute({ args: argv.slice(1), raw });
    return;
  }

  const skill = skillsByName.get(commandName);
  if (skill) {
    console.log(`(Agent Skill 执行逻辑暂保留原有实现...)`);
    return;
  }

  console.error(`未知命令：${commandName}。输入 /help 查看可用命令。`);
  process.exitCode = 2;
}

main().catch((e) => {
  console.error("执行失败:", e);
  process.exit(1);
});
