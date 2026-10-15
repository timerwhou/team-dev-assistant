import { reviewSkill } from "./review";
import { investigateSkill } from "./investigate";
import { issuesSkill } from "./issues";
import type { Skill } from "./types";

export const skills: Skill[] = [reviewSkill, investigateSkill, issuesSkill];
export const skillsByName = new Map(skills.map((s) => [s.name, s]));

export function listSkills(): string {
  return skills.map((s) => `  /${s.name.padEnd(12)} ${s.description}`).join("\n");
}
