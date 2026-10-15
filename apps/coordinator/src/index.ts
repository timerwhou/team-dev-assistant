import "@tda/core/lib/env";
import { A2AClient } from "@tda/a2a";
import type { Task } from "@tda/a2a";

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

async function main() {
  const code = process.argv[2] || "";
  const question = process.argv[3] || "";

  const reviewer = new A2AClient("http://localhost:4101");
  const investigator = new A2AClient("http://localhost:4102");

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
    const final = await job.client.waitForCompletion(job.task.id);
    console.log(`\n=== ${job.kind} (${final.status}) ===\n`);

    // 打印所有消息（含失败信息）
    for (const msg of final.messages) {
      const text = msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n");
      if (text) console.log(`[${msg.role}] ${text}\n`);
    }

    // 打印 artifact
    for (const a of final.artifacts) {
      for (const p of a.parts) {
        if (p.type === "text") console.log(p.text);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
