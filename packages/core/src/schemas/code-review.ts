import { z } from "zod";

export const IssueSchema = z.object({
  severity: z.enum(["high", "medium", "low"]),
  line: z.number().int().nonnegative(),
  message: z.string().min(1),
  suggestion: z.string().min(1),
});

export const CodeReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z.array(IssueSchema),
  score: z.number().int().min(0).max(100),
});

export type CodeReview = z.infer<typeof CodeReviewSchema>;
