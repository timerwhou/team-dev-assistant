export type AgentSkill = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
};

/** A2A 传输接口声明 */
export type SupportedInterface = {
  /** 接口类型 */
  type: "http" | "websocket" | "sse";
  /** 端点 URL */
  url: string;
  /** 支持的协议版本 */
  protocolVersions: string[];
};

export type AgentCard = {
  name: string;
  description: string;
  url: string;
  version: string;
  protocolVersion: string;
  supportedInterfaces: SupportedInterface[];
  capabilities: { streaming: boolean; pushNotifications: boolean };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
};

export type Part =
  | { type: "text"; text: string }
  | { type: "data"; data: Record<string, unknown> };

export type Message = {
  role: "user" | "agent";
  parts: Part[];
  messageId: string;
};

export type TaskStatus =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "failed"
  | "canceled";

export type Artifact = { name: string; parts: Part[] };

export type Task = {
  id: string;
  status: TaskStatus;
  messages: Message[];
  artifacts: Artifact[];
  createdAt: string;
  updatedAt: string;
};

/** WebSocket 帧（JSON-RPC 2.0） */
export type WsRequest = {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params?: unknown;
};

export type WsResponse = {
  jsonrpc: "2.0";
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
};
