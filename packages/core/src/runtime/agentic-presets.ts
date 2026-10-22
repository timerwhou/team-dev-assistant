import { AgenticLoop } from "./agentic-loop";
import type { AgenticContext } from "./agentic-types";
import { MemoryStore } from "./memory-store";

const memoryStore = new MemoryStore();

/**
 * 内置的启发式评估器（增强版：支持历史记忆预判）
 */
export const createMemoryAwareEvaluator = () => {
  return async (ctx: AgenticContext) => {
    const fullText = ctx.accumulatedContext.join("\n");
    const hasFacts = fullText.includes("## 业务事实");
    const hasStacks = fullText.includes("## 技术规约");

    // 1. 检查历史经验
    const expectedIterations = memoryStore.getExpectedIterations(ctx.requirement);
    
    if (expectedIterations && ctx.iteration >= expectedIterations && (hasFacts || hasStacks)) {
      return { 
        complete: true, 
        reason: `基于历史经验，同类需求平均 ${expectedIterations} 轮即可收敛，当前已满足条件` 
      };
    }

    // 2. 基础兜底逻辑
    if (hasFacts || hasStacks) {
      return { complete: true, reason: "已检索到相关的业务事实或技术规约" };
    }
    
    return { complete: false, reason: "未找到实质性事实，可能需要继续检索" };
  };
};

/**
 * 供外部调用的高级封装：执行 Agentic 闭环，记录记忆并返回结果。
 */
export async function runAgenticInject(requirement: string, maxIterations = 3): Promise<{ text: string; iterations: number; trace: any[] }> {
  // 使用带有记忆能力的评估器
  const loop = new AgenticLoop(createMemoryAwareEvaluator());
  const result = await loop.run(requirement, maxIterations);
  
  // 🌟 闭环：记录本轮执行经验，供下次同类需求参考
  memoryStore.recordExecution(requirement, result.iteration);
  
  const uniqueContexts = Array.from(new Set(result.accumulatedContext));
  const text = uniqueContexts.join("\n\n--- 上一轮检索结果 ---\n\n");
  
  return {
    text,
    iterations: result.iteration,
    trace: result.trace,
  };
}
