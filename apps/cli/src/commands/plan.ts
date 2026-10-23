import { PlanService } from "../services/plan";
import { PlanSyncProvider } from "../services/plan-sync";
import type { CLICommand } from "./types";

export const planCommand: CLICommand = {
  name: "plan",
  description: "结合 Playbook 拆解需求并创建 Issue",
  async execute({ raw }) {
    const requirement = raw.replace("/plan", "").trim();
    if (!requirement) {
      console.log("请提供需求描述，例如：/plan 增加 OAuth 登录");
      return;
    }

    const planService = new PlanService();
    const { tasks, contextCount } = await planService.generate(requirement);
    
    console.log(`\n✅ 规划完成 (读取了 ${contextCount} 条上下文)：\n`);
    tasks.forEach((t, i) => console.log(`${i + 1}. ${t.title}${t.dependsOn ? ` (依赖: ${t.dependsOn})` : ""}\n   ${t.description}\n`));
    
    if (process.env.GITHUB_TOKEN) {
      const syncProvider = new PlanSyncProvider();
      try {
        const created = await syncProvider.syncBatch({ tasks });
        console.log(`\n✅ 已成功同步 ${created.length} 个 Issue 到 GitHub。`);
      } catch (e: any) {
        console.warn(`⚠️ GitHub 同步失败: ${e.message}`);
      }
    }
  },
};
