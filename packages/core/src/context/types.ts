/**
 * Context Engineering 类型定义。
 *
 * 参见 ADR-0005 和 docs/design/context-engineering.md。
 */

export type ContextLayer = "instruction" | "tool" | "memory" | "history";

export type ContextAction = "keep" | "truncate" | "drop" | "summarize";

export interface TokenBudget {
  /** 上下文总预算（tokens） */
  maxTokens: number;
  /** 为 LLM 响应预留的 tokens */
  reserveForOutput?: number;
  /** 单个工具结果的 token 上限 */
  singleToolResultLimit?: number;
}

export interface ContextDecision {
  layer: ContextLayer;
  action: ContextAction;
  reason: string;
  beforeTokens: number;
  afterTokens: number;
}

export interface ContextBuildResult<M = unknown> {
  messages: M[];
  decisions: ContextDecision[];
  totalTokens: number;
}

export interface ContextBuilder<M = unknown> {
  /**
   * 组装 messages，返回处理后（可能被压缩）的 messages。
   *
   * 第一版（IdentityContextBuilder）是恒等变换——原样返回，只计算 tokens。
   */
  build(messages: M[], budget: TokenBudget): ContextBuildResult<M>;
}

/**
 * 工具结果压缩配置。
 *
 * 每个工具一个阈值 + 策略。
 */
export type CompressorOptions = {
  /** read_file：超过此行数触发压缩 */
  readFileMaxLines?: number;
  /** search_code：超过此匹配数触发压缩 */
  searchCodeMaxMatches?: number;
  /** list_issues：超过此条数触发压缩 */
  listIssuesMaxItems?: number;
};

export type CompressionResult = {
  /** 压缩后的内容（字符串） */
  content: string;
  /** 是否发生了压缩 */
  compressed: boolean;
  /** 压缩前 tokens */
  beforeTokens: number;
  /** 压缩后 tokens */
  afterTokens: number;
  /** 压缩原因（未压缩时为 undefined） */
  reason?: string;
};
