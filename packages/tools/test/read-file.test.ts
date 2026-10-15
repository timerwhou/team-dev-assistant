import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileTool } from "../src/read-file";

test("read_file 拒绝路径穿越", async () => {
  const attacks = [
    "../../../../etc/passwd",
    "../../package.json",
    "/etc/passwd",
    "apps/../../../etc/passwd",
  ];
  for (const p of attacks) {
    await assert.rejects(
      () => readFileTool.execute({ path: p }),
      /越权/,
      `应拒绝：${p}`
    );
  }
});

test("read_file 放行合法路径", async () => {
  const r = await readFileTool.execute({ path: "package.json" });
  assert.ok((r as any).content);
});
