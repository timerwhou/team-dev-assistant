import type { CodeUnderstandingAdapter, CodeSkeleton } from "./types";
import { HeuristicAdapter } from "./heuristic-adapter";

export class InitOrchestrator {
  private adapters: CodeUnderstandingAdapter[];

  constructor() {
    // 🌟 纯净状态：首期只挂载零依赖的启发式适配器
    this.adapters = [
      new HeuristicAdapter(),
      // 未来可在此处按需加入 LspAdapter、McpAdapter
    ];
  }

  public async execute(rootDir: string): Promise<CodeSkeleton[]> {
    let bestSkeleton: CodeSkeleton[] = [];

    for (const adapter of this.adapters) {
      if (await adapter.isAvailable(rootDir)) {
        console.log(`⚡ 正在使用适配器: ${adapter.name} 提取骨架...`);
        const result = await adapter.extract(rootDir);
        
        // 如果有精确模式（precise），直接采用并跳出
        if (result.some(r => r.accuracy === "precise")) {
          return result;
        }
        
        // 否则保留第一次跑出来的启发式结果
        if (bestSkeleton.length === 0) {
          bestSkeleton = result;
        }
      }
    }

    return bestSkeleton;
  }
}
