/**
 * 📡 Event Bus
 * 
 * Emits and buffers domain events for consumption by other services
 * (prism-console, core, archive, etc.)
 */

import { randomUUID } from 'crypto';

import type { DomainEvent, EventType } from '../types/index.js';

import logger from './logger.js';

const MAX_BUFFER_SIZE = 1000;
const eventBuffer: DomainEvent[] = [];

/**
 * Emit a domain event
 */
export function emit(
  type: EventType,
  payload: Record<string, unknown>,
  metadata?: DomainEvent['metadata']
): DomainEvent {
  const event: DomainEvent = {
    id: randomUUID(),
    type,
    timestamp: Date.now(),
    payload,
    metadata: metadata || { source: 'blackroad-os-operator' }
  };

  // Add to buffer
  eventBuffer.push(event);
  
  // Trim buffer if too large
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift();
  }

  logger.info(
    {
      eventId: event.id,
      eventType: type,
      metadata: event.metadata
    },
    '📡 event emitted'
  );

  // TODO(op-next): Push to message queue or event stream for other services
  // For now, just buffer in memory for /events endpoint

  return event;
}

/**
 * Get recent events (for /events endpoint)
 */
export function getRecentEvents(limit: number = 100): DomainEvent[] {
  const actualLimit = Math.min(limit, eventBuffer.length);
  return eventBuffer.slice(-actualLimit);
}

/**
 * Clear event buffer (for testing)
 */
export function clearEvents(): void {
  eventBuffer.length = 0;
  logger.debug('📡 event buffer cleared');
}

/**
 * Get event count
 */
export function getEventCount(): number {
  return eventBuffer.length;
}

// Convenience functions for common event types

export function emitJobStarted(jobId: string, jobType: string, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('job.started', { jobId, jobType }, metadata);
}

export function emitJobCompleted(jobId: string, jobType: string, result?: unknown, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('job.completed', { jobId, jobType, result }, metadata);
}

export function emitJobFailed(jobId: string, jobType: string, error: string, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('job.failed', { jobId, jobType, error }, metadata);
}

export function emitWorkflowStarted(workflowId: string, definitionId: string, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('workflow.started', { workflowId, definitionId }, metadata);
}

export function emitWorkflowCompleted(workflowId: string, definitionId: string, result?: unknown, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('workflow.completed', { workflowId, definitionId, result }, metadata);
}

export function emitWorkflowFailed(workflowId: string, definitionId: string, error: string, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('workflow.failed', { workflowId, definitionId, error }, metadata);
}

export function emitAgentRegistered(agentId: string, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('agent.registered', { agentId }, metadata);
}

export function emitAgentDeregistered(agentId: string, metadata?: DomainEvent['metadata']): DomainEvent {
  return emit('agent.deregistered', { agentId }, metadata);
}
