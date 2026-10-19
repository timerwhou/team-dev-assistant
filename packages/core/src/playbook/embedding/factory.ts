import type { EmbeddingProvider } from "./types";
import { OpenAIEmbeddingProvider } from "./openai";
import { OllamaEmbeddingProvider } from "./ollama";
import { MockEmbeddingProvider } from "./mock";

export function createEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER?.toLowerCase() || "openai";
  
  if (provider === "ollama") {
    return new OllamaEmbeddingProvider(
      process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      process.env.OLLAMA_MODEL || "nomic-embed-text"
    );
  }
  
  if (provider === "mock") {
    return new MockEmbeddingProvider();
  }

  // 默认走 OpenAI 兼容协议通道
  // 优先使用独立的 EMBEDDING_* 配置；如果没有，则降级复用 OPENAI_* 配置（兼容旧版）
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseUrl = process.env.EMBEDDING_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  return new OpenAIEmbeddingProvider(apiKey, baseUrl, model);
}
