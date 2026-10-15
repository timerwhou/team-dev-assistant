import { z } from "zod";

export type SkillContext = {
  input: string;
  args: Record<string, unknown>;
  cwd: string;
};

export type Skill = {
  name: string;
  description: string;
  parameters: z.ZodType<Record<string, unknown>>;
  tools: string[];
  maxSteps: number;
  system: string;
  buildUserMessage: (ctx: SkillContext) => string;
  examples?: string[];
};

export function defineSkill(skill: {
  name: string;
  description: string;
  parameters: z.ZodType;
  tools: string[];
  maxSteps: number;
  system: string;
  buildUserMessage: (ctx: SkillContext) => string;
  examples?: string[];
}): Skill {
  return { ...skill, parameters: skill.parameters as z.ZodType<Record<string, unknown>> };
}
