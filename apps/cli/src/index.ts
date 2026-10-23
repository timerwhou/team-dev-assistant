import "@tda/core/lib/env";
import { runAgent, getContextPackAsync, extractFactsFromCode, getMonorepoRoot, runAgenticInject } from "@tda/core";
import { recorder, createJsonlReporter, createConsoleReporter } from "@tda/core";
import { executeToolCalls, openAITools, toolsByName } from "@tda/tools";
import { skillsByName, listSkills } from "@tda/skills";
import fs from "node:fs";
import path from "node:path";
import { ConflictService } from "./services/conflict";
import { TodoService } from "./services/todo";
import { GitHubSyncProvider } from "./services/todo-sync";
import { PlanService } from "./services/plan";
import type { PlanOutput } from "./services/plan";
import { PlanSyncProvider } from "./services/plan-sync";
import { InitOrchestrator } from "./services/code-understanding/orchestrator";
import readline from "node:readline/promises";

recorder.register(createJsonlReporter());
if (process.env.TDA_TRACE_CONSOLE === "1") {
  recorder.register(createConsoleReporter());
}

export function parseSkillArgs(
  argv: string[],
  skill: { parameters: { shape?: Record<string, unknown> } }
): { args: Record<string, unknown>; positional: string[] } {
  const args: Record<string, unknown> = {};
  const positional: string[] = [];
  for (const token of argv) {
    const m = token.match(/^--?([\w-]+)=(.*)$/);
    if (m) {
      args[m[1]] = m[2];
    } else if (token.startsWith("--") || token.startsWith("-")) {
      args[token.replace(/^-+/, "")] = true;
    } else {
      positional.push(token);
    }
  }
  const shape = skill.parameters?.shape ?? {};
  const keys = Object.keys(shape);
  let i = 0;
  for (const key of keys) {
    if (i >= positional.length) break;
    if (args[key] === undefined) {
      args[key] = positional[i++];
    }
  }
  return { args, positional };
}

