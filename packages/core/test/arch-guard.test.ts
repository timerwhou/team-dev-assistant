import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("架构守护测试 (Fitness Function)", () => {
  test("Registry 文件禁止包含具体业务逻辑 (防止代码堆砌)", () => {
    const registryPath = path.join(process.cwd(), "src/runtime/registry.ts");
    if (fs.existsSync(registryPath)) {
      const content = fs.readFileSync(registryPath, "utf-8");
      // 规则：registry.ts 里不应该出现 long function 或具体的 search/list_issues 实现
      assert.ok(!content.includes("async execute"), "❌ 违规：请在 capabilities/ 目录下新建独立文件，不要污染 registry.ts");
    }
  });

  test("前端 Svelte 禁止直接引用后端敏感代码", () => {
    const studioPage = path.join(process.cwd(), "../../apps/studio/src/routes/+page.svelte");
    if (fs.existsSync(studioPage)) {
      const content = fs.readFileSync(studioPage, "utf-8");
      assert.ok(!content.includes("from \"node:fs\""), "❌ 违规：前端严禁使用 node:fs，请通过 API 交互");
    }
  });
});
