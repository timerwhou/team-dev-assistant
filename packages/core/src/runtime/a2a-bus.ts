import { EventEmitter } from "node:events";

export interface A2AEvent {
  type: "task-updated" | "workflow-completed" | "workflow-failed";
  workflowId: string;
  // 🌟 使用轻量的结构化类型，不依赖 @tda/a2a 的具体实现
  task?: {
    id: string;
    status: string;
    [key: string]: unknown;
  };
  message?: string;
}

class A2ABus extends EventEmitter {
  private static instance: A2ABus;
  private constructor() {
    super();
    this.setMaxListeners(100);
  }
  public static getInstance(): A2ABus {
    if (!A2ABus.instance) A2ABus.instance = new A2ABus();
    return A2ABus.instance;
  }
  public publish(workflowId: string, event: A2AEvent) {
    this.emit("a2a", event);
    this.emit(`a2a:${workflowId}`, event);
  }
}

export const a2aBus = A2ABus.getInstance();
