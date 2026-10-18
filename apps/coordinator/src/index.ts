import "@tda/core/lib/env";
import { A2AClient } from "@tda/a2a";
import type { Task } from "@tda/a2a";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const REVIEWER_URL = process.env.REVIEWER_URL || "http://localhost:4101";
const INVESTIGATOR_URL = process.env.INVESTIGATOR_URL || "http://localhost:4102";

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
 * 等待任务完成，如果遇到 input-required，弹出 CLI 提示人类输入。
 */
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
      // 人类介入
      console.log(`\n🤖 [${kind}] Agent 需要澄清：`);
      console.log(`   ${task.pendingElicit?.question}`);

      const rl = readline.createInterface({ input: stdin, output: stdout });
      const answer = await rl.question("   请输入 (y/n): ");
      rl.close();

      console.log(`   ✅ 已提交人类输入，Agent 继续执行...`);

      await client.resumeTask(task.requestState!, {
        confirm: answer.toLowerCase() === "y",
      });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("等待任务超时");
}

async function main() {
  const code = process.argv[2] || "";
  const question = process.argv[3] || "";

  console.error(`[coordinator] reviewer=${REVIEWER_URL} investigator=${INVESTIGATOR_URL}`);
  console.error(`[coordinator] 参数: code=${JSON.stringify(code)}, question=${JSON.stringify(question)}`);

  const reviewer = new A2AClient(REVIEWER_URL);
  const investigator = new A2AClient(INVESTIGATOR_URL);

  console.error("[coordinator] 等待 Agent 就绪...");
  await Promise.all([
    waitForAgent(reviewer, "reviewer"),
    waitForAgent(investigator, "investigator"),
  ]);
  console.error("[coordinator] Agent 就绪");

  const jobs: { client: A2AClient; task: Task; kind: string }[] = [];

  if (code) {
    const task = await reviewer.sendTask(code);
    jobs.push({ client: reviewer, task, kind: "review" });
  }
  if (question) {
    const task = await investigator.sendTask(question);
    jobs.push({ client: investigator, task, kind: "investigate" });
  }

  for (const job of jobs) {
    const final = await waitForCompletionWithHITL(job.client, job.task.id, job.kind);
    console.log(`\n=== ${job.kind} (${final.status}) ===\n`);

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

  console.error("[coordinator] 全部完成");
}

main().catch((e) => {
  console.error("[coordinator] 错误:", e);
  process.exit(1);
});
