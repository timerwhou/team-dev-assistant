export type LLMCallTrace = {
  kind: "llm_call";
  id: string;
  timestamp: string;
  model: string;
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  /** 估算成本（美元），未知模型为 undefined */
  costUSD?: number;
  /** 是否带工具 */
  hasTools: boolean;
  /** 是否结构化输出 */
  jsonMode: boolean;
  /** 错误信息（若有） */
  error?: string;
};

export type AgentRunTrace = {
  kind: "agent_run";
  id: string;
  timestamp: string;
  durationMs: number;
  steps: number;
  toolCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUSD: number;
  /** 收口原因（若有） */
  stopReason?: string;
};

export type ToolCallTrace = {
  kind: "tool_call";
  id: string;
  timestamp: string;
  name: string;
  durationMs: number;
  ok: boolean;
  error?: string;
};

export type TraceEvent = LLMCallTrace | AgentRunTrace | ToolCallTrace;

export type Reporter = {
  name: string;
  report: (event: TraceEvent) => void | Promise<void>;
  flush?: () => void | Promise<void>;
};
