import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 动态向上查找 monorepo 根目录（兼容源码运行与 tsup 打包后的产物）
function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // 如果找不到，兜底返回当前起始目录的父级
  return path.resolve(startDir, "../../../..");
}

const rootDir = findMonorepoRoot(__dirname);

// .env 优先加载，.env.local 只能补充不能覆盖。
dotenv.config({ path: path.resolve(rootDir, ".env") });
dotenv.config({ path: path.resolve(rootDir, ".env.local") });

export function getMonorepoRoot(): string {
  return rootDir;
}
