export type PlaybookType = "fact" | "stack";
export type PlaybookStatus = "active" | "deprecated";

export interface PlaybookEntry {
  id: string;
  type: PlaybookType;
  domain: string;
  status: PlaybookStatus;
  title: string;
  content: string; 
  path: string; 
}

export interface ContextPack {
  requirement: string;
  facts: PlaybookEntry[];
  stacks: PlaybookEntry[];
}
