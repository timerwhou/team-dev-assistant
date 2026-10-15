export type AgentSkill = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
};

export type AgentCard = {
  name: string;
  description: string;
  url: string;
  version: string;
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

export type TaskStatus = "submitted" | "working" | "completed" | "failed" | "canceled";

export type Artifact = { name: string; parts: Part[] };

export type Task = {
  id: string;
  status: TaskStatus;
  messages: Message[];
  artifacts: Artifact[];
  createdAt: string;
  updatedAt: string;
};
