import type {
  ContextBuilder,
  ContextBuildResult,
  TokenBudget,
} from "./types";

/**
 * 极简 token 估算。
 *
 * 规则：1 token ≈ 4 字符（英文）/ 1.5 字符（中文）。
 * 为简化，用 3 字符/token 保守估计。
 *
 * 未来可替换为 tiktoken 之类的精确 tokenizer。
 */
export function estimateTokens(content: unknown): number {
  if (content == null) return 0;
  const text = typeof content === "string" ? content : JSON.stringify(content);
  return Math.ceil(text.length / 3);
}

/**
 * 第一版 ContextBuilder：恒等变换。
 *
 * 只计算 tokens 和生成决策记录，不修改 messages。
 * 用于搭骨架 + 让集成路径通。
 *
 * 真正的压缩逻辑在 Story 2 实现。
 */
export class IdentityContextBuilder<M = { content?: unknown }>
  implements ContextBuilder<M>
{
  build(messages: M[], budget: TokenBudget): ContextBuildResult<M> {
    const totalTokens = messages.reduce((sum, m) => {
      const content = (m as { content?: unknown }).content;
      return sum + estimateTokens(content);
    }, 0);

    const reserved = budget.reserveForOutput ?? 0;
    if (totalTokens + reserved > budget.maxTokens) {
      // 第一版不压缩，但记录超限
      return {
        messages,
        decisions: [
          {
            layer: "history",
            action: "keep",
            reason: `超预算：${totalTokens} + ${reserved} > ${budget.maxTokens}（第一版不压缩）`,
            beforeTokens: totalTokens,
            afterTokens: totalTokens,
          },
        ],
        totalTokens,
      };
    }

    return {
      messages,
      decisions: [
        {
          layer: "history",
          action: "keep",
          reason: "identity builder（第一版）",
          beforeTokens: totalTokens,
          afterTokens: totalTokens,
        },
      ],
      totalTokens,
    };
  }
}
