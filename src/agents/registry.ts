export class AgentRegistry<TAgent = unknown> {
  private agents = new Map<string, TAgent>();

  register(id: string, agent: TAgent): void {
    this.agents.set(id, agent);
  }

  get(id: string): TAgent | undefined {
    return this.agents.get(id);
  }

  list(): string[] {
    return Array.from(this.agents.keys());
  }
}
