import type { EmbeddingProvider } from "./types";
import { OpenAIEmbeddingProvider } from "./openai";
import { OllamaEmbeddingProvider } from "./ollama";
import { MockEmbeddingProvider } from "./mock";

export function createEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER?.toLowerCase() || "openai";
  if (provider === "ollama") return new OllamaEmbeddingProvider();
  if (provider === "mock") return new MockEmbeddingProvider();
  return new OpenAIEmbeddingProvider();
}
