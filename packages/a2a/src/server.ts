import express from "express";
import { createServer, type Server as HttpServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import type {
  AgentCard,
  Task,
  Message,
  Artifact,
  WsRequest,
  WsResponse,
  RequestState,
} from "./types";
import { ElicitationRequired } from "./types";

export type A2AHandler = (messages: Message[]) => Promise<Artifact[]>;

export type A2AServer = {
  app: express.Express;
  server: HttpServer;
  listen: (port: number, callback?: () => void) => HttpServer;
};

export function createA2AServer(card: AgentCard, handler: A2AHandler): A2AServer {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  const tasks = new Map<string, Task>();

  app.get("/.well-known/agent.json", (_req, res) => res.json(card));

  // ---------- HTTP JSON-RPC 端点（兼容 1.0） ----------
  app.post("/", async (req, res) => {
    const { jsonrpc, id, method, params } = req.body;
    const reply = (result: unknown, error?: { code: number; message: string }) =>
      res.json(error ? { jsonrpc: "2.0", id, error } : { jsonrpc: "2.0", id, result });

    try {
      if (method === "tasks/send") {
        const { id: taskId = randomUUID(), message } = params as { id?: string; message: Message };
        const task = createTask(taskId, message);
        tasks.set(taskId, task);
        runTask(task, handler);
        return reply(task);
      }
      if (method === "tasks/get") {
        const { id: taskId } = params as { id: string };
        const task = tasks.get(taskId);
        if (!task) return reply(null, { code: -32001, message: "Task not found" });
        return reply(task);
      }
      if (method === "tasks/resume") {
        const { requestState, inputResponses } = params as {
          requestState: RequestState;
          inputResponses: Record<string, unknown>;
        };
        const task = tasks.get(requestState.taskId);
        if (!task) return reply(null, { code: -32001, message: "Task not found" });
        if (task.status !== "input-required") {
          return reply(null, { code: -32002, message: `Task 状态不是 input-required（当前：${task.status}）` });
        }
        task.status = "working";
        task.pendingElicit = undefined;
        task.requestState = undefined;
        task.updatedAt = new Date().toISOString();
        task.messages.push({
          role: "user",
          parts: [{ type: "text", text: JSON.stringify(inputResponses) }],
          messageId: randomUUID(),
        });
        runTask(task, handler);
        return reply(task);
      }
      return reply(null, { code: -32601, message: `Method not found: ${method}` });
    } catch (e: any) {
      return reply(null, { code: -32603, message: e.message });
    }
  });

  // ---------- WebSocket 端点（1.1 BiDi） ----------
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: "/stream" });

  wss.on("connection", (ws: WebSocket) => {
    console.error("[ws] client connected");

    ws.on("message", async (data: string) => {
      let req: WsRequest;
      try {
        req = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ jsonrpc: "2.0", id: "", error: { code: -32700, message: "Parse error" } }));
        return;
      }

      const reply = (result: unknown, error?: { code: number; message: string }) => {
        const res: WsResponse = error
          ? { jsonrpc: "2.0", id: req.id, error }
          : { jsonrpc: "2.0", id: req.id, result };
        ws.send(JSON.stringify(res));
      };

      try {
        if (req.method === "tasks/send") {
          const { id: taskId = randomUUID(), message } = req.params as { id?: string; message: Message };
          const task = createTask(taskId, message);
          tasks.set(taskId, task);
          runTask(task, handler);
          return reply(task);
        }
        if (req.method === "tasks/get") {
          const { id: taskId } = req.params as { id: string };
          const task = tasks.get(taskId);
          if (!task) return reply(null, { code: -32001, message: "Task not found" });
          return reply(task);
        }
        if (req.method === "tasks/resume") {
          const { requestState, inputResponses } = req.params as {
            requestState: RequestState;
            inputResponses: Record<string, unknown>;
          };
          const task = tasks.get(requestState.taskId);
          if (!task) return reply(null, { code: -32001, message: "Task not found" });
          if (task.status !== "input-required") {
            return reply(null, { code: -32002, message: `Task 状态不是 input-required（当前：${task.status}）` });
          }
          task.status = "working";
          task.pendingElicit = undefined;
          task.requestState = undefined;
          task.updatedAt = new Date().toISOString();
          task.messages.push({
            role: "user",
            parts: [{ type: "text", text: JSON.stringify(inputResponses) }],
            messageId: randomUUID(),
          });
          runTask(task, handler);
          return reply(task);
        }
        return reply(null, { code: -32601, message: `Method not found: ${req.method}` });
      } catch (e: any) {
        return reply(null, { code: -32603, message: e.message });
      }
    });

    ws.on("close", () => {
      console.error("[ws] client disconnected");
    });
  });

  return {
    app,
    server,
    listen: (port, cb) => server.listen(port, cb),
  };
}

function createTask(id: string, message: Message): Task {
  return {
    id,
    status: "working",
    messages: [message],
    artifacts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requestState: undefined,
    pendingElicit: undefined,
  };
}

function runTask(task: Task, handler: A2AHandler) {
  handler(task.messages)
    .then((artifacts) => {
      task.artifacts = artifacts;
      task.status = "completed";
      task.updatedAt = new Date().toISOString();
    })
    .catch((e) => {
      if (e instanceof ElicitationRequired) {
        task.status = "input-required";
        task.pendingElicit = e.elicit;
        task.requestState = {
          taskId: task.id,
          elicitId: e.elicit.elicitId,
          inputSchema: e.elicit.inputSchema,
          expiresAt: e.elicit.expiresAt,
        };
        task.updatedAt = new Date().toISOString();
        return;
      }
      task.status = "failed";
      task.messages.push({
        role: "agent",
        parts: [{ type: "text", text: `失败：${e.message}` }],
        messageId: randomUUID(),
      });
      task.updatedAt = new Date().toISOString();
    });
}
