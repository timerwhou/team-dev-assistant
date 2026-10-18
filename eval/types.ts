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
  /** 是否核心用例（EVAL_SUBSET=critical 时只跑这些） */
  critical?: boolean;
  /** 轨迹断言（从 Trace 数据里检查） */
  expect?: {
    /** 期望的收口原因（AgentRunTrace.stopReason） */
    stopReason?: string[];
    /** 必须调用的工具 */
    mustUseTools?: string[];
    /** 最大工具调用次数 */
    maxToolCalls?: number;
    /** 是否必须有上下文压缩（context_build 事件） */
    mustHaveContextBuild?: boolean;
  };
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
  /** 收口原因 */
  stopReason?: string;
  /** 工具调用列表 */
  usedTools?: string[];
  /** 上下文组装次数 */
  contextBuilds?: number;
};

export type EvalReport = {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: EvalResult[];
};
