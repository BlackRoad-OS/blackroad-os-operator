import { emitAgentRegistered, emitAgentDeregistered } from '../utils/eventBus.js';
import type { AgentRegistration, AgentStatus, RegisteredAgent } from '../types/index.js';

const agents = new Map<string, RegisteredAgent>();

function normalizeAgent(agent: AgentRegistration): RegisteredAgent {
  return {
    ...agent,
    status: agent.status ?? 'online',
    lastHeartbeat: Date.now(),
    tags: agent.tags ?? [],
    roles: agent.roles ?? [],
    capabilities: {
      docker: agent.capabilities?.docker ?? false,
      python: agent.capabilities?.python ?? 'unknown'
    },
    workspaces: agent.workspaces ?? []
  };
}

export function registerAgent(agent: AgentRegistration): RegisteredAgent {
  const normalized = normalizeAgent(agent);
  agents.set(agent.id, normalized);
  emitAgentRegistered(agent.id, { agentId: agent.id });
  return normalized;
}

export function updateAgentStatus(id: string, status: AgentStatus): RegisteredAgent | null {
  const existing = agents.get(id);
  if (!existing) return null;

  const updated: RegisteredAgent = {
    ...existing,
    status,
    lastHeartbeat: Date.now()
  };
  agents.set(id, updated);
  return updated;
}

export function recordHeartbeat(id: string, payload?: Partial<RegisteredAgent>): RegisteredAgent | null {
  const existing = agents.get(id);
  if (!existing) return null;

  const updated: RegisteredAgent = {
    ...existing,
    ...payload,
    lastHeartbeat: Date.now()
  };
  agents.set(id, updated);
  return updated;
}

export function deregisterAgent(id: string): boolean {
  const removed = agents.delete(id);
  if (removed) {
    emitAgentDeregistered(id, { agentId: id });
  }
  return removed;
}

export function listAgents(): RegisteredAgent[] {
  return Array.from(agents.values()).sort((a, b) => a.id.localeCompare(b.id));
}

export function getAgent(id: string): RegisteredAgent | null {
  return agents.get(id) ?? null;
}
