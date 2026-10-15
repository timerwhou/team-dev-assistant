import { randomUUID } from "node:crypto";
import type {
  Reporter,
  TraceEvent,
  LLMCallTrace,
  AgentRunTrace,
  ToolCallTrace,
} from "./types";

/** 去掉 id/timestamp/kind，由 recorder 补齐 */
type EmitPayload<T extends TraceEvent> = Omit<T, "id" | "timestamp" | "kind">;

class Recorder {
  private reporters: Reporter[] = [];
  private enabled = process.env.TDA_TRACE !== "0";

  register(r: Reporter): void {
    this.reporters.push(r);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  emitLLMCall(payload: EmitPayload<LLMCallTrace>): void {
    this.emit({ ...payload, kind: "llm_call" } as TraceEvent);
  }

  emitAgentRun(payload: EmitPayload<AgentRunTrace>): void {
    this.emit({ ...payload, kind: "agent_run" } as TraceEvent);
  }

  emitToolCall(payload: EmitPayload<ToolCallTrace>): void {
    this.emit({ ...payload, kind: "tool_call" } as TraceEvent);
  }

  private emit(partial: Omit<TraceEvent, "id" | "timestamp"> & { id?: string; timestamp?: string }): void {
    if (!this.enabled) return;
    const full = {
      ...partial,
      id: partial.id ?? randomUUID(),
      timestamp: partial.timestamp ?? new Date().toISOString(),
    } as TraceEvent;
    for (const r of this.reporters) {
      try {
        void r.report(full);
      } catch {
        // trace 失败不影响业务
      }
    }
  }

  async flush(): Promise<void> {
    for (const r of this.reporters) {
      if (r.flush) await r.flush();
    }
  }
}

export const recorder = new Recorder();
