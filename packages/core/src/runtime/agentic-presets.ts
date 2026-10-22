import { AgenticLoop } from "./agentic-loop";
import type { AgenticContext, AgenticTraceEvent } from "./agentic-types";
import { MemoryStore } from "./memory-store";
import { savePlaybookEntry } from "../playbook/writer";

const memoryStore = new MemoryStore();

/**
 * 内置的启发式评估器（支持历史记忆预判）
 */
export const createMemoryAwareEvaluator = () => {
  return async (ctx: AgenticContext) => {
    const fullText = ctx.accumulatedContext.join("\n");
    const hasFacts = fullText.includes("## 业务事实");
    const hasStacks = fullText.includes("## 技术规约");

    const expectedIterations = memoryStore.getExpectedIterations(ctx.requirement);
    
    if (expectedIterations && ctx.iteration >= expectedIterations && (hasFacts || hasStacks)) {
      return { 
        complete: true, 
        reason: `基于历史经验，同类需求平均 ${expectedIterations} 轮即可收敛，当前已满足条件` 
      };
    }

    if (hasFacts || hasStacks) {
      return { complete: true, reason: "已检索到相关的业务事实或技术规约" };
    }
    
    return { complete: false, reason: "未找到实质性事实，可能需要继续检索" };
  };
};

/**
 * 将 Trace 事件流提炼为人类可读的执行路径描述
 */
function summarizeTrace(trace: AgenticTraceEvent[]): string {
  return trace.map(t => {
    if (t.action === "retrieve") return `第 ${t.iteration} 轮：执行检索 (${t.detail})`;
    if (t.action === "complete") return `第 ${t.iteration} 轮：判定收敛 (${t.detail})`;
    if (t.action === "abort") return `第 ${t.iteration} 轮：强制中止 (${t.detail})`;
    return `第 ${t.iteration} 轮：执行动作 (${t.detail})`;
  }).join("\n");
}

/**
 * 高级封装：执行 Agentic 闭环，记录记忆，并将成功轨迹沉淀至 Playbook。
 */
export async function runAgenticInject(
  requirement: string, 
  maxIterations = 3,
  options: { enablePlaybookPersistence?: boolean } = {}
): Promise<{ text: string; iterations: number; trace: any[] }> {
  const loop = new AgenticLoop(createMemoryAwareEvaluator());
  const result = await loop.run(requirement, maxIterations);
  
  // 1. 记录本轮执行经验（轮数）
  memoryStore.recordExecution(requirement, result.iteration);
  
  // 2. 如果闭环成功，且开启了沉淀，则将执行轨迹固化为 Fact
  if (result.isComplete && options.enablePlaybookPersistence !== false) {
    try {
      const pathSummary = summarizeTrace(result.trace);
      savePlaybookEntry({
        type: "fact",
        domain: "workflow-memory",
        title: `执行轨迹：${requirement.slice(0, 20)}...`,
        decision: `该需求最终在 ${result.iteration} 轮内成功收敛。`,
        rationale: "通过 Agentic 引擎自动深挖与评估，形成了一条可复用的检索与执行路径。",
        content: `### 需求背景\n${requirement}\n\n### 执行路径 (Trace)\n${pathSummary}\n\n### 最终上下文摘要\n${result.accumulatedContext.join("\n").slice(0, 500)}...`,
      });
      console.log(`📚 [Playbook] 成功轨迹已沉淀为 Workflow Fact`);
    } catch (e) {
      console.warn("⚠️ [Playbook] 轨迹沉淀失败，不影响主流程:", (e as Error).message);
    }
  }
  
  const uniqueContexts = Array.from(new Set(result.accumulatedContext));
  const text = uniqueContexts.join("\n\n--- 上一轮检索结果 ---\n\n");
  
  return {
    text,
    iterations: result.iteration,
    trace: result.trace,
  };
}
