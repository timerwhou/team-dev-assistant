import type { EmbeddingProvider } from "./types";

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "nomic-embed-text";
  }

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
        const data = await res.json();
        return data.embedding as number[];
      })
    );
    return Promise.all(promises);
  }
}
