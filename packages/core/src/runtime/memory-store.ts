import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "../lib/env";
import type { AgenticTraceEvent, LlmCallRecord } from "./agentic-types";

export interface ExecutionRecord {
  workflowId: string;
  requirement: string;
  iterations: number;
  status: "completed" | "failed" | "aborted";
  trace: AgenticTraceEvent[];
  llmCalls?: LlmCallRecord[]; // 🌟 新增：LLM 交互记录
  timestamp: number;
  seq: number;
}

export class MemoryStore {
  private memoryPath: string;
  private records: ExecutionRecord[] = [];
  private seqCounter = 0;

  constructor(customPath?: string) {
    this.memoryPath = customPath || path.join(getMonorepoRoot(), ".tda/trace-history.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const content = fs.readFileSync(this.memoryPath, "utf-8");
        this.records = JSON.parse(content);
        if (this.records.length > 0) {
          this.seqCounter = Math.max(...this.records.map(r => r.seq || 0));
        }
      }
    } catch {
      this.records = [];
    }
  }

  private save() {
    const dir = path.dirname(this.memoryPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.records = this.records.slice(-100);
    fs.writeFileSync(this.memoryPath, JSON.stringify(this.records, null, 2), "utf-8");
  }

  public recordTrace(
    workflowId: string, 
    requirement: string, 
    trace: AgenticTraceEvent[], 
    iterations: number, 
    status: "completed" | "failed" | "aborted" = "completed",
    llmCalls?: LlmCallRecord[]
  ) {
    this.seqCounter++;
    this.records.push({
      workflowId,
      requirement,
      iterations,
      status,
      trace,
      llmCalls, // 🌟 存入 LLM 交互
      timestamp: Date.now(),
      seq: this.seqCounter
    });
    this.save();
  }

  public listRecentExecutions(limit = 20): Pick<ExecutionRecord, "workflowId" | "requirement" | "status" | "timestamp" | "iterations">[] {
    return this.records
      .sort((a, b) => b.seq - a.seq)
      .slice(0, limit)
      .map(({ workflowId, requirement, status, timestamp, iterations }) => ({
        workflowId, requirement, status, timestamp, iterations
      }));
  }

  public getTrace(workflowId: string): ExecutionRecord | undefined {
    return this.records.find(r => r.workflowId === workflowId);
  }
}
