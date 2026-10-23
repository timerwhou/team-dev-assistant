import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { runAgent, MemoryStore } from "@tda/core";
import { InitOrchestrator } from "../services/code-understanding/orchestrator";
import type { CLICommand } from "./types";

export const initCommand: CLICommand = {
  name: "init",
  description: "智能冷启动：扫描代码骨架并生成 Fact 草案",
  async execute({ raw }) {
    console.log("🔍 正在启动代码骨架扫描...");
    
    let root = process.cwd();
    const pathArgMatch = raw.match(/--path=([^\s]+)/);
    if (pathArgMatch) root = path.resolve(pathArgMatch[1]);
    const isVerbose = raw.includes("--verbose");

    console.log(`📂 扫描目标目录: ${root}`);

    const orchestrator = new InitOrchestrator();
    const skeletons = await orchestrator.execute(root);

    if (skeletons.length === 0) {
      console.log("⚠️ 未识别到受支持的语言。");
      return;
    }

    console.log(`✅ 识别到 ${skeletons.length} 种语言架构：`);
    skeletons.forEach(s => console.log(`  - ${s.language} (${s.projectType}), ${s.routes.length} 路由, ${s.services.length} 服务`));

    const skeletonSummary = skeletons.map(s => `语言: ${s.language}\n路由: ${s.routes.join(", ")}\n服务: ${s.services.map(x => `${x.name}(${x.methods.join(", ")})`).join("; ")}\n环境变量: ${s.envVars.join(", ")}`).join("\n---\n");

    const prompt = `以下是一个项目的多语言代码骨架。请推断这些结构可能的业务含义，并生成 3-5 条高价值的“业务事实（Fact）”。\n格式：- [domain] 事实内容\n\n【骨架】\n${skeletonSummary}`;

    if (isVerbose) {
      console.log("\n=== 📤 发送给大模型的 Prompt ===\n");
      console.log(prompt);
      console.log("\n===============================\n");
    }

    console.log("🤖 正在请求大模型推断业务事实...");
    try {
      const startTime = Date.now();
      const result = await runAgent("你是一个资深的软件架构师。", prompt, { maxSteps: 1, tools: [], executeTools: async () => [] });
      const durationMs = Date.now() - startTime;

      console.log("\n=== 生成的 Fact 草案 ===\n" + result + "\n========================\n");

      // 🌟 保存 Fact 草案
      const pendingDir = path.join(root, ".tda/playbook/.pending");
      if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });
      const filename = `init-draft-${Date.now()}.md`;
      fs.writeFileSync(path.join(pendingDir, filename), result, "utf-8");
      
      // 🌟 统一记录到 trace-history.json
      const workflowId = `init-${Date.now()}`;
      const store = new MemoryStore(path.join(root, ".tda/trace-history.json"));
      store.recordTrace(
        workflowId,
        "System Init Scan",
        [{ iteration: 1, action: "complete", detail: "AI 推断完成", timestamp: Date.now() }],
        1,
        "completed",
        [{
          callId: crypto.randomUUID(),
          prompt,
          response: result,
          durationMs,
          timestamp: Date.now()
        }]
      );
      
      console.log(`✅ Fact 草案已保存至 ${filename}`);
      console.log(`📝 LLM 交互记录已统一归档至 .tda/trace-history.json`);
      console.log("👉 请运行 /review-conflicts 批量采纳。");
    } catch (e: any) {
      console.error("❌ 推断失败:", e.message);
    }
  },
};
