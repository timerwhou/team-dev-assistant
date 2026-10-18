import "@tda/core/lib/env";
import { createA2AServer, ElicitationRequired } from "@tda/a2a";
import type { Artifact, Message, AgentCard } from "@tda/a2a";
import { runAgent } from "@tda/core";
import { executeToolCalls, openAITools } from "@tda/tools";

const PORT = Number(process.env.PORT || 4101);
const URL = `http://localhost:${PORT}`;
const WS_URL = `ws://localhost:${PORT}/stream`;

const card: AgentCard = {
  name: "Reviewer Agent",
  description: "代码评审 Agent",
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
  skills: [{ id: "code_review", name: "代码评审", description: "评审代码", tags: ["review"] }],
};

async function handler(messages: Message[]): Promise<Artifact[]> {
  const text = messages
    .flatMap((m) => m.parts)
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  // 如果包含 [elicit] 且只有这一条消息，说明是第一次触发，抛出 Elicitation
  const hasElicit = text.includes("[elicit]");
  const isResumed = text.includes("confirm");

  if (hasElicit && !isResumed) {
    throw new ElicitationRequired({
      taskId: "", 
      elicitId: "demo-elicit-1",
      question: "你确定要让我评审这个文件吗？（输入 confirm 确认）",
      inputSchema: {
        type: "object",
        properties: { confirm: { type: "boolean" } },
        required: ["confirm"],
      },
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
  }

  // 如果是恢复后的执行，提取原始的文件名（去掉 [elicit] 前缀）
  const targetText = text.replace(/\[elicit\]/g, "").replace(/\{.*\}/g, "").trim() || "src/index.ts";

  const allowedTools = openAITools.filter(
    (t) => t.type === "function" && ["read_file", "search_code"].includes(t.function.name)
  );

  const answer = await runAgent(
    "你是代码评审 Agent，输出 Markdown：结论、问题清单、评分。",
    `请评审以下文件：${targetText}`,
    { maxSteps: 6, tools: allowedTools, executeTools: executeToolCalls }
  );

  return [{ name: "review-report", parts: [{ type: "text", text: answer }] }];
}

const { listen } = createA2AServer(card, handler);
listen(PORT, () => console.error(`[reviewer] on ${URL} (ws: ${WS_URL})`));
