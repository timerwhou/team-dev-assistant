import OpenAI from "openai";

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
