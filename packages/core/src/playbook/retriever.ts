import { recorder } from "../trace/recorder";
import type { PlaybookEntry, Retriever, AsyncRetriever } from "./types";
import { createEmbeddingProvider } from "./embedding/factory";
import type { EmbeddingProvider } from "./embedding/types";

// --- 基础分词器 ---
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const latin = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  tokens.push(...latin.filter(w => w.length > 1));
  
  const cjkRuns = text.match(/[\u4e00-\u9fff]+/g) ?? [];
  for (const run of cjkRuns) {
    if (run.length === 1) {
      tokens.push(run);
    } else {
      for (let i = 0; i < run.length - 1; i++) {
        tokens.push(run.slice(i, i + 2));
      }
    }
  }
  return Array.from(new Set(tokens));
}

// 1. BM25 本地检索器（同步）
export class BM25Retriever implements Retriever {
  retrieve(requirement: string, entries: PlaybookEntry[]): PlaybookEntry[] {
    const queryTokens = tokenize(requirement);
    if (queryTokens.length === 0) return [];

    const docTokens = entries.map(e => tokenize([
      e.title, e.content, e.domain, e.decision || "", e.rationale || "",
      ...(e.alternatives || [])
    ].join(" ")));

    const N = entries.length;
    const avgdl = docTokens.reduce((sum, doc) => sum + doc.length, 0) / (N || 1);
    const k1 = 1.2, b = 0.75;
    const scores: { entry: PlaybookEntry, score: number }[] = [];

    entries.forEach((entry, idx) => {
      if (entry.status !== "active") return;
      const doc = docTokens[idx];
      let score = 0;
      for (const q of queryTokens) {
        const tf = doc.filter(t => t === q).length;
        if (tf === 0) continue;
        const df = docTokens.filter(d => d.includes(q)).length;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc.length / avgdl))));
      }
      if (score > 0) scores.push({ entry, score });
    });

    return scores.sort((a, b) => b.score - a.score).map(s => s.entry);
  }
}

// 2. 语义检索器（异步，由 Provider 驱动）
export class VectorRetriever implements AsyncRetriever {
  private provider: EmbeddingProvider;

  constructor(provider?: EmbeddingProvider) {
    this.provider = provider || createEmbeddingProvider();
  }

  async retrieveAsync(requirement: string, entries: PlaybookEntry[]): Promise<PlaybookEntry[]> {
    const activeEntries = entries.filter(e => e.status === "active");
    if (activeEntries.length === 0) return [];

    const docs = activeEntries.map(e => [
      e.title, e.domain, e.decision || "", e.rationale || "", e.content
    ].join("\n"));
    
    let embeddings: number[][];
    try {
      // 网络/模型异常的唯一落点：嵌入调用
      embeddings = await this.provider.embed([requirement, ...docs]);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.warn("[VectorRetriever] 语义检索失败，本层返回空结果；字面召回由混合层 BM25 兜底:", err.message);

      // 可观测性闭环：发射结构化降级 Trace 事件（可聚合、可告警）
      recorder.emitRetrieverDegraded({
        retriever: "vector",
        operation: "embed",
        errorName: err.name,
        errorMessage: err.message,
        fallback: "empty_result",
      });

      return [];
    }

    const queryVec = embeddings[0];
    const docVecs = embeddings.slice(1);

    const scores = docVecs.map((vec, i) => ({
      entry: activeEntries[i],
      score: this.cosineSimilarity(queryVec, vec)
    }));

    return scores
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .map(s => s.entry);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      nA += vecA[i] * vecA[i];
      nB += vecB[i] * vecB[i];
    }
    return nA === 0 || nB === 0 ? 0 : dot / (Math.sqrt(nA) * Math.sqrt(nB));
  }
}

// 3. 异步混合检索器（RRF 融合 + 决策图谱 1-hop）
export class AsyncHybridRetriever {
  private vectorRetriever: VectorRetriever;
  private bm25Retriever: BM25Retriever;
  private k: number;
  private topK: number;

  constructor(k = 60, topK = 5, vectorRetriever?: VectorRetriever) {
    this.k = k;
    this.topK = topK;
    this.vectorRetriever = vectorRetriever || new VectorRetriever();
    this.bm25Retriever = new BM25Retriever();
  }

  async retrieveAsync(requirement: string, entries: PlaybookEntry[]): Promise<PlaybookEntry[]> {
    const [vectorResults, bm25Results] = await Promise.all([
      this.vectorRetriever.retrieveAsync(requirement, entries),
      Promise.resolve(this.bm25Retriever.retrieve(requirement, entries))
    ]);

    const rrfScores = new Map<string, { entry: PlaybookEntry, score: number }>();

    const applyRRF = (results: PlaybookEntry[]) => {
      results.forEach((entry, rank) => {
        const current = rrfScores.get(entry.id) || { entry, score: 0 };
        current.score += 1 / (this.k + rank + 1);
        rrfScores.set(entry.id, current);
      });
    };

    applyRRF(vectorResults);
    applyRRF(bm25Results);

    const sortedItems = Array.from(rrfScores.values())
      .sort((a, b) => b.score - a.score);
      
    if (sortedItems.length === 0) return [];

    const topScore = sortedItems[0].score;
    const threshold = topScore * 0.3;
    const filteredItems = sortedItems.filter(item => item.score >= threshold);

    const topEntries = filteredItems.slice(0, this.topK).map(item => item.entry);

    return this.expandGraph(topEntries, entries);
  }

  private expandGraph(topEntries: PlaybookEntry[], allEntries: PlaybookEntry[]): PlaybookEntry[] {
    const expanded = new Map(topEntries.map(e => [e.id, e]));
    for (const entry of topEntries) {
      for (const alt of entry.alternatives || []) {
        for (const candidate of allEntries) {
          if (candidate.status === "active" && (alt.includes(candidate.title) || alt.includes(candidate.id))) {
            expanded.set(candidate.id, candidate);
          }
        }
      }
    }
    return Array.from(expanded.values());
  }
}
