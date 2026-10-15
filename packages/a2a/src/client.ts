import type { AgentCard, Task, Message } from "./types";

export class A2AClient {
  constructor(private baseUrl: string) {}

  async getAgentCard(maxAttempts = 20): Promise<AgentCard> {
    let lastErr: any;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`${this.baseUrl}/.well-known/agent.json`);
        if (res.ok) return res.json();
        lastErr = new Error(`HTTP ${res.status}`);
      } catch (e) {
        lastErr = e;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`无法连接 ${this.baseUrl}：${lastErr?.message ?? lastErr}`);
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
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result as Task;
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
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result as Task;
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
