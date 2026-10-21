import type { CapabilityPack } from "./types";

export interface AgenticTraceEvent {
  iteration: number;
  action: "retrieve" | "execute" | "complete" | "abort";
  detail: string;
  timestamp: number;
}

export interface AgenticContext {
  workflowId?: string;
  requirement: string;
  iteration: number;
  maxIterations: number;
  trace: AgenticTraceEvent[];
  /** 积累的上下文（背景包或工具返回结果） */
  accumulatedContext: string[];
  /** 是否已满足完成条件 */
  isComplete: boolean;
  /** 中断信号 */
  isAborted: boolean;
}

export type EvaluatorFn = (context: AgenticContext) => Promise<{ complete: boolean; reason?: string }>;
