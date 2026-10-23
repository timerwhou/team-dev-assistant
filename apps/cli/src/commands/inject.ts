import { getContextPackAsync, runAgenticInject } from "@tda/core";
import type { CLICommand } from "./types";

export const injectCommand: CLICommand = {
  name: "inject",
  description: "提取项目上下文（支持 --agentic 多轮深挖）",
  async execute({ raw }) {
    const argsStr = raw.replace("/inject", "").trim();
    const isAgentic = argsStr.includes("--agentic");
    const requirement = argsStr.replace("--agentic", "").trim();

    if (!requirement) {
      console.log("请提供需求描述，例如：/inject 我要做登录鉴权");
      return;
    }

    if (isAgentic) {
      console.log("🤖 已开启 Agentic 模式...");
      const result = await runAgenticInject(requirement, 3);
      console.log(`\n=== 检索完成 (${result.iterations} 轮) ===\n`);
      console.log(result.text);
    } else {
      const pack = await getContextPackAsync(requirement);
      if (!pack) {
        console.log("⚠️ 未找到相关上下文。");
      } else {
        console.log("\n=== 请复制以下内容发送给外部模型 ===\n");
        console.log(pack);
        console.log("=====================================\n");
      }
    }
  },
};
