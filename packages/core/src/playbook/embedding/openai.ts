import type { EmbeddingProvider } from "./types";

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    // 行业标准：baseUrl 包含 /v1
    this.baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) throw new Error("未配置 OPENAI_API_KEY");

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

    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
  }
}
