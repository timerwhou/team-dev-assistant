import "@tda/core/lib/env";
import { createA2AServer, ElicitationRequired } from "@tda/a2a";
import type { Artifact, Message, AgentCard, Task } from "@tda/a2a";
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

// 🌟 重构后的 handler：接收完整的 Task 对象，用于判断是否恢复
async function handler(messages: Message[], task?: Task): Promise<Artifact[]> {
  const text = messages
    .flatMap((m) => m.parts)
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const targetText = text.replace(/review:/g, "").trim() || "src/index.ts";

  // 如果 Task 没有 requestState/pendingElicit，说明是第一次触发，抛出 Elicitation
  if (!task?.pendingElicit && !task?.requestState) {
    // 但注意：如果是通过 resumeTask 恢复，task.status 已经被置为 working
    // 所以我们应该在原始消息里找是否有 confirm 的 data
    const hasConfirm = messages.some(m => 
      m.parts.some(p => p.type === "data" && (p.data as any).confirm === true)
    );
    
    if (!hasConfirm) {
      throw new ElicitationRequired({
        taskId: task?.id || "",
        elicitId: `elicit-${Date.now()}`,
        question: `你确定要让我评审文件 ${targetText} 吗？`,
        proposedAction: `执行代码评审: ${targetText}`,
        proposedFact: {
          title: `已评审文件: ${targetText}`,
          content: `Reviewer 对该文件进行了静态分析并输出了评审报告。`,
          domain: "code-review"
        },
        inputSchema: {
          type: "object",
          properties: { confirm: { type: "boolean" } },
          required: ["confirm"],
        },
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });
    }
  }

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
