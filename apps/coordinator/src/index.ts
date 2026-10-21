import { savePlaybookEntry } from "@tda/core";
import type { WorkflowManifest } from "@tda/core";
import { agentRegistry } from "@tda/core";
import "@tda/core/lib/env";
import { A2AClient } from "@tda/a2a";
import type { Task } from "@tda/a2a";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const REVIEWER_URL = process.env.REVIEWER_URL || "http://localhost:4101";
const INVESTIGATOR_URL = process.env.INVESTIGATOR_URL || "http://localhost:4102";

// 1. 注册可用的 Agent
agentRegistry.register({
  name: "reviewer",
  url: REVIEWER_URL,
  supportedStages: ["execution"],
});
agentRegistry.register({
  name: "investigator",
  url: INVESTIGATOR_URL,
  supportedStages: ["context-gathering"],
});

async function waitForAgent(client: A2AClient, name: string): Promise<void> {
  const start = Date.now();
  const timeout = 20000;
  while (Date.now() - start < timeout) {
    try {
      await client.getAgentCard(1);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`${name} 未在 ${timeout}ms 内就绪`);
}

// (保留原有的 waitForCompletionWithHITL 函数)
async function waitForCompletionWithHITL(
  client: A2AClient,
  taskId: string,
  kind: string,
  timeoutMs = 120000
): Promise<Task> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const task = await client.getTask(taskId);

    if (task.status === "completed" || task.status === "failed") {
      return task;
    }

    if (task.status === "input-required") {
      console.log(`\n🤖 [${kind}] Agent 需要澄清：`);
      console.log(`   ${task.pendingElicit?.question}`);

      const rl = readline.createInterface({ input: stdin, output: stdout });
      const answer = await rl.question("   请输入 (y/n): ");
      rl.close();

      const isConfirmed = answer.toLowerCase() === "y";

      if (isConfirmed) {
        try {
          const factTitle = task.pendingElicit?.question?.slice(0, 30) || "HITL 确认的业务约束";
          const result = savePlaybookEntry({
            type: "fact",
            domain: "hitl-capture",
            title: `HITL 确认：${factTitle}`,
            decision: task.pendingElicit?.question || "人类确认了 Agent 的修改提案",
            rationale: "通过 HITL 交互确认，人类认可了此方案，作为业务基线沉淀。",
            content: `Agent 提议：${task.pendingElicit?.question}\n\n人类操作：确认通过 (y)`,
          });

          if (result.status === "pending_review") {
            console.log(`   ⚠️ [Playbook] 检测到与 ${result.conflicts?.length} 条现有记忆冲突，已存入待处理区。`);
          } else {
            console.log(`   📚 [Playbook] 已自动沉淀决策到 docs/playbook/`);
          }
        } catch (e) {
          console.error("   ⚠️ [Playbook] 沉淀失败:", e);
        }
      }

      console.log(`   ✅ 已提交人类输入，Agent 继续执行...`);
      await client.resumeTask(task.requestState!, { confirm: isConfirmed });
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("等待任务超时");
}

async function main() {
  // 🌟 新的入口逻辑：接收 Workflow Manifest JSON 和初始需求
  const manifestJson = process.argv[2];
  const requirement = process.argv[3];

  if (!manifestJson || !requirement) {
    console.error("用法: pnpm dev '<manifest-json>' '<requirement>'");
    process.exit(1);
  }

  let manifest: WorkflowManifest;
  try {
    manifest = JSON.parse(manifestJson);
  } catch (e) {
    console.error("❌ Manifest 解析失败:", e);
    process.exit(1);
  }

  console.log(`\n🚀 启动多 Agent 工作流: [${manifest.name}]`);
  console.log(`   需求: ${requirement}\n`);

  // 预检：确保所有所需阶段都有 Agent 承接
  for (const stage of manifest.stages) {
    const agent = agentRegistry.getAgentForStage(stage);
    if (!agent) {
      console.error(`❌ 没有 Agent 能处理阶段 [${stage}]，请检查注册配置。`);
      process.exit(1);
    }
  }

  // 按阶段顺序执行
  for (const stage of manifest.stages) {
    const agentProfile = agentRegistry.getAgentForStage(stage)!;
    console.log(`\n⏳ 进入阶段: [${stage}] -> 分配给 Agent: ${agentProfile.name}`);
    
    const client = new A2AClient(agentProfile.url);
    await waitForAgent(client, agentProfile.name);

    // 将需求发给该 Agent
    const task = await client.sendTask(requirement);
    
    // 等待执行完成（带 HITL）
    const final = await waitForCompletionWithHITL(client, task.id, agentProfile.name);
    
    console.log(`\n✅ 阶段 [${stage}] 完成 (${final.status})`);
    
    // 打印该阶段的输出
    for (const msg of final.messages) {
      const text = msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n");
      if (text) console.log(`[${msg.role}] ${text}\n`);
    }
    for (const a of final.artifacts) {
      for (const p of a.parts) {
        if (p.type === "text") console.log(p.text);
      }
    }
  }

  console.error("\n🎉 工作流全部完成");
}

main().catch((e) => {
  console.error("[coordinator] 错误:", e);
  process.exit(1);
});
