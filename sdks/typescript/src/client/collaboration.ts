/**
 * BlackRoad OS TypeScript SDK - Collaboration Resource
 * 30K concurrent collaborators with CRDT/OT
 */

import type { BlackRoad } from './index';
import type {
  CollaborationSession,
  SessionCreateRequest,
  JoinRequest,
  JoinResponse,
  Participant,
  CRDTOperation,
  OperationResult,
  Conflict,
  Shard,
  ShardList,
  VectorClock,
  PaginatedResponse,
} from '../types';

export class CollaborationResource {
  constructor(private readonly client: BlackRoad) {}

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * List collaboration sessions.
   */
  async listSessions(params?: {
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<CollaborationSession>> {
    return this.client.request<PaginatedResponse<CollaborationSession>>(
      'GET',
      '/collab/sessions',
      { params },
    );
  }

  /**
   * Create a collaboration session.
   */
  async createSession(data: SessionCreateRequest): Promise<CollaborationSession> {
    return this.client.request<CollaborationSession>('POST', '/collab/sessions', {
      body: data,
    });
  }

  /**
   * Get a session by ID.
   */
  async getSession(sessionId: string): Promise<CollaborationSession> {
    return this.client.request<CollaborationSession>('GET', `/collab/sessions/${sessionId}`);
  }

  /**
   * Close a session.
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.client.request<void>('DELETE', `/collab/sessions/${sessionId}`);
  }

  /**
   * Get a session snapshot.
   */
  async getSnapshot(sessionId: string): Promise<{
    id: string;
    sessionId: string;
    state: unknown;
    vectorClock: VectorClock;
    operationCount: number;
    sizeBytes: number;
    createdAt: string;
  }> {
    return this.client.request('GET', `/collab/sessions/${sessionId}/snapshot`);
  }

  /**
   * Create a manual snapshot.
   */
  async createSnapshot(sessionId: string): Promise<{ id: string; createdAt: string }> {
    return this.client.request('POST', `/collab/sessions/${sessionId}/snapshot`);
  }

  // ============================================
  // PARTICIPANT MANAGEMENT
  // ============================================

  /**
   * List session participants.
   */
  async listParticipants(
    sessionId: string,
    params?: {
      shardId?: string;
      role?: string;
      limit?: number;
      cursor?: string;
    },
  ): Promise<PaginatedResponse<Participant> & { total: number; byShard?: Record<string, number> }> {
    return this.client.request('GET', `/collab/sessions/${sessionId}/participants`, {
      params,
    });
  }

  /**
   * Join a session.
   */
  async join(sessionId: string, data: JoinRequest): Promise<JoinResponse> {
    return this.client.request<JoinResponse>('POST', `/collab/sessions/${sessionId}/join`, {
      body: data,
    });
  }

  /**
   * Leave a session.
   */
  async leave(sessionId: string, participantId: string): Promise<void> {
    await this.client.request<void>('POST', `/collab/sessions/${sessionId}/leave`, {
      body: { participantId },
    });
  }

  /**
   * Update cursor position.
   */
  async updateCursor(
    sessionId: string,
    participantId: string,
    cursor: {
      path?: string;
      offset?: number;
      selectionStart?: number;
      selectionEnd?: number;
    },
  ): Promise<void> {
    await this.client.request<void>(
      'PUT',
      `/collab/sessions/${sessionId}/participants/${participantId}/cursor`,
      { body: cursor },
    );
  }

  // ============================================
  // CRDT/OT OPERATIONS
  // ============================================

  /**
   * Apply an operation.
   */
  async applyOperation(
    sessionId: string,
    operation: CRDTOperation,
  ): Promise<OperationResult> {
    return this.client.request<OperationResult>('POST', `/collab/sessions/${sessionId}/operations`, {
      body: operation,
    });
  }

  /**
   * Apply a batch of operations atomically.
   */
  async applyBatch(
    sessionId: string,
    operations: CRDTOperation[],
    options?: { atomic?: boolean },
  ): Promise<{ success: boolean; results: OperationResult[]; vectorClock: VectorClock }> {
    return this.client.request('POST', `/collab/sessions/${sessionId}/operations/batch`, {
      body: { operations, ...options },
    });
  }

  /**
   * Get operation log.
   */
  async getOperations(
    sessionId: string,
    params?: {
      sinceVersion?: number;
      sinceClock?: string;
      limit?: number;
    },
  ): Promise<{
    operations: CRDTOperation[];
    startVersion: number;
    endVersion: number;
    hasMore: boolean;
  }> {
    return this.client.request('GET', `/collab/sessions/${sessionId}/operations`, { params });
  }

  // ============================================
  // STATE SYNCHRONIZATION
  // ============================================

  /**
   * Get current state.
   */
  async getState(
    sessionId: string,
    params?: {
      vectorClock?: string;
      format?: 'full' | 'delta' | 'compressed';
    },
  ): Promise<{
    state: unknown;
    vectorClock: VectorClock;
    version: number;
    delta: boolean;
  }> {
    return this.client.request('GET', `/collab/sessions/${sessionId}/state`, { params });
  }

  /**
   * Get vector clock.
   */
  async getVectorClock(sessionId: string): Promise<VectorClock> {
    return this.client.request<VectorClock>('GET', `/collab/sessions/${sessionId}/state/vector-clock`);
  }

  /**
   * Synchronize state.
   */
  async sync(
    sessionId: string,
    data: {
      vectorClock: VectorClock;
      pendingOperations?: CRDTOperation[];
      stateHash?: string;
    },
  ): Promise<{
    vectorClock: VectorClock;
    inSync: boolean;
    missingOperations: CRDTOperation[];
    conflicts: Conflict[];
  }> {
    return this.client.request('POST', `/collab/sessions/${sessionId}/state/sync`, { body: data });
  }

  // ============================================
  // CONFLICT RESOLUTION
  // ============================================

  /**
   * List unresolved conflicts.
   */
  async listConflicts(
    sessionId: string,
  ): Promise<{ conflicts: Conflict[]; pendingCount: number }> {
    return this.client.request('GET', `/collab/sessions/${sessionId}/state/conflicts`);
  }

  /**
   * Resolve a conflict.
   */
  async resolveConflict(
    sessionId: string,
    conflictId: string,
    resolution: {
      resolutionType: 'accept_first' | 'accept_last' | 'merge' | 'custom';
      customValue?: unknown;
    },
  ): Promise<{ state: unknown; vectorClock: VectorClock }> {
    return this.client.request(
      'POST',
      `/collab/sessions/${sessionId}/state/conflicts/${conflictId}/resolve`,
      { body: resolution },
    );
  }

  // ============================================
  // SHARDING
  // ============================================

  /**
   * List all shards.
   */
  async listShards(): Promise<ShardList> {
    return this.client.request<ShardList>('GET', '/collab/shards');
  }

  /**
   * Get shard status.
   */
  async getShardStatus(shardId: string): Promise<Shard> {
    return this.client.request<Shard>('GET', `/collab/shards/${shardId}`);
  }

  /**
   * Trigger shard rebalancing.
   */
  async rebalanceShards(params?: {
    targetLoad?: number;
    drainShards?: string[];
    addShards?: number;
  }): Promise<{
    id: string;
    status: string;
    progress: number;
    participantsMoved: number;
    estimatedCompletion?: string;
  }> {
    return this.client.request('POST', '/collab/shards/rebalance', { body: params });
  }
}
