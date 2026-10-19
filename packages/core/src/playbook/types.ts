export type PlaybookType = "fact" | "stack";
export type PlaybookStatus = "active" | "deprecated";

export interface PlaybookEntry {
  id: string;
  type: PlaybookType;
  domain: string;
  status: PlaybookStatus;
  title: string;
  content: string; 
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

// 同步检索接口（用于无 API Key 时的本地快速检索）
export interface Retriever {
  retrieve(requirement: string, entries: PlaybookEntry[]): PlaybookEntry[];
}

// 异步检索接口（用于调用 Embedding API 的语义检索）
export interface AsyncRetriever {
  retrieveAsync(requirement: string, entries: PlaybookEntry[]): Promise<PlaybookEntry[]>;
}
