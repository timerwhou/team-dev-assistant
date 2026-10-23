import "@tda/core/lib/env";
import { recorder, createJsonlReporter, createConsoleReporter } from "@tda/core";
import { skillsByName } from "@tda/skills";
import { commandRegistry } from "./commands/registry";
import { initCommand } from "./commands/init";
import { reviewConflictsCommand } from "./commands/review-conflicts";
import { helpCommand } from "./commands/help";

recorder.register(createJsonlReporter());
if (process.env.TDA_TRACE_CONSOLE === "1") {
  recorder.register(createConsoleReporter());
}

// 注册内置命令
commandRegistry.register(initCommand);
commandRegistry.register(reviewConflictsCommand);
commandRegistry.register(helpCommand);

async function main() {
  // 🌟 修复：过滤掉 pnpm 传来的 "--" 等无意义参数
  const argv = process.argv.slice(2).filter(arg => arg !== "--");
  const raw = argv.join(" ").trim();

  if (!raw) {
    await commandRegistry.get("help")?.execute({ args: [], raw: "" });
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
    // 暂时省略 skill 解析逻辑，保持兼容
    return;
  }

  console.error(`未知命令：${commandName}。输入 /help 查看可用命令。`);
  process.exitCode = 2;
}

main().catch((e) => {
  console.error("执行失败:", e);
  process.exit(1);
});
