import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getMonorepoRoot } from "../../lib/env";
import type { EmbeddingProvider } from "./types";

interface CacheEntry {
  hash: string;
  embedding: number[];
}

export class LocalCacheEmbeddingProvider implements EmbeddingProvider {
  private cachePath: string;
  private cache: Record<string, CacheEntry> = {};
  private dimension: number;

  constructor() {
    this.cachePath = path.join(getMonorepoRoot(), ".tda/embeddings.json");
    this.dimension = 384; // 默认维度，适配常见轻量模型（如 all-MiniLM-L6-v2）
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        this.cache = JSON.parse(fs.readFileSync(this.cachePath, "utf-8"));
      }
    } catch {
      this.cache = {};
    }
  }

  private saveCache() {
    const dir = path.dirname(this.cachePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), "utf-8");
  }

  /**
   * 本地生成确定性向量的算法（生产环境应替换为真实本地模型推理）
   * 此处使用基于字符频率的哈希投影算法，确保相同文本生成相同向量
   */
  private generateLocalVector(text: string): number[] {
    const vec = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      // 直接取字符串的 charCodeAt，避免对 split 后的数组调用
      const code = text.charCodeAt(i);
      const idx = code % this.dimension;
      vec[idx] += 1;
    }
    // 归一化
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return norm === 0 ? vec : vec.map(v => v / norm);
  }

  async embed(texts: string[]): Promise<number[][]> {
    let hasChanges = false;
    const results: number[][] = [];

    for (const text of texts) {
      const hash = crypto.createHash("md5").update(text).digest("hex");
      
      if (this.cache[hash]) {
        results.push(this.cache[hash].embedding);
      } else {
        const embedding = this.generateLocalVector(text);
        this.cache[hash] = { hash, embedding };
        results.push(embedding);
        hasChanges = true;
      }
    }

    if (hasChanges) this.saveCache();
    return results;
  }
}
