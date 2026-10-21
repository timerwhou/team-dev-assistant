import type { WorkflowManifest } from "./workflow-types";
import { capabilityRegistry } from "./registry";
import type { CapabilityPack, CapabilityKind } from "./types";

export class WorkflowParser {
  /**
   * 根据 Manifest 和当前阶段，解析出需要挂载的能力包
   */
  public static resolveCapabilities(manifest: WorkflowManifest, stage: string): CapabilityPack[] {
    const allowedKinds = manifest.stageCapabilities[stage];
    if (!allowedKinds || allowedKinds.length === 0) {
      return []; // 该阶段未声明能力
    }
    
    // 去注册中心捞取符合当前阶段能力类型的能力包
    const allPacks = capabilityRegistry.getCapabilities();
    return allPacks.filter(pack => allowedKinds.includes(pack.metadata.kind));
  }
}
