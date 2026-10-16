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
  /** 上下文组装的统计（若有） */
  contextBuilds?: {
    total: number;
    compressed: number;
    beforeTokens: number;
    afterTokens: number;
  };
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

/**
 * 上下文组装决策 trace。
 *
 * 对齐 LangChain coding agent metadata contract：
 * - 全局标识（agentType）：未来支持子 Agent 时可区分
 * - 层次维度（layer）：对齐 Context Engineering 的分层
 * - 决策维度（action）：明确"做了什么"
 *
 * 参见 ADR-0005 / docs/design/context-engineering.md。
 */
export type ContextBuildTrace = {
  kind: "context_build";
  id: string;
  timestamp: string;
  /** 全局标识：根 Agent 还是子 Agent */
  agentType: "root" | "subagent";
  /** 上下文层次 */
  layer: "instruction" | "tool" | "history";
  /** 决策动作 */
  action: "keep" | "truncate" | "drop";
  /** 涉及的工具名（layer === "tool" 时） */
  toolName?: string;
  beforeTokens: number;
  afterTokens: number;
  /** 决策原因 */
  reason: string;
};

export type TraceEvent =
  | LLMCallTrace
  | AgentRunTrace
  | ToolCallTrace
  | ContextBuildTrace;

export type Reporter = {
  name: string;
  report: (event: TraceEvent) => void | Promise<void>;
  flush?: () => void | Promise<void>;
};
