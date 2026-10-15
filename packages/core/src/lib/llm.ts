import OpenAI from "openai";
import { recorder } from "../trace/recorder";
import { estimateCostUSD } from "../trace/pricing";

let _client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "缺少 OPENAI_API_KEY。请确认仓库根目录存在 .env，且入口已 import '@tda/core/lib/env'"
    );
  }
  _client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL,
  });
  return _client;
}

export function getModel(): string {
  return process.env.MODEL || "gpt-4o-mini";
}

/**
 * 带 trace 的 chat 调用。所有 LLM 调用都应走这里，自动记录 token/耗时/成本。
 */
export async function tracedChatCompletion(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const start = Date.now();
  const hasTools = !!params.tools?.length;
  const jsonMode = params.response_format?.type === "json_object";

  try {
    const res = await getClient().chat.completions.create(params);
    const usage = res.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = usage?.total_tokens ?? 0;

    recorder.emitLLMCall({
      model: params.model,
      durationMs: Date.now() - start,
      promptTokens,
      completionTokens,
      totalTokens,
      costUSD: estimateCostUSD(params.model, promptTokens, completionTokens),
      hasTools,
      jsonMode,
    });

    return res;
  } catch (e: any) {
    recorder.emitLLMCall({
      model: params.model,
      durationMs: Date.now() - start,
      hasTools,
      jsonMode,
      error: e.message || String(e),
    });
    throw e;
  }
}
