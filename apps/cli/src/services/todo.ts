import fs from "node:fs";
import path from "node:path";
import { getMonorepoRoot } from "@tda/core";

export interface TodoItem {
  id: string;
  description: string;
  createdAt: string;
  issueUrl?: string;
  issueNumber?: number;
}

export class TodoService {
  private filePath: string;

  constructor() {
    this.filePath = path.join(getMonorepoRoot(), ".tda/todos.json");
  }

  load(): TodoItem[] {
    try {
      if (!fs.existsSync(this.filePath)) return [];
      const raw = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(raw) as TodoItem[];
    } catch {
      return [];
    }
  }

  save(todos: TodoItem[]): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(todos, null, 2), "utf-8");
  }

  add(description: string): TodoItem {
    const todos = this.load();
    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      description,
      createdAt: new Date().toISOString(),
    };
    todos.push(newItem);
    this.save(todos);
    return newItem;
  }

  update(item: TodoItem): void {
    const todos = this.load();
    const index = todos.findIndex(t => t.id === item.id);
    if (index !== -1) {
      todos[index] = item;
      this.save(todos);
    }
  }
}
