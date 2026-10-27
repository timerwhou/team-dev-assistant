import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { WorkflowManifest } from "@tda/core";
import type { FlowNode } from "./types";

// 🌟 Shadcn 官方必备的工具类型
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapNodesToManifest(
  nodes: FlowNode[],
  assetId?: string | null
): WorkflowManifest {
  const stagesSet = new Set<string>();
  const capsMap: Record<string, Set<string>> = {};

  for (const node of nodes) {
    const stage = String(node.data?.stage || "").trim();
    if (!stage) continue;
    stagesSet.add(stage);
    if (!capsMap[stage]) capsMap[stage] = new Set();
    const caps = node.data?.capabilities || [];
    if (Array.isArray(caps)) {
      for (const cap of caps) capsMap[stage].add(String(cap));
    }
  }

  const stages = Array.from(stagesSet);
  const stageCapabilities: Record<string, string[]> = {};
  for (const stage of stages) stageCapabilities[stage] = Array.from(capsMap[stage]);

  // 🌟 如果是新建工作流，自动生成 Webhook 触发器
  const triggers = assetId ? undefined : [{
    type: "webhook" as const,
    token: crypto.randomUUID(),
    secret: crypto.randomUUID(), // 实际生产环境应让用户自己填
  }];

  return {
    name: assetId ? "loaded-workflow" : `studio-workflow-${Date.now()}`,
    description: "Studio 生成的工作流",
    stages,
    stageCapabilities,
    governance: { maxIterations: 5, maxResultsPerTool: 3 },
    triggers,
  };
}
