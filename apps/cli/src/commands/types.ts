export interface CommandContext {
  args: string[];
  raw: string;
}

export interface CLICommand {
  /** 命令名称，例如 "init", "todo", "inject" */
  name: string;
  /** 命令描述，用于生成 help 列表 */
  description: string;
  /** 执行命令 */
  execute(ctx: CommandContext): Promise<void>;
}
