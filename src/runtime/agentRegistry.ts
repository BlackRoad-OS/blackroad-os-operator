import { Agent as CoreAgent, AgentMetadata, AgentState, PsShaInfinity, ok } from "blackroad-os-core";
import { Logger } from "../utils/logger";

export interface AgentHandle<I = unknown, O = unknown> {
  core: CoreAgent<I, O>;
  state: AgentState;
}

export interface AgentMetadataWithState extends AgentMetadata, AgentState {}

export class AgentRegistry {
  private agents = new Map<PsShaInfinity, AgentHandle<unknown, unknown>>();

  constructor(private logger?: Logger) {}

  registerAgent<I, O>(agent: CoreAgent<I, O>): void {
    const existing = this.agents.get(agent.metadata.id);
    if (existing) {
      this.logger?.warn(`Agent ${agent.metadata.id} already registered, overwriting`);
    }

    this.agents.set(agent.metadata.id, {
      core: agent,
      state: {
        status: "idle",
        lastSeen: new Date().toISOString(),
      },
    });
  }

  listAgents(): AgentMetadataWithState[] {
    return Array.from(this.agents.values()).map(({ core, state }) => ({
      ...core.metadata,
      ...state,
    }));
  }

  getAgent(id: PsShaInfinity): AgentHandle | undefined {
    return this.agents.get(id);
  }

  updateState(id: PsShaInfinity, patch: Partial<AgentState>): void {
    const agent = this.agents.get(id);
    if (!agent) return;
    agent.state = { ...agent.state, ...patch };
  }
}

export function createDefaultAgentRegistry(logger?: Logger): AgentRegistry {
  const registry = new AgentRegistry(logger);

  const echoAgent: CoreAgent<{ message: string }, { echoed: string }> = {
    metadata: {
      id: "agent:echo",
      name: "Echo Agent",
      description: "Returns the provided message for testing",
      tags: ["diagnostic", "example"],
      version: "1.0.0",
    },
    run: async (input, context) => {
      const payload = input?.message ?? "";
      const output = { echoed: payload };
      context.emitEvent({
        id: `event:${Date.now()}:echo`,
        type: "agent.echo.completed",
        timestamp: context.now(),
        payload: { payload },
      });
      return ok(output);
    },
  };

  const counterAgent: CoreAgent<{ start?: number }, { next: number }> = {
    metadata: {
      id: "agent:counter",
      name: "Counter Agent",
      description: "Increments a counter to demonstrate job work",
      tags: ["example"],
      version: "1.0.0",
    },
    run: async (input, context) => {
      const value = Number(input?.start ?? 0) + 1;
      context.emitEvent({
        id: `event:${Date.now()}:counter`,
        type: "agent.counter.incremented",
        timestamp: context.now(),
        payload: { value },
      });
      return ok({ next: value });
    },
  };

  registry.registerAgent(echoAgent);
  registry.registerAgent(counterAgent);

  return registry;
}
