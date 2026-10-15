import { readFileTool } from "./read-file";
import { searchCodeTool } from "./search-code";
import { listIssuesTool } from "./list-issues";
import { toOpenAITool, type ToolDef } from "./registry";

export const tools: ToolDef[] = [readFileTool, searchCodeTool, listIssuesTool];
export const toolsByName = new Map(tools.map((t) => [t.name, t]));
export const openAITools = tools.map(toOpenAITool);

export * from "./registry";
export * from "./executor";
export type { ToolDef };
