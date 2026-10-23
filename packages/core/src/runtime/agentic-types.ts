export interface AgenticTraceEvent {
  iteration: number;
  action: "retrieve" | "execute" | "complete" | "abort";
  detail: string;
  timestamp: number;
}

export interface LlmCallRecord {
  callId: string;
  prompt: string;
  response: string;
  model?: string;
  tokenUsage?: { input: number; output: number };
  durationMs: number;
  timestamp: number;
}

export interface AgenticContext {
  workflowId?: string;
  requirement: string;
  iteration: number;
  maxIterations: number;
  trace: AgenticTraceEvent[];
  accumulatedContext: string[];
  isComplete: boolean;
  isAborted: boolean;
}

export type EvaluatorFn = (context: AgenticContext) => Promise<{ complete: boolean; reason?: string }>;
