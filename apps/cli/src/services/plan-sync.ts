import type { PlanOutput } from "./plan";

interface CreatedIssue {
  title: string;
  number: number;
  url: string;
}

export class PlanSyncProvider {
  private token: string;
  private repo: string;

  constructor(token?: string, repo?: string) {
    this.token = token || process.env.GITHUB_TOKEN || "";
    this.repo = repo || process.env.GITHUB_REPO || "timerwhou/team-dev-assistant";
  }

  /**
   * 批量将计划任务创建为 GitHub Issue
   * @returns 创建的 Issue 列表（含关联的 dependsOn 编号）
   */
  async syncBatch(plan: PlanOutput): Promise<CreatedIssue[]> {
    if (!this.token) {
      throw new Error("未配置 GITHUB_TOKEN，无法创建 Issue。请在 .env 中配置 GITHUB_TOKEN。");
    }

    const created: CreatedIssue[] = [];
    const titleToNumber = new Map<string, number>();

    for (const task of plan.tasks) {
      let body = task.description;
      
      // 如果存在依赖，自动拼接 Depends on
      if (task.dependsOn && titleToNumber.has(task.dependsOn)) {
        body += `\n\n---\n**Depends on**: #${titleToNumber.get(task.dependsOn)}`;
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
            title: `[Plan] ${task.title}`,
            body,
            labels: ["triage", "planned"],
          }),
        });

        if (!res.ok) throw new Error(`GitHub API 返回 ${res.status}`);
        const data = await res.json() as { number: number; html_url: string };
        
        titleToNumber.set(task.title, data.number);
        created.push({ title: task.title, number: data.number, url: data.html_url });
        console.log(`  ✅ 创建 Issue #${data.number}: ${task.title}`);
      } catch (e) {
        console.error(`  ❌ 创建任务 "${task.title}" 失败: ${(e as Error).message}`);
      }
    }

    return created;
  }
}
