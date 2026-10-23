import { commandRegistry } from "./registry";
import { skillsByName } from "@tda/skills";
import type { CLICommand } from "./types";

export const helpCommand: CLICommand = {
  name: "help",
  description: "显示所有可用命令",
  async execute() {
    console.log("\n=== 📖 Team Dev Assistant CLI ===\n");
    
    console.log("【系统命令】");
    commandRegistry.list().forEach(cmd => {
      console.log(`  /${cmd.name.padEnd(16)} ${cmd.description}`);
    });

    console.log("\n【Agent 技能】");
    for (const [name, skill] of skillsByName.entries()) {
      console.log(`  /${name.padEnd(16)} ${skill.description || "Agent Skill"}`);
    }
    console.log("\n");
  },
};
