import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { runAgenticInject } from "../src/runtime/agentic-presets";
import { getMonorepoRoot } from "../src/lib/env";

describe("Workflow Fact 沉淀测试", () => {
  // 🌟 使用 getMonorepoRoot() 获取绝对的 Playbook 路径
  const playbookDir = path.join(getMonorepoRoot(), "docs/playbook");
  let filesBefore: Set<string>;

  test("成功闭环后应将 Trace 沉淀为 Workflow Fact", async () => {
    // 确保目录存在
    if (!fs.existsSync(playbookDir)) {
      fs.mkdirSync(playbookDir, { recursive: true });
    }
    
    filesBefore = new Set(fs.readdirSync(playbookDir));
    
    await runAgenticInject("这是一个用于测试轨迹沉淀的独特需求", 2);
    
    const filesAfter = fs.readdirSync(playbookDir);
    const newFiles = filesAfter.filter(f => !filesBefore.has(f) && f.includes("执行轨迹"));
    
    assert.ok(newFiles.length > 0, "应当在 docs/playbook 目录下生成新的轨迹文件");
    
    // 清理生成的测试文件，保持工作区干净
    for (const f of newFiles) {
      fs.unlinkSync(path.join(playbookDir, f));
    }
  });
});
