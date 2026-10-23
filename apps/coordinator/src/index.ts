import { savePlaybookEntry } from "@tda/core";
import type { WorkflowManifest } from "@tda/core";
import { agentRegistry } from "@tda/core";
import "@tda/core/lib/env";
import { A2AClient } from "@tda/a2a";
import type { Task } from "@tda/a2a";
import { a2aBus } from "./bus";

const REVIEWER_URL = process.env.REVIEWER_URL || "http://localhost:4101";
const INVESTIGATOR_URL = process.env.INVESTIGATOR_URL || "http://localhost:4102";

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

/**
 * 异步执行工作流（非阻塞）
 */
export async function runWorkflow(manifest: WorkflowManifest, requirement: string): Promise<string> {
  const workflowId = `wf-${Date.now()}`;
  console.log(`\n🚀 启动异步工作流 [${workflowId}]: ${manifest.name}`);

  // 异步执行，不阻塞主进程
  (async () => {
    try {
      for (const stage of manifest.stages) {
        const agentProfile = agentRegistry.getAgentForStage(stage);
        if (!agentProfile) throw new Error(`没有 Agent 能处理阶段 [${stage}]`);

        const client = new A2AClient(agentProfile.url);
        await waitForAgent(client, agentProfile.name);

        // 发送任务
        const task = await client.sendTask(requirement);
        a2aBus.publish(workflowId, { type: "task-updated", workflowId, task });

        // 轮询状态
        let finalTask = task;
        while (finalTask.status !== "completed" && finalTask.status !== "failed" && finalTask.status !== "input-required") {
          await new Promise(r => setTimeout(r, 1000));
          finalTask = await client.getTask(task.id);
          a2aBus.publish(workflowId, { type: "task-updated", workflowId, task: finalTask });
        }

        if (finalTask.status === "input-required") {
          console.log(`\n⏸️ 工作流 [${workflowId}] 挂起，等待人类审批...`);
          return; // 直接退出异步循环，等待外部 API 唤醒
        }

        if (finalTask.status === "failed") {
          throw new Error(`阶段 [${stage}] 失败`);
        }
      }
      a2aBus.publish(workflowId, { type: "workflow-completed", workflowId });
      console.log(`\n🎉 工作流 [${workflowId}] 全部完成`);
    } catch (e: any) {
      a2aBus.publish(workflowId, { type: "workflow-failed", workflowId, message: e.message });
      console.error(`\n❌ 工作流 [${workflowId}] 失败:`, e.message);
    }
  })();

  return workflowId;
}

// 支持 CLI 调用
async function main() {
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

  await runWorkflow(manifest, requirement);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("[coordinator] 错误:", e);
    process.exit(1);
  });
}
