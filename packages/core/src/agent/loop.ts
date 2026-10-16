import OpenAI from "openai";
import { tracedChatCompletion, getModel } from "../lib/llm";
import { recorder } from "../trace/recorder";
import { compressToolResult } from "../context/compressor";
import type { CompressorOptions } from "../context/types";
import type { ToolCallInput, ToolCallResult } from "./types";

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type ToolExecutor = (calls: ToolCallInput[]) => Promise<ToolCallResult[]>;

export type AgentOptions = {
  /** 工具结果压缩配置（传给 compressToolResult） */
  compressorOptions?: CompressorOptions;
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
  const runStart = Date.now();
  const maxSteps = opts.maxSteps ?? 8;
  const tools = opts.tools ?? [];
  const executeTools = opts.executeTools;

  let steps = 0;
  let toolCallCount = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCostUSD = 0;
  let stopReason: string | undefined;

  const messages: Message[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let consecutiveFailures = 0;
  let totalToolCalls = 0;

  const seenFiles = new Set<string>();
  let lastSeenSize = 0;
  let saturatedTurns = 0;
  const MAX_SATURATED_TURNS = 2;

  const callLLM = async (msgs: Message[]): Promise<OpenAI.Chat.Completions.ChatCompletion> => {
    const res = await tracedChatCompletion({
      model: getModel(),
      temperature: 0.2,
      messages: msgs,
      ...(tools.length > 0 ? { tools, tool_choice: "auto" as const } : {}),
    } as any);
    const u = res.usage;
    if (u) {
      totalPromptTokens += u.prompt_tokens ?? 0;
      totalCompletionTokens += u.completion_tokens ?? 0;
    }
    return res;
  };

  try {
    for (let step = 1; step <= maxSteps; step++) {
      steps = step;
      const remaining = maxSteps - step;
      if (remaining <= 1) {
        messages.push({
          role: "user",
          content: `[系统提示] 剩余 ${remaining + 1} 步。请基于已有信息立即输出最终结论，不要再调用工具。`,
        });
      }

      const res = await callLLM(messages);
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

      if (toolCalls.length === 0) {
        return msg.content || "";
      }
      if (!executeTools) {
        stopReason = "no_executor";
        return "未注入工具执行器，无法继续。";
      }

      totalToolCalls += toolCalls.length;
      toolCallCount += toolCalls.length;

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
        // 压缩工具结果（Story #37）
        let toolContent: string;
        if (r.ok) {
          const compressed = compressToolResult(r.name, r.result, opts.compressorOptions);
          toolContent = compressed.content;
          if (opts.verbose && compressed.compressed) {
            console.log(
              `    📦 压缩 ${r.name}: ${compressed.beforeTokens} → ${compressed.afterTokens} tokens（${compressed.reason}）`
            );
          }
        } else {
          toolContent = JSON.stringify({ error: r.error });
        }
        messages.push({
          role: "tool",
          tool_call_id: r.toolCallId,
          content: toolContent,
        });
      }

      // 语义进展
      for (const r of results) {
        if (!r.ok) continue;
        const result = r.result as any;
        if (r.name === "search_code" && Array.isArray(result?.matches)) {
          for (const m of result.matches) if (m?.file) seenFiles.add(m.file);
        }
        if (r.name === "read_file" && result?.path) {
          seenFiles.add(result.path);
        }
      }

      // 收口 1：连续失败
      const allFailed = results.length > 0 && results.every((r) => !r.ok);
      if (allFailed) {
        consecutiveFailures++;
        if (consecutiveFailures >= 2) {
          stopReason = "consecutive_failures";
          return forceConclusion(messages, "连续多轮工具调用失败", callLLM);
        }
      } else {
        consecutiveFailures = 0;
      }

      // 收口 2：检索饱和
      if (seenFiles.size === lastSeenSize) {
        saturatedTurns++;
        if (saturatedTurns >= MAX_SATURATED_TURNS) {
          stopReason = "saturated";
          return forceConclusion(
            messages,
            `检索已饱和（连续 ${MAX_SATURATED_TURNS} 轮无新文件，共 ${seenFiles.size} 个）`,
            callLLM
          );
        }
      } else {
        saturatedTurns = 0;
        lastSeenSize = seenFiles.size;
      }

      // 收口 3：工具总量
      if (totalToolCalls >= maxSteps * 3) {
        stopReason = "tool_limit";
        return forceConclusion(messages, `工具调用已达 ${totalToolCalls} 次`, callLLM);
      }
    }

    // 收口 4：跑满步数
    stopReason = "max_steps";
    return forceConclusion(messages, "已达最大步数", callLLM);
  } finally {
    recorder.emitAgentRun({
      durationMs: Date.now() - runStart,
      steps,
      toolCalls: toolCallCount,
      totalPromptTokens,
      totalCompletionTokens,
      totalCostUSD,
      stopReason,
    });
  }
}

async function forceConclusion(
  messages: Message[],
  reason: string,
  callLLM: (msgs: Message[]) => Promise<OpenAI.Chat.Completions.ChatCompletion>
): Promise<string> {
  messages.push({
    role: "user",
    content: `[系统提示] ${reason}。请立即停止调用工具，基于已有信息输出最终结论。即使信息不完整，也要明确说明：1) 当前能确定什么；2) 无法确认什么；3) 建议下一步怎么做。`,
  });
  const final = await callLLM(messages);
  return final.choices[0].message.content || "（模型未返回内容）";
}
