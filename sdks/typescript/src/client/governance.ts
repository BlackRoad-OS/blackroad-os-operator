/**
 * BlackRoad OS TypeScript SDK - Governance Resource
 */

import type { BlackRoad } from './index';
import type {
  PolicyEvaluationRequest,
  PolicyResult,
  Policy,
  Constraint,
  PaginatedResponse,
} from '../types';

export class GovernanceResource {
  constructor(private readonly client: BlackRoad) {}

  /**
   * Evaluate a policy.
   */
  async evaluate(request: PolicyEvaluationRequest): Promise<PolicyResult> {
    return this.client.request<PolicyResult>('POST', '/governance/evaluate', {
      body: request,
    });
  }

  /**
   * Evaluate multiple policies in batch.
   */
  async evaluateBatch(
    requests: PolicyEvaluationRequest[],
  ): Promise<{ results: PolicyResult[] }> {
    return this.client.request<{ results: PolicyResult[] }>('POST', '/governance/evaluate/batch', {
      body: { evaluations: requests },
    });
  }

  /**
   * Explain an evaluation.
   */
  async explain(request: PolicyEvaluationRequest): Promise<PolicyResult & { explanation: unknown }> {
    return this.client.request('POST', '/governance/evaluate/explain', {
      body: request,
    });
  }

  /**
   * Simulate an evaluation without recording to ledger.
   */
  async simulate(
    request: PolicyEvaluationRequest,
    options?: {
      policyOverrides?: Policy[];
      constraintOverrides?: Constraint[];
    },
  ): Promise<PolicyResult> {
    return this.client.request<PolicyResult>('POST', '/governance/evaluate/simulate', {
      body: { ...request, ...options },
    });
  }

  /**
   * List policies.
   */
  async listPolicies(params?: {
    scope?: string;
    active?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<Policy>> {
    return this.client.request<PaginatedResponse<Policy>>('GET', '/governance/policies', {
      params,
    });
  }

  /**
   * Get a policy by ID.
   */
  async getPolicy(policyId: string): Promise<Policy> {
    return this.client.request<Policy>('GET', `/governance/policies/${policyId}`);
  }

  /**
   * Create a policy.
   */
  async createPolicy(data: Omit<Policy, 'id' | 'version'>): Promise<Policy> {
    return this.client.request<Policy>('POST', '/governance/policies', { body: data });
  }

  /**
   * Update a policy.
   */
  async updatePolicy(policyId: string, data: Partial<Policy>): Promise<Policy> {
    return this.client.request<Policy>('PATCH', `/governance/policies/${policyId}`, {
      body: data,
    });
  }

  /**
   * List constraints.
   */
  async listConstraints(params?: {
    type?: string;
    active?: boolean;
  }): Promise<PaginatedResponse<Constraint>> {
    return this.client.request<PaginatedResponse<Constraint>>('GET', '/governance/constraints', {
      params,
    });
  }

  /**
   * Create a constraint.
   */
  async createConstraint(data: Omit<Constraint, 'id'>): Promise<Constraint> {
    return this.client.request<Constraint>('POST', '/governance/constraints', { body: data });
  }

  /**
   * Check governance health.
   */
  async health(): Promise<{
    policyEngine: string;
    ledgerService: string;
    policyPacksLoaded: number;
    servicesRegistered: number;
  }> {
    return this.client.request('GET', '/governance/health');
  }
}
