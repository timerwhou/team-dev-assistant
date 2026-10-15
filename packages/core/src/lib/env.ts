import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../..");

// .env 优先加载，.env.local 只能补充不能覆盖。
// 若需覆盖，显式传 { override: true } 并说明理由。
dotenv.config({ path: path.resolve(rootDir, ".env") });
dotenv.config({ path: path.resolve(rootDir, ".env.local") });

export function getMonorepoRoot(): string {
  return rootDir;
}
