import type { AgenticContext, EvaluatorFn, AgenticTraceEvent } from "./agentic-types";

export class AgenticLoop {
  private evaluator: EvaluatorFn;

  // 🌟 架构修正：移除脆弱的默认字数评估器。必须有明确的业务评估策略。
  constructor(evaluator: EvaluatorFn) {
    this.evaluator = evaluator;
  }

  public async run(requirement: string, maxIterations = 5): Promise<AgenticContext> {
    const ctx: AgenticContext = {
      requirement,
      iteration: 0,
      maxIterations,
      trace: [],
      accumulatedContext: [],
      isComplete: false,
      isAborted: false,
    };

    while (ctx.iteration < ctx.maxIterations && !ctx.isComplete && !ctx.isAborted) {
      ctx.iteration++;
      this.logTrace(ctx, "retrieve", `Round ${ctx.iteration}: 检索 Playbook`);

      // 动态引入检索，避免循环依赖
      const { getContextPackAsync } = await import("../playbook/loader");
      const pack = await getContextPackAsync(requirement);
      if (pack) ctx.accumulatedContext.push(pack);

      // 2. 调用业务评估器
      const evalResult = await this.evaluator(ctx);
      if (evalResult.complete) {
        ctx.isComplete = true;
        this.logTrace(ctx, "complete", `完成: ${evalResult.reason || "满足完成条件"}`);
        break;
      } else {
        this.logTrace(ctx, "execute", `不完整: ${evalResult.reason}. 准备下一轮深挖...`);
      }
    }

    if (!ctx.isComplete && !ctx.isAborted) {
      this.logTrace(ctx, "abort", "达到最大迭代次数，强制收敛");
    }

    return ctx;
  }

  private logTrace(ctx: AgenticContext, action: AgenticTraceEvent["action"], detail: string) {
    ctx.trace.push({
      iteration: ctx.iteration,
      action,
      detail,
      timestamp: Date.now(),
    });
  }
}
