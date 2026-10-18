/**
 * 每 100 万 token 的价格（美元）。
 * 数据来源：各厂商公开定价，更新于 2026-10。
 * 未列出的模型返回 undefined，不计成本。
 */
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "deepseek-chat": { input: 0.27, output: 1.1 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },
  "claude-3-5-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku": { input: 0.8, output: 4.0 },
  "hy4-preview": { input: 0.8967, output: 2.6902 },
  "hy3": { input: 0.1496, output: 0.5982 },
};

export function estimateCostUSD(
  model: string,
  promptTokens: number,
  completionTokens: number
): number | undefined {
  // 精确匹配，再尝试前缀匹配
  const key =
    PRICING[model]
      ? model
      : Object.keys(PRICING).find((k) => model.startsWith(k));
  if (!key) return undefined;
  const p = PRICING[key];
  return (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
}
