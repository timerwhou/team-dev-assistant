import "@tda/core/lib/env";
import { recorder, createJsonlReporter, createConsoleReporter } from "@tda/core";
import { skillsByName, listSkills } from "@tda/skills";
import { commandRegistry } from "./commands/registry";
import { initCommand } from "./commands/init";
import { reviewConflictsCommand } from "./commands/review-conflicts";
// import { injectCommand } from "./commands/inject";
// import { todoCommand } from "./commands/todo";
// import { planCommand } from "./commands/plan";
// import { syncFactsCommand } from "./commands/sync-facts";

recorder.register(createJsonlReporter());
if (process.env.TDA_TRACE_CONSOLE === "1") {
  recorder.register(createConsoleReporter());
}

// 注册内置命令
commandRegistry.register(initCommand);
commandRegistry.register(reviewConflictsCommand);

async function main() {
  const argv = process.argv.slice(2);
  const raw = argv.join(" ").trim();

  if (!raw) {
    console.log("请提供命令。可用命令：\n" + commandRegistry.list().map(c => `/${c.name} - ${c.description}`).join("\n"));
    return;
  }

  // 解析命令名 (如 "/init --path=xxx" -> "init")
  const commandName = raw.split(/\s+/)[0].replace(/^\//, "");
  const cmd = commandRegistry.get(commandName);

  if (cmd) {
    await cmd.execute({ args: argv.slice(1), raw });
    return;
  }

  // 如果命令没有注册，回退到 Agent Skill
  const skill = skillsByName.get(commandName);
  if (skill) {
    // ... 执行 Skill 逻辑 (可后续抽象)
    return;
  }

  console.error(`未知命令：${commandName}`);
  process.exitCode = 2;
}

main().catch((e) => {
  console.error("执行失败:", e);
  process.exit(1);
});
