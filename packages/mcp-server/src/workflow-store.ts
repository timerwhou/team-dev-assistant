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
   * 🛡️ 安全防御：彻底物理隔离。
   * 如果 ID 不是标准 UUID，直接返回 null，绝不拼接到 path 中。
   * 增加 JSON.stringify 阻断 Log Injection。
   */
  private getFilePath(id: string): string | null {
    // 1. 严格匹配 UUID，不匹配直接拒绝
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (!isUuid) {
      // 使用 JSON.stringify 处理日志，防止换行符注入
      console.error(`[Security] 拦截非法 ID 访问: ${JSON.stringify(id)}`);
      return null;
    }

    // 2. 再次进行边界校验，确保拼接后的路径在根目录之下
    const resolvedPath = path.resolve(this.dir, `${id}.json`);
    if (!resolvedPath.startsWith(path.resolve(this.dir) + path.sep)) {
      console.error("[Security] 检测到路径越界攻击");
      return null;
    }

    return resolvedPath;
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
    if (!filePath) return null;
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
    if (!filePath) return false;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}
