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

  private getFilePath(id: string): string {
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
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as WorkflowAsset;
  }

  public createAsset(manifest: WorkflowManifest): WorkflowAsset {
    const id = randomUUID();
    const now = Date.now();
    const asset: WorkflowAsset = { id, name: manifest.name, manifest, createdAt: now, updatedAt: now, version: 1 };
    fs.writeFileSync(this.getFilePath(id), JSON.stringify(asset, null, 2), "utf-8");
    return asset;
  }

  public updateAsset(id: string, manifest: WorkflowManifest, expectedVersion?: number): { success: boolean; error?: string; asset?: WorkflowAsset } {
    const existing = this.getAsset(id);
    if (!existing) return { success: false, error: "Asset not found" };
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return { success: false, error: "Version conflict" };
    }

    const updated: WorkflowAsset = { ...existing, name: manifest.name, manifest, updatedAt: Date.now(), version: existing.version + 1 };
    fs.writeFileSync(this.getFilePath(id), JSON.stringify(updated, null, 2), "utf-8");
    return { success: true, asset: updated };
  }

  public deleteAsset(id: string): boolean {
    const filePath = this.getFilePath(id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}
