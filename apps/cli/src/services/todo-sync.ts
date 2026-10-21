import type { TodoItem } from "./todo";

export interface SyncProvider {
  /**
   * 尝试将 Todo 同步到远端，返回更新后的 TodoItem（包含 issueUrl）
   */
  sync(item: TodoItem): Promise<TodoItem>;
}

export class GitHubSyncProvider implements SyncProvider {
  private token: string;
  private repo: string;

  constructor(token?: string, repo?: string) {
    this.token = token || process.env.GITHUB_TOKEN || "";
    this.repo = repo || process.env.GITHUB_REPO || "timerwhou/team-dev-assistant";
  }

  async sync(item: TodoItem): Promise<TodoItem> {
    if (!this.token) {
      // 静默降级：没有 Token 就直接返回原样，由调用方提示本地保存
      return item;
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${this.repo}/issues`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `[TODO] ${item.description}`,
          body: `自动收集的临时任务：\n\n${item.description}`,
          labels: ["triage"],
        }),
      });

      if (!res.ok) throw new Error(`GitHub API 返回 ${res.status}`);

      const data = await res.json() as { html_url: string; number: number };
      return { ...item, issueUrl: data.html_url, issueNumber: data.number };
    } catch (e) {
      console.warn(`\n⚠️ GitHub Issue 同步失败：${(e as Error).message}，已降级为本地记录。`);
      return item;
    }
  }
}
