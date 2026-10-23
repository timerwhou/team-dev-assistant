export type AgentSkill = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
};

export type SupportedInterface = {
  type: "http" | "websocket" | "sse";
  url: string;
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

// ===== HITL 相关类型 =====

export type RequestState = {
  taskId: string;
  elicitId: string;
  inputSchema: Record<string, unknown>;
  expiresAt: string;
};

export type ElicitRequest = {
  taskId: string;
  elicitId: string;
  question: string;
  proposedAction?: string;
  proposedFact?: {
    title: string;
    content: string;
    domain: string;
  };
  inputSchema: Record<string, unknown>;
  expiresAt: string;
};

export class ElicitationRequired extends Error {
  constructor(public elicit: ElicitRequest) {
    super(`Elicitation required: ${elicit.question}`);
    this.name = "ElicitationRequired";
  }
}

export type Task = {
  id: string;
  status: TaskStatus;
  messages: Message[];
  artifacts: Artifact[];
  createdAt: string;
  updatedAt: string;
  requestState?: RequestState;
  pendingElicit?: ElicitRequest;
};

// ===== WebSocket JSON-RPC 通信类型 =====

export type WsRequest = {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params: unknown;
};

export type WsResponse = {
  jsonrpc: "2.0";
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
};
