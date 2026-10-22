import { z } from "zod";

export const WorkflowManifestSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  description: z.string(),
  stages: z.array(z.string().min(1)),
  stageCapabilities: z.record(z.string(), z.array(z.string())),
  governance: z.object({
    maxIterations: z.number().int().positive().default(5),
    maxResultsPerTool: z.number().int().positive().default(3),
  }).optional(),
});

export type WorkflowManifest = z.infer<typeof WorkflowManifestSchema>;

export interface WorkflowAsset {
  id: string;
  name: string;
  manifest: WorkflowManifest;
  createdAt: number;
  updatedAt: number;
  version: number;
}
