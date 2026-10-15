import express from "express";
import { randomUUID } from "node:crypto";
import type { AgentCard, Task, Message, Artifact } from "./types";

export type A2AHandler = (messages: Message[]) => Promise<Artifact[]>;

export function createA2AServer(card: AgentCard, handler: A2AHandler) {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  const tasks = new Map<string, Task>();

  app.get("/.well-known/agent.json", (_req, res) => res.json(card));

  app.post("/", async (req, res) => {
    const { jsonrpc, id, method, params } = req.body;
    const reply = (result: unknown, error?: { code: number; message: string }) =>
      res.json(error ? { jsonrpc: "2.0", id, error } : { jsonrpc: "2.0", id, result });

    try {
      if (method === "tasks/send") {
        const { id: taskId = randomUUID(), message } = params as { id?: string; message: Message };
        const task: Task = {
          id: taskId,
          status: "working",
          messages: [message],
          artifacts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        tasks.set(taskId, task);
        handler(task.messages)
          .then((artifacts) => {
            task.artifacts = artifacts;
            task.status = "completed";
            task.updatedAt = new Date().toISOString();
          })
          .catch((e) => {
            task.status = "failed";
            task.messages.push({
              role: "agent",
              parts: [{ type: "text", text: `失败：${e.message}` }],
              messageId: randomUUID(),
            });
            task.updatedAt = new Date().toISOString();
          });
        return reply(task);
      }
      if (method === "tasks/get") {
        const { id: taskId } = params as { id: string };
        const task = tasks.get(taskId);
        if (!task) return reply(null, { code: -32001, message: "Task not found" });
        return reply(task);
      }
      return reply(null, { code: -32601, message: `Method not found: ${method}` });
    } catch (e: any) {
      return reply(null, { code: -32603, message: e.message });
    }
  });

  return app;
}
