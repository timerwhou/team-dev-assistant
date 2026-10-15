import "@tda/core/lib/env";
import { createA2AServer } from "@tda/a2a";
import { runAgent } from "@tda/core";
import { executeToolCalls, openAITools } from "@tda/tools";
import type { Artifact, Message } from "@tda/a2a";

const PORT = Number(process.env.PORT || 4102);

const card = {
  name: "Investigator Agent",
  description: "问题排查 Agent",
  url: `http://localhost:${PORT}`,
  version: "0.1.0",
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "investigate",
      name: "问题排查",
      description: "在代码库中定位问题，给出证据链",
      tags: ["investigate"],
    },
  ],
};

async function handler(messages: Message[]): Promise<Artifact[]> {
  const text = messages
    .flatMap((m) => m.parts)
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const allowedTools = openAITools.filter(
    (t) =>
      t.type === "function" &&
      ["read_file", "search_code", "list_issues"].includes(t.function.name)
  );

  const answer = await runAgent(
    `你是问题排查 Agent，在代码库中定位问题，给出证据链。
输出 Markdown：## 结论、## 证据（文件:行号）、## 建议、## 未能确认的信息。
工作纪律：
1. 优先 search_code 定位，不要凭空猜文件名。
2. read_file 报「文件不存在」时先 search_code 确认路径。
3. 同一工具同样参数失败 2 次，换思路。`,
    text,
    { maxSteps: 8, tools: allowedTools, executeTools: executeToolCalls }
  );

  return [{ name: "investigation-report", parts: [{ type: "text", text: answer }] }];
}

const app = createA2AServer(card, handler);
app.listen(PORT, () => console.error(`[investigator] on http://localhost:${PORT}`));
