import type { EmbeddingProvider } from "./types";

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  constructor(
    private baseUrl: string,
    private model: string
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const promises = texts.map(text => 
      fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: text })
      }).then(async res => {
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Ollama Embedding failed (${res.status}): ${err}`);
        }
        const data = await res.json() as { embedding: number[] };
        return data.embedding;
      })
    );
    return Promise.all(promises);
  }
}
