import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "../../lib/env";
import type { Reporter, TraceEvent } from "../types";

export function createJsonlReporter(opts: { dir?: string } = {}): Reporter {
  const dir = opts.dir ?? path.resolve(getMonorepoRoot(), ".traces");
  fs.mkdirSync(dir, { recursive: true });

  // 按日期分文件：.traces/2026-10-15.jsonl
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(dir, `${date}.jsonl`);
  const stream = fs.createWriteStream(file, { flags: "a" });

  return {
    name: "jsonl",
    report(event: TraceEvent) {
      stream.write(JSON.stringify(event) + "\n");
    },
    flush() {
      return new Promise((resolve) => stream.end(resolve));
    },
  };
}
