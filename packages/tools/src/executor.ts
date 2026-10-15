import type { ToolCallInput, ToolCallResult } from "@tda/core";
import { toolsByName } from "./index";

function formatError(e: any): string {
  if (e?.issues) return e.issues.map((i: any) => `参数 ${i.path.join(".")}：${i.message}`).join("；");
  return e?.message || String(e);
}

export async function executeToolCall(call: ToolCallInput): Promise<ToolCallResult> {
  const start = Date.now();
  const tool = toolsByName.get(call.function.name);
  if (!tool) {
    return { toolCallId: call.id, name: call.function.name, ok: false, error: `未注册：${call.function.name}`, durationMs: 0 };
  }
  try {
    const rawArgs = call.function.arguments ? JSON.parse(call.function.arguments) : {};
    const args = tool.parameters.parse(rawArgs);
    const result = await Promise.race([
      tool.execute(args),
      new Promise((_, rej) => setTimeout(() => rej(new Error("工具超时 15s")), 15000)),
    ]);
    return { toolCallId: call.id, name: tool.name, ok: true, result, durationMs: Date.now() - start };
  } catch (e: any) {
    return { toolCallId: call.id, name: call.function.name, ok: false, error: formatError(e), durationMs: Date.now() - start };
  }
}

export async function executeToolCalls(calls: ToolCallInput[]): Promise<ToolCallResult[]> {
  const readOnly: ToolCallInput[] = [];
  const write: ToolCallInput[] = [];
  for (const c of calls) {
    const t = toolsByName.get(c.function.name);
    (t?.readOnly ? readOnly : write).push(c);
  }
  const [r1, r2] = await Promise.all([
    Promise.all(readOnly.map(executeToolCall)),
    (async () => {
      const out: ToolCallResult[] = [];
      for (const c of write) out.push(await executeToolCall(c));
      return out;
    })(),
  ]);
  return [...r1, ...r2];
}
