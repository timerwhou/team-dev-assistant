import type { EmbeddingProvider } from "./types";

// 兼容任何实现了 OpenAI Embedding API 格式的供应商
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private model: string
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("Embedding API Key 未配置（请检查 EMBEDDING_API_KEY 或 OPENAI_API_KEY）");
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ input: texts, model: this.model })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Embedding API failed (${response.status}): ${errBody}`);
    }

    const data = await response.json() as { data: { embedding: number[] }[] };
    return data.data.map((d) => d.embedding);
  }
}
