import fs from "node:fs";
import path from "node:path";
import { WorkflowManifestSchema, type WorkflowManifest } from "@tda/core";

export class WorkflowStore {
  private dir: string;

  constructor(rootDir: string) {
    // 存放在当前租户目录下的 .tda/workflows/ 中
    this.dir = path.join(rootDir, ".tda/workflows");
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  /** 列出所有已保存的工作流 */
  public list(): WorkflowManifest[] {
    if (!fs.existsSync(this.dir)) return [];
    const files = fs.readdirSync(this.dir).filter(f => f.endsWith(".json"));
    return files.map(f => {
      const content = fs.readFileSync(path.join(this.dir, f), "utf-8");
      return JSON.parse(content) as WorkflowManifest;
    });
  }

  /** 保存（覆盖或新建）一个工作流 */
  public save(manifest: WorkflowManifest): void {
    // 文件名基于 name 做脱敏处理
    const safeName = manifest.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(this.dir, `${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2), "utf-8");
  }

  /** 校验并保存（供 API 调用） */
  public validateAndSave(rawData: unknown): { success: boolean; error?: string } {
    const parseResult = WorkflowManifestSchema.safeParse(rawData);
    if (!parseResult.success) {
      return { 
        success: false, 
        error: parseResult.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ") 
      };
    }
    
    this.save(parseResult.data);
    return { success: true };
  }
}
