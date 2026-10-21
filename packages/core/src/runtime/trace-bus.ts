import { EventEmitter } from "node:events";
import type { AgenticTraceEvent } from "./agentic-types";

export interface TracePayload {
  workflowId: string;
  event: AgenticTraceEvent;
}

class TraceBus extends EventEmitter {
  private static instance: TraceBus;

  private constructor() {
    super();
    // 防止无监听器导致进程崩溃
    this.setMaxListeners(100);
  }

  public static getInstance(): TraceBus {
    if (!TraceBus.instance) {
      TraceBus.instance = new TraceBus();
    }
    return TraceBus.instance;
  }

  public publish(workflowId: string, event: AgenticTraceEvent) {
    this.emit("trace", { workflowId, event });
    // 也支持按 workflowId 单独订阅
    this.emit(`trace:${workflowId}`, event);
  }
}

export const traceBus = TraceBus.getInstance();
