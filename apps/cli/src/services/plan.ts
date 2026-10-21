import { z } from "zod";
import { runAgent, getContextPackAsync } from "@tda/core";

// 强制 LLM 输出的 JSON 结构
export const PlanTaskSchema = z.object({
  title: z.string().describe("任务标题，简短精炼"),
  description: z.string().describe("任务详细描述，包含验收标准"),
  dependsOn: z.string().nullable().optional().describe("依赖的上一个任务的标题"),
});

export const PlanOutputSchema = z.object({
  tasks: z.array(PlanTaskSchema).min(1).max(10),
});

export type PlanOutput = z.infer<typeof PlanOutputSchema>;

export class PlanService {
  /**
   * 根据需求生成计划
   * @param requirement 用户需求
   * @returns 解析后的任务列表
   */
  async generate(requirement: string): Promise<{ tasks: PlanOutput["tasks"]; contextCount: number }> {
    // 1. 静默提取 Playbook 上下文
    const contextPack = await getContextPackAsync(requirement);
    const contextCount = contextPack ? contextPack.split("###").length - 1 : 0;

    // 2. 构造 System Prompt，强约束 JSON 输出
    const systemPrompt = `你是一个资深的研发架构师。请将用户的需求拆解为若干个可执行的研发任务。
    
务必严格遵循以下规则：
1. 你必须输出一个合法的 JSON 对象，不要包含任何 Markdown 代码块标记（如 \`\`\`json）。
2. JSON 的格式必须是：{ "tasks": [ { "title": "任务标题", "description": "任务描述及验收标准", "dependsOn": "可选，依赖的上一个任务标题" } ] }
3. 任务数量控制在 1-10 个之间。

${contextPack ? `以下是从团队 Playbook 中检索到的相关业务事实与技术规约，请在拆解任务时严格遵循，绝不能违反：\n\n${contextPack}` : ""}
`;

    // 3. 调用 runAgent 生成计划（无工具模式）
    const result = await runAgent(systemPrompt, requirement, {
      maxSteps: 1, // 单步执行，不循环调用工具
      verbose: false,
      tools: [],   // 规划不需要工具
      executeTools: async () => [],
    });

    // 4. 解析与校验
    try {
      // 清理 LLM 可能乱加的 markdown 标记
      const cleanJson = result.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      const validated = PlanOutputSchema.parse(parsed);
      return { tasks: validated.tasks, contextCount };
    } catch (e) {
      throw new Error(`LLM 输出格式不合法，无法生成计划: ${(e as Error).message}\n原始输出:\n${result}`);
    }
  }
}
