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
  // 🌟 v1.12.0 新增：支持 Webhook 触发
  triggers: z.array(z.object({
    type: z.literal("webhook"),
    token: z.string().min(8),
    secret: z.string().optional(), // 用于 HMAC-SHA256 验签的密钥
  })).optional(),
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
