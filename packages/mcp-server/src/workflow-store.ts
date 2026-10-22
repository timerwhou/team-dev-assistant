import fs from "node:fs";
import path from "node:path";
import { WorkflowManifestSchema, type WorkflowManifest, type WorkflowAsset } from "@tda/core";
import { randomUUID } from "node:crypto";

export class WorkflowStore {
  private dir: string;

  constructor(rootDir: string) {
    this.dir = path.join(rootDir, ".tda/workflows");
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  /** 
   * 🛡️ 安全防御：严格校验 ID 格式，阻断路径穿越 (Path Traversal)
   * 我们的 ID 均由 randomUUID() 生成，只允许 36 位标准 UUID 字符
   */
  private getFilePath(id: string): string | null {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(`[Security] 拦截非法 ID 访问: ${id}`);
      return null;
    }
    // 此时 id 已被正则严格约束，绝对不可能包含 ../ 或特殊字符
    return path.join(this.dir, `${id}.json`);
  }

  public listAssets(): WorkflowAsset[] {
    if (!fs.existsSync(this.dir)) return [];
    return fs.readdirSync(this.dir)
      .filter(f => f.endsWith(".json"))
      .map(f => JSON.parse(fs.readFileSync(path.join(this.dir, f), "utf-8")) as WorkflowAsset)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getAsset(id: string): WorkflowAsset | null {
    const filePath = this.getFilePath(id);
    if (!filePath) return null; // 非法 ID 直接返回 null
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as WorkflowAsset;
  }

  public createAsset(manifest: WorkflowManifest): WorkflowAsset {
    const id = randomUUID();
    const now = Date.now();
    const asset: WorkflowAsset = { id, name: manifest.name, manifest, createdAt: now, updatedAt: now, version: 1 };
    
    const filePath = this.getFilePath(id);
    if (!filePath) throw new Error("Internal Error: Invalid generated UUID");
    
    fs.writeFileSync(filePath, JSON.stringify(asset, null, 2), "utf-8");
    return asset;
  }

  public updateAsset(id: string, manifest: WorkflowManifest, expectedVersion?: number): { success: boolean; error?: string; asset?: WorkflowAsset } {
    const existing = this.getAsset(id);
    if (!existing) return { success: false, error: "Asset not found" };
    
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return { success: false, error: "Version conflict" };
    }

    const updated: WorkflowAsset = { 
      ...existing, 
      name: manifest.name, 
      manifest, 
      updatedAt: Date.now(), 
      version: existing.version + 1 
    };

    const filePath = this.getFilePath(id);
    if (!filePath) return { success: false, error: "Security violation" };

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
    return { success: true, asset: updated };
  }

  public deleteAsset(id: string): boolean {
    const filePath = this.getFilePath(id);
    if (!filePath) return false; // 非法 ID 直接返回 false
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}
