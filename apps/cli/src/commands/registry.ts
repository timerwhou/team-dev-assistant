import type { CLICommand } from "./types";

class CommandRegistry {
  private commands = new Map<string, CLICommand>();

  public register(cmd: CLICommand) {
    this.commands.set(cmd.name, cmd);
  }

  public get(name: string): CLICommand | undefined {
    return this.commands.get(name);
  }

  public list(): CLICommand[] {
    return Array.from(this.commands.values());
  }
}

export const commandRegistry = new CommandRegistry();
