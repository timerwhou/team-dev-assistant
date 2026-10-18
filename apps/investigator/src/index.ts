import "@tda/core/lib/env";
import { createA2AServer } from "@tda/a2a";
import type { Artifact, Message, AgentCard } from "@tda/a2a";
import { runAgent } from "@tda/core";
import { executeToolCalls, openAITools } from "@tda/tools";

const PORT = Number(process.env.PORT || 4102);
const URL = `http://localhost:${PORT}`;
const WS_URL = `ws://localhost:${PORT}/stream`;

const card: AgentCard = {
  name: "Investigator Agent",
  description: "问题排查 Agent",
  url: URL,
  version: "0.1.0",
  protocolVersion: "1.1",
  supportedInterfaces: [
    { type: "http", url: URL, protocolVersions: ["1.0"] },
    { type: "websocket", url: WS_URL, protocolVersions: ["1.1"] },
  ],
  capabilities: { streaming: true, pushNotifications: false },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    { id: "investigate", name: "问题排查", description: "在代码库中定位问题，给出证据链", tags: ["investigate"] },
  ],
};

async function handler(messages: Message[]): Promise<Artifact[]> {
  const text = messages
    .flatMap((m) => m.parts)
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const allowedTools = openAITools.filter(
    (t) => t.type === "function" && ["read_file", "search_code", "list_issues"].includes(t.function.name)
  );

  const answer = await runAgent(
    "你是问题排查 Agent，输出 Markdown：结论、证据、建议。",
    text,
    { maxSteps: 8, tools: allowedTools, executeTools: executeToolCalls }
  );

  return [{ name: "investigation-report", parts: [{ type: "text", text: answer }] }];
}

const { listen } = createA2AServer(card, handler);
listen(PORT, () => console.error(`[investigator] on ${URL} (ws: ${WS_URL})`));
