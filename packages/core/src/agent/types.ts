export type ToolCallInput = {
  id: string;
  function: { name: string; arguments: string };
};

export type ToolCallResult = {
  toolCallId: string;
  name: string;
  ok: boolean;
  result?: unknown;
  error?: string;
  durationMs: number;
};
