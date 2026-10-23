import { extractFactsFromCode, getMonorepoRoot } from "@tda/core";
import type { CLICommand } from "./types";

export const syncFactsCommand: CLICommand = {
  name: "sync-facts",
  description: "扫描代码中的 @fact 注释并同步到 Playbook",
  async execute() {
    console.log("正在扫描代码中的 @fact 注释...");
    const root = getMonorepoRoot();
    const facts = await extractFactsFromCode(root);
    
    if (facts.length === 0) {
      console.log("✅ 未发现新的 @fact 注释。");
    } else {
      console.log(`✅ 发现 ${facts.length} 条事实，请参考 .tda 目录下的日志。`);
    }
  },
};
