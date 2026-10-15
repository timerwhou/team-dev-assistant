export type EvalCase = {
  /** 唯一 id */
  id: string;
  /** 归属 skill */
  skill: "review" | "investigate" | "issues";
  /** 传给 skill 的输入（对应 CLI 的参数部分） */
  input: string;
  /** 断言：输出中必须包含的子串（全部满足） */
  mustContain?: string[];
  /** 断言：输出中必须不包含的子串（全部满足） */
  mustNotContain?: string[];
  /** 断言：输出中必须包含任一子串（满足其一） */
  mustContainAny?: string[];
  /** 断言：最多步数（从 trace 里取，可选） */
  maxSteps?: number;
  /** 用例说明 */
  description?: string;
};

export type EvalResult = {
  id: string;
  skill: string;
  input: string;
  passed: boolean;
  durationMs: number;
  output: string;
  failures: string[];
  /** 若 Agent 有工具调用，记录总数 */
  toolCalls?: number;
  /** 若 Agent 有步骤记录，记录步数 */
  steps?: number;
};

export type EvalReport = {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: EvalResult[];
};
