import { execSync } from "node:child_process";
import { z } from "zod";
import { getMonorepoRoot } from "@tda/core";
import { defineTool } from "./registry";

type GitHubIssue = {
  number: number;
  title: string;
  state: string;
  labels: { name: string }[];
  html_url: string;
  pull_request?: unknown;
};

/** 从 git remote 自动推导 owner/repo */
function detectRepo(): { owner: string; repo: string } | null {
  try {
    const root = process.env.TDA_ROOT || getMonorepoRoot();
    const remote = execSync("git remote get-url origin", { cwd: root })
      .toString()
      .trim();
    const m = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    return m ? { owner: m[1], repo: m[2] } : null;
  } catch {
    return null;
  }
}

export const listIssuesTool = defineTool({
  name: "list_issues",
  description:
    "查询 GitHub 仓库的 Issue 列表。owner/repo 可省略，省略时自动从当前 git remote 推导。",
  readOnly: true,
  parameters: z.object({
    owner: z.string().optional().describe("仓库所有者，省略时从 git remote 推导"),
    repo: z.string().optional().describe("仓库名，省略时从 git remote 推导"),
    state: z.enum(["open", "closed", "all"]).optional().describe("状态，默认 open"),
    label: z.string().optional().describe("标签过滤，例如 bug"),
    limit: z.number().int().positive().max(100).optional().describe("最多返回条数，默认 10"),
  }),
  execute: async ({ owner, repo, state = "open", label, limit = 10 }) => {
    if (!owner || !repo) {
      const detected = detectRepo();
      if (!detected) {
        throw new Error(
          "未提供 owner/repo，且无法从 git remote 推导。请显式传入 owner 和 repo。"
        );
      }
      owner ||= detected.owner;
      repo ||= detected.repo;
    }

    const params = new URLSearchParams({ state, per_page: String(limit) });
    if (label) params.set("labels", label);
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${params}`;

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
      repo: `${owner}/${repo}`,
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
