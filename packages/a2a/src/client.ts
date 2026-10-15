import type { AgentCard, Task, Message } from "./types";

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: string;
  result?: T;
  error?: { code: number; message: string };
};

export class A2AClient {
  constructor(private baseUrl: string) {}

  async getAgentCard(maxAttempts = 20): Promise<AgentCard> {
    let lastErr: unknown;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`${this.baseUrl}/.well-known/agent.json`);
        if (res.ok) {
          return (await res.json()) as AgentCard;
        }
        lastErr = new Error(`HTTP ${res.status}`);
      } catch (e) {
        lastErr = e;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    throw new Error(`无法连接 ${this.baseUrl}：${msg}`);
  }

  async sendTask(text: string, taskId?: string): Promise<Task> {
    const message: Message = {
      role: "user",
      parts: [{ type: "text", text }],
      messageId: crypto.randomUUID(),
    };
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tasks/send",
        params: { id: taskId, message },
      }),
    });
    const json = (await res.json()) as JsonRpcResponse<Task>;
    if (json.error) throw new Error(json.error.message);
    if (!json.result) throw new Error("响应缺少 result");
    return json.result;
  }

  async getTask(taskId: string): Promise<Task> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tasks/get",
        params: { id: taskId },
      }),
    });
    const json = (await res.json()) as JsonRpcResponse<Task>;
    if (json.error) throw new Error(json.error.message);
    if (!json.result) throw new Error("响应缺少 result");
    return json.result;
  }

  async waitForCompletion(taskId: string, timeoutMs = 120000): Promise<Task> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const task = await this.getTask(taskId);
      if (task.status === "completed" || task.status === "failed") return task;
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error("等待任务超时");
  }
}
