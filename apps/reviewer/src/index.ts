import "@tda/core/lib/env";
import { createA2AServer } from "@tda/a2a";
import { runAgent } from "@tda/core";
import { executeToolCalls, openAITools } from "@tda/tools";
import type { Artifact, Message } from "@tda/a2a";

const PORT = Number(process.env.PORT || 4101);

const card = {
  name: "Reviewer Agent",
  description: "代码评审 Agent",
  url: `http://localhost:${PORT}`,
  version: "0.1.0",
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [{ id: "code_review", name: "代码评审", description: "评审代码", tags: ["review"] }],
};

async function handler(messages: Message[]): Promise<Artifact[]> {
  const text = messages
    .flatMap((m) => m.parts)
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const allowedTools = openAITools.filter(
    (t) => t.type === "function" && ["read_file", "search_code"].includes(t.function.name)
  );

  const answer = await runAgent(
    "你是代码评审 Agent，输出 Markdown：结论、问题清单、评分。",
    text,
    { maxSteps: 6, tools: allowedTools, executeTools: executeToolCalls }
  );

  return [{ name: "review-report", parts: [{ type: "text", text: answer }] }];
}

const app = createA2AServer(card, handler);
app.listen(PORT, () => console.error(`[reviewer] on http://localhost:${PORT}`));
