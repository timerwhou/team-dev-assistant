import { z } from "zod";

export type CapabilityKind = "tool" | "retriever" | "skill";

export interface CapabilityMetadata {
  /** 唯一标识，例如 "native:search_code", "github:list_issues" */
  id: string;
  /** 暴露给外部客户端调用的名称，必须向后兼容，例如 "search_code" */
  name: string;
  /** 能力类型 */
  kind: CapabilityKind;
  /** 语义化版本 */
  version: string;
  /** 自然语言描述（供 LLM 理解） */
  description: string;
  /** 所属阶段，用于动态装配（如 "context-gathering", "execution"） */
  stage: string;
  /** 声明式副作用 */
  sideEffects: ("read" | "write" | "network")[];
}

export interface CapabilityContext {
  tenantId: string;
  rootDir: string;
  env: Record<string, string | undefined>;
}

export interface CapabilityResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

export interface CapabilityPack {
  metadata: CapabilityMetadata;
  /** 供 MCP 注册使用的 Zod Schema */
  inputSchema: z.ZodObject<any>;
  /** 执行逻辑 */
  execute: (params: any, context: CapabilityContext) => Promise<CapabilityResult>;
}
