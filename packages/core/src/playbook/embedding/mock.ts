import type { EmbeddingProvider } from "./types";

export class MockEmbeddingProvider implements EmbeddingProvider {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(text => {
      // 生成全零向量（在向量空间中表示毫无关联）
      const vec = Array(1536).fill(0); 
      
      // 如果文本包含鉴权相关词，赋予极高相似度特征
      if (text.includes("jwt") || text.includes("鉴权") || text.includes("登录")) {
        vec[0] = 1.0; 
        vec[1] = 1.0;
      } else if (text.includes("kafka") || text.includes("队列")) {
        vec[2] = 1.0;
        vec[3] = 1.0;
      } else if (text.includes("成本") || text.includes("cost")) {
        vec[4] = 1.0;
        vec[5] = 1.0;
      } else {
        // 兜底噪声
        vec[0] = 0.01; 
      }
      
      return vec;
    });
  }
}
