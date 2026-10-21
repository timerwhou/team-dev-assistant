export interface AgentProfile {
  name: string;
  url: string;
  /** 负责处理的阶段，例如 "context-gathering", "execution", "review" */
  supportedStages: string[];
}

export class AgentRegistry {
  private agents = new Map<string, AgentProfile>();

  public register(profile: AgentProfile) {
    this.agents.set(profile.name, profile);
  }

  public getAgentForStage(stage: string): AgentProfile | undefined {
    return Array.from(this.agents.values()).find(agent => 
      agent.supportedStages.includes(stage)
    );
  }

  public getAllAgents(): AgentProfile[] {
    return Array.from(this.agents.values());
  }
}

export const agentRegistry = new AgentRegistry();
