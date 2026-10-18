import WebSocket from "ws";
import type { AgentCard, Task, Message, WsRequest, WsResponse, RequestState } from "./types";

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

  // ---------- HTTP 请求（兼容 1.0） ----------
  private async rpc<T>(method: string, params: unknown): Promise<T> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method,
        params,
      }),
    });
    const json = (await res.json()) as JsonRpcResponse<T>;
    if (json.error) throw new Error(json.error.message);
    if (json.result === undefined) throw new Error("响应缺少 result");
    return json.result;
  }

  async sendTask(text: string, taskId?: string): Promise<Task> {
    const message: Message = {
      role: "user",
      parts: [{ type: "text", text }],
      messageId: crypto.randomUUID(),
    };
    return this.rpc<Task>("tasks/send", { id: taskId, message });
  }

  async getTask(taskId: string): Promise<Task> {
    return this.rpc<Task>("tasks/get", { id: taskId });
  }

  async resumeTask(requestState: RequestState, inputResponses: Record<string, unknown>): Promise<Task> {
    return this.rpc<Task>("tasks/resume", { requestState, inputResponses });
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

  // ---------- WebSocket 连接（1.1 BiDi） ----------
  async connectWebSocket(): Promise<WebSocketConnection> {
    const wsUrl = this.baseUrl.replace(/^http/, "ws") + "/stream";
    return new WebSocketConnection(wsUrl);
  }
}

export class WebSocketConnection {
  private ws: WebSocket;
  private pending = new Map<string, (res: WsResponse) => void>();

  constructor(private url: string) {
    this.ws = new WebSocket(url);
    this.ws.on("message", (data: string) => {
      try {
        const res: WsResponse = JSON.parse(data.toString());
        const handler = this.pending.get(res.id);
        if (handler) {
          this.pending.delete(res.id);
          handler(res);
        }
      } catch {
        // ignore
      }
    });
  }

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.once("open", resolve);
      this.ws.once("error", reject);
    });
  }

  async rpc<T>(method: string, params: unknown): Promise<T> {
    const req: WsRequest = {
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method,
      params,
    };
    return new Promise((resolve, reject) => {
      this.pending.set(req.id, (res) => {
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result as T);
      });
      this.ws.send(JSON.stringify(req));
    });
  }

  async sendTask(text: string, taskId?: string): Promise<Task> {
    const message: Message = {
      role: "user",
      parts: [{ type: "text", text }],
      messageId: crypto.randomUUID(),
    };
    return this.rpc<Task>("tasks/send", { id: taskId, message });
  }

  close(): void {
    this.ws.close();
  }
}
