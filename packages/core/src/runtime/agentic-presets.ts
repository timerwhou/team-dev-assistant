import { AgenticLoop } from "./agentic-loop";
import type { AgenticContext } from "./agentic-types";

/**
 * 内置的启发式评估器（增强版）
 */
export const heuristicEvaluator = async (ctx: AgenticContext) => {
  const fullText = ctx.accumulatedContext.join("\n");
  const hasFacts = fullText.includes("## 业务事实");
  const hasStacks = fullText.includes("## 技术规约");
  
  // 🌟 修正：只要有任何实质性的业务事实，且长度不是空壳，就认为足够了。
  // 因为同一个需求，多次检索 Playbook 结果必然相同。
  if (hasFacts || hasStacks) {
    return { complete: true, reason: "已检索到相关的业务事实或技术规约" };
  }
  
  return { complete: false, reason: "未找到实质性事实，可能需要去代码库搜索" };
};

/**
 * 供外部调用的高级封装：执行 Agentic 闭环并返回合并后的 Markdown 文本。
 * 🌟 修正：增加内容去重逻辑，避免将相同的背景包重复拼接。
 */
export async function runAgenticInject(requirement: string, maxIterations = 3): Promise<{ text: string; iterations: number; trace: any[] }> {
  const loop = new AgenticLoop(heuristicEvaluator);
  const result = await loop.run(requirement, maxIterations);
  
  // 去重：利用 Set 确保相同的 ContextPack 不会被多次拼接
  const uniqueContexts = Array.from(new Set(result.accumulatedContext));
  const text = uniqueContexts.join("\n\n--- 上一轮检索结果 ---\n\n");
  
  return {
    text,
    iterations: result.iteration,
    trace: result.trace,
  };
}
