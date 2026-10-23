import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "@tda/core";

export class ConflictService {
  private pendingDir: string;

  constructor(customDir?: string) {
    // 🌟 允许外部传入目录（如 /init 扫描的目录），默认回退到根目录
    const baseDir = customDir || getMonorepoRoot();
    this.pendingDir = path.join(baseDir, ".tda/playbook/.pending");
  }

  public getPendingDir(): string {
    return this.pendingDir;
  }

  list(): string[] {
    if (!fs.existsSync(this.pendingDir)) return [];
    return fs.readdirSync(this.pendingDir).filter(f => f.endsWith(".md"));
  }

  approve(fileName: string): void {
    const srcPath = path.join(this.pendingDir, fileName);
    const destPath = path.join(getMonorepoRoot(), "docs/playbook", fileName);
    if (!fs.existsSync(srcPath)) throw new Error("文件不存在");

    let content = fs.readFileSync(srcPath, "utf-8");
    content = content.replace(/^status:\s*pending_review/m, "status: active");
    content = content.replace(/^conflict_with:.*$/m, "");
    content = content.replace(/^\n\n/, "\n");

    fs.writeFileSync(destPath, content, "utf-8");
    fs.unlinkSync(srcPath);
  }

  reject(fileName: string): void {
    const filePath = path.join(this.pendingDir, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
