import { test } from "node:test";
import assert from "node:assert/strict";
import { extractFactsFromCode } from "../src/playbook/scanner";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

test("extractFactsFromCode 支持多语言", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "playbook-test-"));
  
  // 模拟 TS 文件
  await fs.writeFile(
    path.join(tmpDir, "a.ts"),
    `// @fact [finance] 必须使用 CostService\nconst a = 1;\n`
  );
  
  // 模拟 Go 文件
  await fs.writeFile(
    path.join(tmpDir, "b.go"),
    `// @fact [auth] 必须使用 JWT\npackage main\n`
  );
  
  // 模拟 Python 文件
  await fs.writeFile(
    path.join(tmpDir, "c.py"),
    `# @fact [db] 禁止直接写 SQL\nprint("hi")\n`
  );

  const facts = await extractFactsFromCode(tmpDir);
  assert.equal(facts.length, 3);
  assert.equal(facts.find(f => f.domain === "finance")?.content, "必须使用 CostService");
  assert.equal(facts.find(f => f.domain === "auth")?.content, "必须使用 JWT");
  assert.equal(facts.find(f => f.domain === "db")?.content, "禁止直接写 SQL");
  
  await fs.rm(tmpDir, { recursive: true, force: true });
});
