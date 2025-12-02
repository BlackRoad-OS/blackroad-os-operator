/**
 * BlackRoad OS TypeScript SDK - Ledger Resource
 */

import type { BlackRoad } from './index';
import type {
  LedgerEvent,
  LedgerEventList,
  LedgerQuery,
  LedgerLineage,
  VerificationResult,
} from '../types';

export class LedgerResource {
  constructor(private readonly client: BlackRoad) {}

  /**
   * Query ledger events.
   */
  async query(params: LedgerQuery = {}): Promise<LedgerEventList> {
    return this.client.request<LedgerEventList>('GET', '/ledger/events', { params });
  }

  /**
   * Get a ledger event by ID.
   */
  async get(eventId: string): Promise<LedgerEvent> {
    return this.client.request<LedgerEvent>('GET', `/ledger/events/${eventId}`);
  }

  /**
   * Get events by correlation ID.
   */
  async getByCorrelation(correlationId: string): Promise<LedgerEvent[]> {
    return this.client.request<LedgerEvent[]>('GET', `/ledger/correlation/${correlationId}`);
  }

  /**
   * Verify ledger integrity.
   */
  async verify(params?: {
    startHash?: string;
    endHash?: string;
    startTime?: string;
    endTime?: string;
    sampleRate?: number;
  }): Promise<VerificationResult> {
    return this.client.request<VerificationResult>('POST', '/ledger/verify', {
      body: params,
    });
  }

  /**
   * Get ledger statistics.
   */
  async stats(): Promise<{
    totalEvents: number;
    byDecision: Record<string, number>;
  }> {
    return this.client.request('GET', '/ledger/stats');
  }

  /**
   * Trace lineage using PS-SHA∞.
   */
  async traceLineage(params: {
    hash: string;
    direction?: 'ancestors' | 'descendants' | 'both';
    depth?: number;
  }): Promise<LedgerLineage> {
    return this.client.request<LedgerLineage>('GET', '/lineage/trace', { params });
  }

  /**
   * Compare two lineages.
   */
  async compareLineage(params: {
    hashA: string;
    hashB: string;
    maxDepth?: number;
  }): Promise<{
    commonAncestor?: string;
    divergencePoint?: string;
    distanceA: number;
    distanceB: number;
    contradictions: unknown[];
  }> {
    return this.client.request('POST', '/lineage/compare', { body: params });
  }

  /**
   * Aggregate ledger data.
   */
  async aggregate(params: {
    filters?: Record<string, unknown>;
    aggregations: Array<{
      name: string;
      type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'histogram';
      field?: string;
      groupBy?: string[];
    }>;
  }): Promise<{ results: Record<string, unknown>; queryTimeMs: number }> {
    return this.client.request('POST', '/ledger/aggregate', { body: params });
  }
}
