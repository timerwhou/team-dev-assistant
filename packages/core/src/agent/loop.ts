import OpenAI from "openai";
import { getClient, getModel } from "../lib/llm";
import type { ToolCallInput, ToolCallResult } from "./types";

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type ToolExecutor = (calls: ToolCallInput[]) => Promise<ToolCallResult[]>;

export type AgentOptions = {
  maxSteps?: number;
  verbose?: boolean;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  executeTools?: ToolExecutor;
};

export async function runAgent(
  system: string,
  user: string,
  opts: AgentOptions = {}
): Promise<string> {
  const maxSteps = opts.maxSteps ?? 8;
  const tools = opts.tools ?? [];
  const executeTools = opts.executeTools;

  const messages: Message[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let consecutiveFailures = 0;

  for (let step = 1; step <= maxSteps; step++) {
    const res = await getClient().chat.completions.create({
      model: getModel(),
      temperature: 0.2,
      messages,
      ...(tools.length > 0 ? { tools, tool_choice: "auto" as const } : {}),
    });

    const msg = res.choices[0].message;
    messages.push(msg);

    const toolCalls: ToolCallInput[] = [];
    for (const c of msg.tool_calls ?? []) {
      if (c.type !== "function") continue;
      toolCalls.push({
        id: c.id,
        function: { name: c.function.name, arguments: c.function.arguments },
      });
    }

    if (toolCalls.length === 0) return msg.content || "";
    if (!executeTools) return "未注入工具执行器，无法继续。";

    if (opts.verbose) {
      console.log(`\n[step ${step}] ${toolCalls.map((c) => c.function.name).join(", ")}`);
    }

    const results = await executeTools(toolCalls);

    for (const r of results) {
      if (opts.verbose) {
        console.log(`  ${r.ok ? "✅" : "❌"} ${r.name} (${r.durationMs}ms)${r.ok ? "" : " " + r.error}`);
      }
      messages.push({
        role: "tool",
        tool_call_id: r.toolCallId,
        content: JSON.stringify(r.ok ? r.result : { error: r.error }),
      });
    }

    const allFailed = results.length > 0 && results.every((r) => !r.ok);
    if (allFailed) {
      consecutiveFailures++;
      if (consecutiveFailures >= 2) {
        messages.push({
          role: "user",
          content: "连续多轮工具调用均失败，请停止调用工具，基于已有信息给出结论。",
        });
        const final = await getClient().chat.completions.create({
          model: getModel(),
          temperature: 0.2,
          messages,
        });
        return final.choices[0].message.content || "";
      }
    } else {
      consecutiveFailures = 0;
    }
  }

  return "达到最大步数仍未完成。";
}
