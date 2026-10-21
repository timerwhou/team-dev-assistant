import type { CapabilityPack, CapabilityKind } from "./types";
import { searchCodeCapability } from "./capabilities/search-code";
import { listIssuesCapability } from "./capabilities/list-issues";

export class CapabilityRegistry {
  private packs = new Map<string, CapabilityPack>();

  constructor() {
    // 默认注册内置能力包。未来这里可以改为动态发现（如读取 packages/capabilities/ 目录）
    this.register(searchCodeCapability);
    this.register(listIssuesCapability);
  }

  public register(pack: CapabilityPack) {
    if (this.packs.has(pack.metadata.id)) {
      throw new Error(`能力包 ${pack.metadata.id} 已经注册`);
    }
    this.packs.set(pack.metadata.id, pack);
  }

  /** 按阶段和能力类型获取能力子集 */
  public getCapabilities(stage?: string, kind?: CapabilityKind): CapabilityPack[] {
    const all = Array.from(this.packs.values());
    return all.filter(p => 
      (!stage || p.metadata.stage === stage) &&
      (!kind || p.metadata.kind === kind)
    );
  }

  public getById(id: string): CapabilityPack | undefined {
    return this.packs.get(id);
  }
}

// 导出单例供 MCP Server 使用
export const capabilityRegistry = new CapabilityRegistry();
