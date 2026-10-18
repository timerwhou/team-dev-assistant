export type PlaybookType = "fact" | "stack";
export type PlaybookStatus = "active" | "deprecated";

export interface PlaybookEntry {
  id: string;
  type: PlaybookType;
  domain: string;
  status: PlaybookStatus;
  title: string;
  content: string; 
  // 行业前沿：用于记录决策与理由，极大提升 LLM 合规率
  decision?: string;
  alternatives?: string[];
  rationale?: string;
  decided_by?: string;
  decided_at?: string;
  supersedes?: string[];
  path: string; 
}

export interface ContextPack {
  requirement: string;
  facts: PlaybookEntry[];
  stacks: PlaybookEntry[];
}
