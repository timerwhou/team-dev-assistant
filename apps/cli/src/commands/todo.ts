import { TodoService } from "../services/todo";
import { GitHubSyncProvider } from "../services/todo-sync";
import type { CLICommand } from "./types";

export const todoCommand: CLICommand = {
  name: "todo",
  description: "记录临时任务，支持同步到 GitHub",
  async execute({ raw }) {
    const todoService = new TodoService();
    
    if (raw === "/todo list") {
      const todos = todoService.load();
      console.log(todos.length === 0 ? "✅ 暂无待处理任务" : JSON.stringify(todos, null, 2));
      return;
    }
    
    const desc = raw.replace("/todo", "").trim();
    if (!desc) {
      console.log("请提供任务描述，例如：/todo 补充 OAuth 测试");
      return;
    }
    
    let item = todoService.add(desc);
    console.log(`✅ 任务已记录（本地）：${item.id}`);
    
    // 尝试同步到 GitHub（若有 Token）
    if (process.env.GITHUB_TOKEN) {
      const syncProvider = new GitHubSyncProvider();
      item = await syncProvider.sync(item);
      todoService.update(item);
      
      if (item.issueUrl) {
        console.log(`✅ 已同步至 GitHub Issue: ${item.issueUrl}`);
      }
    }
  },
};
