import { z } from "zod";
import type OpenAI from "openai";

export type ToolDef<T extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  parameters: T;
  readOnly: boolean;
  execute: (args: z.infer<T>) => Promise<unknown>;
};

export function defineTool<T extends z.ZodType>(def: ToolDef<T>): ToolDef<T> {
  return def;
}

export function toOpenAITool(tool: ToolDef): OpenAI.Chat.Completions.ChatCompletionTool {
  const zz = z as unknown as { toJSONSchema?: (s: unknown) => Record<string, unknown> };
  if (!zz.toJSONSchema) {
    throw new Error("需要 Zod v4 的 z.toJSONSchema，请升级 zod@latest");
  }
  const schema = zz.toJSONSchema(tool.parameters) as Record<string, unknown>;
  delete schema.$schema;
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: schema,
    },
  };
}