async function main() {
  const argv = process.argv.slice(2);
  const raw = argv.join(" ").trim();

  if (!raw) {
    console.log("请提供命令。可用命令：\n" + listSkills());
    process.exitCode = 1;
    return;
  }

  // === 拦截 /init ===
  if (raw.startsWith("/init")) {
    console.log("🔍 正在启动代码骨架扫描...");
    
    // 🌟 修复路径漂移：优先使用 --path 参数，其次使用当前工作目录 (cwd)
    let root = process.cwd();
    const pathArgMatch = raw.match(/--path=([^\s]+)/);
    if (pathArgMatch) {
      root = path.resolve(pathArgMatch[1]);
    } else {
      // 如果没有传参数，但当前目录恰好是 team-dev-assistant，依然使用 cwd 兜底
      root = process.cwd(); 
    }
    
    console.log(`📂 扫描目标目录: ${root}`);
    const orchestrator = new InitOrchestrator();
    const skeletons = await orchestrator.execute(root);

    if (skeletons.length === 0) {
      console.log("⚠️ 未识别到受支持的语言（TS/JS, Python）。");
      return;
    }

    console.log(`✅ 识别到 ${skeletons.length} 种语言架构：`);
    skeletons.forEach(s => console.log(`  - ${s.language} (类型: ${s.projectType}, 精度: ${s.accuracy}), ${s.routes.length} 路由, ${s.services.length} 服务`));

    console.log("🤖 正在请求大模型推断业务事实（生成草案）...");
    const skeletonSummary = skeletons.map(s => `
语言: ${s.language} (类型: ${s.projectType})
路由: ${s.routes.join(", ")}
服务: ${s.services.map(x => `${x.name}(${x.methods.join(", ")})`).join("; ")}
环境变量: ${s.envVars.join(", ")}
`).join("\n---\n");

    const prompt = `以下是一个项目的多语言代码骨架。请推断这些结构可能的业务含义，并生成 3-5 条高价值的“业务事实（Fact）”。
格式：- [domain] 事实内容

【骨架】
${skeletonSummary}`;

    try {
      const result = await runAgent("你是一个资深的软件架构师。", prompt, {
        maxSteps: 1,
        tools: [],
        executeTools: async () => [],
      });

      console.log("\n=== 生成的 Fact 草案 ===\n");
      console.log(result);
      console.log("\n========================\n");

      const pendingDir = path.join(root, ".tda/playbook/.pending");
      if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });
      
      const filename = `init-draft-${Date.now()}.md`;
      fs.writeFileSync(path.join(pendingDir, filename), result, "utf-8");
      
      console.log(`✅ Fact 草案已保存至 .tda/playbook/.pending/${filename}`);
      console.log("👉 请审查后运行 /review-conflicts 批量采纳。");
    } catch (e: any) {
      console.error("❌ 推断失败:", e.message);
    }
    return;
  }

  // === 拦截 /inject ===
  if (raw.startsWith("/inject ")) {
    const argsStr = raw.slice(8).trim();
    const isAgentic = argsStr.includes("--agentic");
    const requirement = argsStr.replace("--agentic", "").trim();

    if (isAgentic) {
      console.log("🤖 已开启 Agentic 模式，正在执行多轮深挖检索...");
      const result = await runAgenticInject(requirement, 3);
      
      console.log(`\n=== Agentic 检索完成 (共 ${result.iterations} 轮) ===\n`);
      console.log(result.text);
      console.log("=====================================\n");
      
      if (process.env.TDA_TRACE === "1") {
        console.log("🔍 Agentic Trace:");
        console.table(result.trace);
      }
    } else {
      const pack = await getContextPackAsync(requirement);
      if (!pack) {
        console.log("⚠️ 未找到相关上下文，请确保 docs/playbook 中已沉淀相关资产。");
      } else {
        console.log("\n=== 请复制以下内容发送给外部模型 ===\n");
        console.log(pack);
        console.log("=====================================\n");
      }
    }
    return;
  }

  // === 拦截 /sync-facts ===
  if (raw === "/sync-facts") {
    console.log("正在扫描代码中的 @fact 注释...");
    const root = getMonorepoRoot();
    const facts = await extractFactsFromCode(root);
    
    if (facts.length === 0) {
      console.log("✅ 未发现新的 @fact 注释。");
    } else {
      console.log(`✅ 发现 ${facts.length} 条事实，请参考 .tda 目录下的日志。`);
    }
    return;
  }

  // === 拦截 /todo ===
  if (raw.startsWith("/todo")) {
    const todoService = new TodoService();
    const syncProvider = new GitHubSyncProvider();
    todoService.registerSyncProvider(syncProvider);

    if (raw === "/todo list") {
      const todos = todoService.list();
      console.log(todos.length === 0 ? "✅ 暂无待处理任务" : JSON.stringify(todos, null, 2));
      return;
    }
    const desc = raw.slice(5).trim();
    const result = await todoService.add(desc);
    console.log(`✅ 任务已记录：${result.id}`);
    return;
  }

  // === 拦截 /plan ===
  if (raw.startsWith("/plan ")) {
    const requirement = raw.slice(6).trim();
    const planService = new PlanService();
    const syncProvider = new PlanSyncProvider();
    planService.registerSyncProvider(syncProvider);

    const { tasks, contextCount } = await planService.generate(requirement);
    console.log(`\n✅ 规划完成 (读取了 ${contextCount} 条上下文)：\n`);
    tasks.forEach((t, i) => console.log(`${i + 1}. ${t.title}${t.dependsOn ? ` (依赖: ${t.dependsOn})` : ""}\n   ${t.description}\n`));
    return;
  }

  // === 拦截 /review-conflicts ===
  if (raw === "/review-conflicts") {
    const conflictService = new ConflictService();
    const pending = conflictService.listPending();
    if (pending.length === 0) {
      console.log("✅ 无待处理冲突。");
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    for (const p of pending) {
      console.log(`\n冲突: ${p.title}`);
      console.log(`内容: ${p.content}`);
      const answer = await rl.question("采纳? (y/n): ");
      if (answer.toLowerCase() === "y") {
        conflictService.resolve(p.id, true);
      } else {
        conflictService.resolve(p.id, false);
      }
    }
    rl.close();
    return;
  }

  // === Agent 技能拦截 ===
  const parts = raw.split(/\s+/);
  const command = parts[0];
  const skillName = command.startsWith("/") ? command.slice(1) : command;
  const skill = skillsByName.get(skillName);

  if (!skill) {
    console.error(`未知命令：${command}\n\n可用命令：\n${listSkills()}`);
    process.exitCode = 2;
    return;
  }

  const { args, positional } = parseSkillArgs(parts.slice(1), skill);
  const result = await skill.execute(args, positional);
  if (result) console.log(result);
}

main().catch((e) => {
  console.error("执行失败:", e);
  process.exit(1);
});
