import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Agent } from '../agents/Agent';
import { AgentContext } from './agentContext';
import { EventBus } from './eventBus';

interface AgentRegistryEntry {
  id: string;
  file: string;
  domain: string;
  description?: string;
}

interface AgentRegistryFile {
  agents: AgentRegistryEntry[];
}

export class AgentLoader {
  private agents: Map<string, Agent> = new Map();
  constructor(private ctx: AgentContext) {}

  async loadFromRegistry(registryPath: string): Promise<void> {
    const absolutePath = path.isAbsolute(registryPath)
      ? registryPath
      : path.join(process.cwd(), registryPath);
    const raw = fs.readFileSync(absolutePath, 'utf8');
    const parsed = yaml.load(raw) as AgentRegistryFile;

    for (const entry of parsed.agents) {
      const agent = await this.instantiate(entry);
      this.agents.set(entry.id, agent);
    }
  }

  private async instantiate(entry: AgentRegistryEntry): Promise<Agent> {
    const filePath = path.join(process.cwd(), 'src', entry.file);
    const module = await import(filePath);
    const AgentClass = module.default ?? Object.values(module)[0];
    const agent: Agent = new AgentClass();
    agent.id = entry.id;
    agent.domain = entry.domain;
    agent.description = entry.description ?? agent.description;
    return agent;
  }

  async initAll(): Promise<void> {
    for (const agent of this.agents.values()) {
      await agent.init(this.ctx);
    }
  }

  async startAllAgents(): Promise<void> {
    for (const agent of this.agents.values()) {
      if (agent.runPeriodic) {
        this.ctx.schedule(60 * 1000, () => agent.runPeriodic!());
      }
    }
  }

  async stopAllAgents(): Promise<void> {
    // Placeholder for future graceful shutdown hooks
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  subscribeAgents(eventBus: EventBus): void {
    for (const agent of this.agents.values()) {
      if (agent.handleEvent) {
        eventBus.subscribe('*', (event) => agent.handleEvent?.(event));
      }
    }
  }
}
