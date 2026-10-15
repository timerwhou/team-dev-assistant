import { z } from "zod";
import { defineTool } from "./registry";

type GitHubIssue = {
  number: number;
  title: string;
  state: string;
  labels: { name: string }[];
  html_url: string;
  pull_request?: unknown;
};

export const listIssuesTool = defineTool({
  name: "list_issues",
  description: "查询 GitHub 仓库的 Issue 列表。",
  readOnly: true,
  parameters: z.object({
    owner: z.string().describe("仓库所有者"),
    repo: z.string().describe("仓库名"),
    state: z.enum(["open", "closed", "all"]).optional().describe("状态，默认 open"),
    label: z.string().optional().describe("标签过滤"),
    limit: z.number().int().positive().max(100).optional().describe("最多返回条数，默认 10"),
  }),
  execute: async ({ owner, repo, state = "open", label, limit = 10 }) => {
    const params = new URLSearchParams({ state, per_page: String(limit) });
    if (label) params.set("labels", label);
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?${params}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "team-dev-assistant",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const issues = (await res.json()) as GitHubIssue[];
    const filtered = issues.filter((i) => !i.pull_request);
    return {
      count: filtered.length,
      items: filtered.map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        labels: i.labels.map((l) => l.name),
        url: i.html_url,
      })),
    };
  },
});
