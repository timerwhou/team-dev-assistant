import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import type { AgentCard, Message, Task, Artifact, RequestState } from "./types.js";
import { ElicitationRequired } from "./types.js";

type Handler = (messages: Message[], task?: Task) => Promise<Artifact[]>;

export function createA2AServer(card: AgentCard, handler: Handler) {
  const tasks = new Map<string, Task>();

  async function processTask(task: Task, messages: Message[]) {
    try {
      task.status = "working";
      task.updatedAt = new Date().toISOString();
      const artifacts = await handler(messages, task);
      task.artifacts = artifacts;
      task.status = "completed";
      task.messages = messages;
      task.updatedAt = new Date().toISOString();
    } catch (e) {
      if (e instanceof ElicitationRequired) {
        task.status = "input-required";
        // 🌟 强制注入真实的 taskId，防止子 Agent 传空字符串导致状态机崩溃
        task.pendingElicit = { ...(e as ElicitationRequired).elicit, taskId: task.id };
        task.updatedAt = new Date().toISOString();
      } else {
        task.status = "failed";
        task.updatedAt = new Date().toISOString();
        console.error("Task failed:", e);
      }
    }
  }

  function parseBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => resolve(body));
    });
  }

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");

    // GET /agent.json
    if (req.url === "/.well-known/agent.json" && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify(card));
      return;
    }

    // POST /
    if (req.url === "/" && req.method === "POST") {
      const body = await parseBody(req);
      const payload = JSON.parse(body);

      // 创建新任务
      if (payload.method === "tasks/send") {
        const taskId = randomUUID();
        const task: Task = {
          id: taskId,
          status: "submitted",
          messages: [],
          artifacts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        tasks.set(taskId, task);
        
        // 异步处理
        processTask(task, payload.params.messages);

        res.writeHead(200);
        res.end(JSON.stringify({ id: 1, result: { id: taskId, status: "submitted" } }));
        return;
      }

      // 恢复任务
      if (payload.method === "tasks/resume") {
        const { taskId, inputResponses } = payload.params;
        const task = tasks.get(taskId);
        if (!task) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "Task not found" }));
          return;
        }

        if (task.status !== "input-required") {
          res.writeHead(400);
          res.end(JSON.stringify({ error: `Task 状态不是 input-required（当前：${task.status}）` }));
          return;
        }

        // 清空挂起状态，将人类输入拼接到消息中
        task.pendingElicit = undefined;
        task.requestState = undefined;
        task.status = "working";
        task.messages.push({
          role: "user",
          messageId: randomUUID(),
          parts: [{ type: "data", data: inputResponses }],
        });

        processTask(task, task.messages);

        res.writeHead(200);
        res.end(JSON.stringify({ id: 1, result: { id: taskId, status: "working" } }));
        return;
      }
    }

    // GET /tasks/:id
    if (req.url?.startsWith("/tasks/") && req.method === "GET") {
      const taskId = req.url.split("/tasks/")[1];
      const task = tasks.get(taskId);
      if (!task) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Task not found" }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify(task));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  return { server, listen: (port: number, cb?: () => void) => server.listen(port, cb) };
}
