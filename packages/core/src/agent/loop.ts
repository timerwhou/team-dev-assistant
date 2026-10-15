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
  let totalToolCalls = 0;

  // ===== 语义进展信号 =====
  const seenFiles = new Set<string>();
  let lastSeenSize = 0;
  let saturatedTurns = 0;
  const MAX_SATURATED_TURNS = 2;

  for (let step = 1; step <= maxSteps; step++) {
    // 倒数第 2 步开始，提示模型收敛
    const remaining = maxSteps - step;
    if (remaining <= 1) {
      messages.push({
        role: "user",
        content: `[系统提示] 剩余 ${remaining + 1} 步。请基于已有信息立即输出最终结论，不要再调用工具。`,
      });
    }

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

    totalToolCalls += toolCalls.length;

    if (opts.verbose) {
      console.log(`\n[step ${step}] ${toolCalls.map((c) => c.function.name).join(", ")}`);
    }

    const results = await executeTools(toolCalls);

    for (const r of results) {
      if (opts.verbose) {
        console.log(
          `  ${r.ok ? "✅" : "❌"} ${r.name} (${r.durationMs}ms)${r.ok ? "" : " " + r.error}`
        );
      }
      messages.push({
        role: "tool",
        tool_call_id: r.toolCallId,
        content: JSON.stringify(r.ok ? r.result : { error: r.error }),
      });
    }

    // ===== 更新已检索文件集合 =====
    for (const r of results) {
      if (!r.ok) continue;
      const result = r.result as any;
      // search_code 返回 { matches: [{ file, line, text }] }
      if (r.name === "search_code" && Array.isArray(result?.matches)) {
        for (const m of result.matches) {
          if (m?.file) seenFiles.add(m.file);
        }
      }
      // read_file 返回 { path, totalLines, content }
      if (r.name === "read_file" && result?.path) {
        seenFiles.add(result.path);
      }
    }

    // ===== 收口机制 1：连续失败 =====
    const allFailed = results.length > 0 && results.every((r) => !r.ok);
    if (allFailed) {
      consecutiveFailures++;
      if (consecutiveFailures >= 2) {
        return forceConclusion(messages, "连续多轮工具调用失败");
      }
    } else {
      consecutiveFailures = 0;
    }

    // ===== 收口机制 2：检索饱和（连续两轮无新文件） =====
    if (seenFiles.size === lastSeenSize) {
      saturatedTurns++;
      if (saturatedTurns >= MAX_SATURATED_TURNS) {
        return forceConclusion(
          messages,
          `检索已饱和（连续 ${MAX_SATURATED_TURNS} 轮无新文件，共 ${seenFiles.size} 个）`
        );
      }
    } else {
      saturatedTurns = 0;
      lastSeenSize = seenFiles.size;
    }

    // ===== 收口机制 3：工具调用总量 =====
    if (totalToolCalls >= maxSteps * 3) {
      return forceConclusion(messages, `工具调用已达 ${totalToolCalls} 次`);
    }
  }

  // ===== 收口机制 4：跑满步数 =====
  return forceConclusion(messages, "已达最大步数");
}

async function forceConclusion(messages: Message[], reason: string): Promise<string> {
  messages.push({
    role: "user",
    content: `[系统提示] ${reason}。请立即停止调用工具，基于已有信息输出最终结论。即使信息不完整，也要明确说明：1) 当前能确定什么；2) 无法确认什么；3) 建议下一步怎么做。`,
  });
  const final = await getClient().chat.completions.create({
    model: getModel(),
    temperature: 0.2,
    messages,
  });
  return final.choices[0].message.content || "（模型未返回内容）";
}
