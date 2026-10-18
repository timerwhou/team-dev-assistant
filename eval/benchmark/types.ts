/**
 * Context Engineering 收益量化的基准类型。
 *
 * 参见 ADR-0005 / docs/design/context-engineering.md。
 *
 * 目标：量化"单次工具结果压缩收益"，而非"端到端 token 对比"。
 * 原因：LLM 决策非确定——无压缩时可能少读文件，有压缩反而多读。
 */

export type BenchmarkCase = {
  id: string;
  skill: "review" | "investigate" | "issues";
  input: string;
  description?: string;
};

export type BenchmarkRun = {
  caseId: string;
  mode: "no-compress" | "compressed";
  output: string;
  llmCalls: number;
  steps: number;
  toolCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUSD: number;
  contextBuilds: {
    total: number;
    compressed: number;
    beforeTokens: number;
    afterTokens: number;
  };
  durationMs: number;
  stopReason?: string;
  timedOut?: boolean;
};

export type BenchmarkReport = {
  timestamp: string;
  totalCases: number;
  runs: BenchmarkRun[];
  summary: {
    totalBuilds: number;
    totalCompressed: number;
    totalBeforeTokens: number;
    totalAfterTokens: number;
    savedTokens: number;
    compressionRatio: number;
  };
};
