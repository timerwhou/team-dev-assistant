import "dotenv/config";
import { A2AClient } from "@tda/a2a";

async function main() {
  const code = process.argv[2] || "";
  const question = process.argv[3] || "";

  const reviewer = new A2AClient("http://localhost:4101");
  const investigator = new A2AClient("http://localhost:4102");

  console.log("[coordinator] 等待 Agent 就绪...");
  await Promise.all([reviewer.getAgentCard(), investigator.getAgentCard()]);
  console.log("[coordinator] Agent 就绪");

  const jobs: { client: A2AClient; task: any; kind: string }[] = [];
  if (code) jobs.push({ client: reviewer, task: await reviewer.sendTask(code), kind: "review" });
  if (question) jobs.push({ client: investigator, task: await investigator.sendTask(question), kind: "investigate" });

  for (const job of jobs) {
    const final = await job.client.waitForCompletion(job.task.id);
    console.log(`\n=== ${job.kind} (${final.status}) ===`);
    for (const a of final.artifacts) {
      for (const p of a.parts) if (p.type === "text") console.log(p.text);
    }
  }
}

main().catch(console.error);
