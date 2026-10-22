export interface FlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: { label: string; stage: string; capabilities: string[]; status?: string };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export type LogType = 'info' | 'error' | 'warn';

export type AddLogFn = (type: LogType, title: string, detail?: string, nodeId?: string) => void;
