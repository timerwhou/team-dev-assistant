import { z } from "zod";

export const WorkflowManifestSchema = z.object({
  name: z.string().describe("工作流名称，如 code-review"),
  description: z.string().describe("工作流用途描述"),
  stages: z.array(z.string()).describe("阶段序列，例如 ['context-gathering', 'analysis', 'execution']"),
  stageCapabilities: z.record(z.string(), z.array(z.string())).describe("每个阶段允许激活的能力类型，如 { 'context-gathering': ['tool', 'retriever'] }"),
  governance: z.object({
    maxIterations: z.number().int().positive().optional().default(5),
    maxResultsPerTool: z.number().int().positive().optional().default(3),
  }).optional(),
});

export type WorkflowManifest = z.infer<typeof WorkflowManifestSchema>;

export interface WorkflowContext {
  workflowId: string;
  currentStage: string;
  iteration: number;
}
