import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getMonorepoRoot } from "../lib/env";
import type { RemoteCapabilityManifest, RemoteRegistryOptions } from "./remote-types";
import { capabilityRegistry } from "./registry";
import type { CapabilityPack } from "./types";

export class RemoteCapabilityLoader {
  private cacheDir: string;
  private forceUpdate: boolean;

  constructor(options: RemoteRegistryOptions = {}) {
    this.cacheDir = options.cacheDir || path.join(getMonorepoRoot(), ".tda/plugins");
    this.forceUpdate = options.forceUpdate || false;

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  public async loadManifest(manifest: RemoteCapabilityManifest): Promise<void> {
    const safeName = manifest.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${safeName}-${manifest.version}.mjs`;
    const filePath = path.join(this.cacheDir, fileName);

    let needsDownload = this.forceUpdate || !fs.existsSync(filePath);

    // 1. 如果缓存文件存在，校验哈希
    if (!needsDownload) {
      const cachedData = fs.readFileSync(filePath);
      const cachedHash = crypto.createHash("sha256").update(cachedData).digest("hex");
      if (cachedHash !== manifest.sha256) {
        console.warn(`[Remote] 缓存哈希不匹配，重新下载: ${manifest.name}`);
        needsDownload = true;
      }
    }

    // 2. 下载并校验
    if (needsDownload) {
      console.log(`[Remote] 正在从远程拉取能力包: ${manifest.url}`);
      const response = await fetch(manifest.url);
      if (!response.ok) {
        throw new Error(`下载失败: HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const actualHash = crypto.createHash("sha256").update(buffer).digest("hex");
      if (actualHash !== manifest.sha256) {
        throw new Error(`🚨 供应链安全警报：哈希校验失败！\n预期: ${manifest.sha256}\n实际: ${actualHash}`);
      }

      fs.writeFileSync(filePath, buffer);
      console.log(`[Remote] 校验通过，已缓存至 ${fileName}`);
    }

    // 3. 动态加载并注册
    try {
      // 在 ESM 中，使用动态 import 加载本地文件 (需要 file:// 协议)
      const fileUrl = `file://${filePath}`;
      const module = await import(fileUrl);
      
      const packs: CapabilityPack[] = module.default || module.capabilities;
      if (!packs || !Array.isArray(packs)) {
        throw new Error("模块未导出有效的 CapabilityPack 数组 (需要 export default [])");
      }

      for (const pack of packs) {
        // 检查该能力包是否在清单中声明过，防止越权挂载
        if (!manifest.capabilities.includes(pack.metadata.name)) {
          console.warn(`[Remote] 跳过未在清单中声明的能力: ${pack.metadata.name}`);
          continue;
        }
        capabilityRegistry.register(pack);
        console.log(`[Remote] 成功挂载能力: ${pack.metadata.name} (来自 ${manifest.name})`);
      }
    } catch (e) {
      throw new Error(`动态加载能力包失败: ${(e as Error).message}`);
    }
  }
}
