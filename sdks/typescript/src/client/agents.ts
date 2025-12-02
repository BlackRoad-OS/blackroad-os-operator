/**
 * BlackRoad OS TypeScript SDK - Agents Resource
 */

import type { BlackRoad } from './index';
import type {
  Agent,
  AgentList,
  AgentInvocation,
  AgentResponse,
  PaginationParams,
} from '../types';

export class AgentsResource {
  constructor(private readonly client: BlackRoad) {}

  /**
   * List all agents.
   */
  async list(params: PaginationParams = {}): Promise<AgentList> {
    return this.client.request<AgentList>('GET', '/agents', { params });
  }

  /**
   * Get an agent by ID.
   */
  async get(agentId: string): Promise<Agent> {
    return this.client.request<Agent>('GET', `/agents/${agentId}`);
  }

  /**
   * Create a new agent.
   */
  async create(data: {
    name: string;
    type?: string;
    config?: Record<string, unknown>;
    capabilities?: string[];
  }): Promise<Agent> {
    return this.client.request<Agent>('POST', '/agents', { body: data });
  }

  /**
   * Update an agent.
   */
  async update(
    agentId: string,
    data: Partial<{
      name: string;
      config: Record<string, unknown>;
      capabilities: string[];
      status: string;
    }>,
  ): Promise<Agent> {
    return this.client.request<Agent>('PATCH', `/agents/${agentId}`, { body: data });
  }

  /**
   * Delete an agent.
   */
  async delete(agentId: string): Promise<void> {
    await this.client.request<void>('DELETE', `/agents/${agentId}`);
  }

  /**
   * Invoke an agent.
   */
  async invoke(
    agentId: string,
    invocation: AgentInvocation,
  ): Promise<AgentResponse> {
    return this.client.request<AgentResponse>('POST', `/agents/${agentId}/invoke`, {
      body: invocation,
    });
  }

  /**
   * Stream an agent response.
   */
  async *stream(
    agentId: string,
    invocation: AgentInvocation,
  ): AsyncGenerator<AgentResponse> {
    yield* this.client.stream<AgentResponse>('POST', `/agents/${agentId}/stream`, {
      body: invocation,
    });
  }
}
