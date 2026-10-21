import { z } from "zod";
import type { CapabilityPack } from "../types";

type GitHubIssue = {
  number: number;
  title: string;
  state: string;
  labels: { name: string }[];
  html_url: string;
  pull_request?: unknown;
};

export const listIssuesCapability: CapabilityPack = {
  metadata: {
    id: "github:list_issues",
    kind: "tool",
    version: "1.0.0",
    description: "查询 GitHub 仓库的 Issue 列表。",
    stage: "context-gathering",
    sideEffects: ["network"],
  },
  inputSchema: z.object({
    owner: z.string().describe("仓库所有者"),
    repo: z.string().describe("仓库名"),
    state: z.enum(["open", "closed", "all"]).optional(),
    label: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
  }),
  async execute({ owner, repo, state = "open", label, limit = 10 }, context) {
    const params = new URLSearchParams({ state, per_page: String(limit) });
    if (label) params.set("labels", label);
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${params}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "team-dev-assistant",
    };
    // 🌟 从 context 获取 Token，而不是直接读 process.env
    if (context.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${context.env.GITHUB_TOKEN}`;
    
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return { content: [{ type: "text", text: `GitHub API ${res.status}` }], isError: true };
      }
      const issues = (await res.json()) as GitHubIssue[];
      const filtered = issues.filter((i) => !i.pull_request);
      if (filtered.length === 0) {
        return { content: [{ type: "text", text: "无匹配 Issue" }] };
      }
      const text = filtered
        .map((i) => `#${i.number} [${i.state}] ${i.title} (${i.labels.map((l) => l.name).join(", ") || "无标签"})`)
        .join("\n");
      return { content: [{ type: "text", text }] };
    } catch (e: any) {
      return { content: [{ type: "text", text: `请求失败：${e.message}` }], isError: true };
    }
  },
};
