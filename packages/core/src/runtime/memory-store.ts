import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getMonorepoRoot } from "../lib/env";

export interface ExecutionMemory {
  requirementHash: string;
  requirementSample: string;
  successfulIterations: number;
  lastExecutedAt: number;
  executionCount: number;
}

export class MemoryStore {
  private memoryPath: string;
  private memory: Record<string, ExecutionMemory> = {};

  constructor(customPath?: string) {
    this.memoryPath = customPath || path.join(getMonorepoRoot(), ".tda/memory.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const content = fs.readFileSync(this.memoryPath, "utf-8");
        this.memory = JSON.parse(content);
      }
    } catch {
      this.memory = {};
    }
  }

  private save() {
    const dir = path.dirname(this.memoryPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.memoryPath, JSON.stringify(this.memory, null, 2), "utf-8");
  }

  private hash(requirement: string): string {
    // 去除空格并转小写，做一个基础的语义归一化
    const normalized = requirement.replace(/\s+/g, "").toLowerCase();
    return crypto.createHash("md5").update(normalized).digest("hex");
  }

  /** 获取特定需求的历史经验（平均收敛轮数） */
  public getExpectedIterations(requirement: string): number | null {
    const hash = this.hash(requirement);
    const record = this.memory[hash];
    if (!record) return null;
    return Math.ceil(record.successfulIterations / record.executionCount);
  }

  /** 记录一次执行经验 */
  public recordExecution(requirement: string, iterations: number) {
    const hash = this.hash(requirement);
    const existing = this.memory[hash];
    
    if (existing) {
      existing.successfulIterations += iterations;
      existing.executionCount += 1;
      existing.lastExecutedAt = Date.now();
    } else {
      this.memory[hash] = {
        requirementHash: hash,
        requirementSample: requirement.slice(0, 50),
        successfulIterations: iterations,
        lastExecutedAt: Date.now(),
        executionCount: 1,
      };
    }
    this.save();
  }
}
