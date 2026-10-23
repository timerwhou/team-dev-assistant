import readline from "node:readline/promises";
import fs from "node:fs";
import path from "node:path";
import { ConflictService } from "../services/conflict";
import type { CLICommand } from "./types";

export const reviewConflictsCommand: CLICommand = {
  name: "review-conflicts",
  description: "集中处理异步冲突",
  async execute({ raw }) {
    let root = process.cwd();
    const pathArgMatch = raw.match(/--path=([^\s]+)/);
    if (pathArgMatch) root = path.resolve(pathArgMatch[1]);

    const conflictService = new ConflictService(root);
    const pending = conflictService.list();
    
    if (pending.length === 0) {
      console.log(`✅ 在 ${conflictService.getPendingDir()} 中无待处理冲突。`);
      return;
    }
    
    console.log(`📂 读取目录: ${conflictService.getPendingDir()}`);
    console.log(`共发现 ${pending.length} 个待处理冲突文件。\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    // 🌟 增加批量操作选项
    const mode = await rl.question("请选择处理模式：[a] 全部采纳 / [r] 全部拒绝 / [m] 逐条手动审查 (默认 m): ");
    
    if (mode.toLowerCase() === "a") {
      for (const file of pending) {
        conflictService.approve(file);
      }
      console.log(`✅ 已全部采纳 ${pending.length} 个冲突文件。`);
      rl.close();
      return;
    }

    if (mode.toLowerCase() === "r") {
      for (const file of pending) {
        conflictService.reject(file);
      }
      console.log(`🗑️ 已全部拒绝 ${pending.length} 个冲突文件。`);
      rl.close();
      return;
    }

    // 逐条手动审查
    for (const fileName of pending) {
      console.log(`\n冲突文件: ${fileName}`);
      const content = fs.readFileSync(path.join(conflictService.getPendingDir(), fileName), "utf-8");
      console.log(`内容摘要: ${content.slice(0, 100)}...`);
      const answer = await rl.question("采纳? (y/n): ");
      if (answer.toLowerCase() === "y") {
        conflictService.approve(fileName);
        console.log("✅ 已采纳并合并至 playbook");
      } else {
        conflictService.reject(fileName);
        console.log("🗑️ 已丢弃");
      }
    }
    rl.close();
  },
};
