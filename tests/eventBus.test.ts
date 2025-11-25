import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  emit,
  getRecentEvents,
  clearEvents,
  getEventCount,
  emitJobStarted,
  emitJobCompleted,
  emitJobFailed,
  emitWorkflowStarted,
  emitWorkflowCompleted,
  emitWorkflowFailed,
  emitAgentRegistered,
  emitAgentDeregistered
} from '../src/utils/eventBus.js';

describe('EventBus', () => {
  beforeEach(() => {
    clearEvents();
  });

  afterEach(() => {
    clearEvents();
  });

  describe('emit', () => {
    it('should create and store an event', () => {
      const event = emit('job.started', { jobId: '123', jobType: 'test' });

      expect(event).toMatchObject({
        id: expect.any(String),
        type: 'job.started',
        timestamp: expect.any(Number),
        payload: { jobId: '123', jobType: 'test' },
        metadata: { source: 'blackroad-os-operator' }
      });

      expect(getEventCount()).toBe(1);
    });

    it('should include custom metadata when provided', () => {
      const event = emit(
        'job.completed',
        { jobId: '456' },
        { source: 'custom', correlationId: 'abc', userId: 'user-1' }
      );

      expect(event.metadata).toEqual({
        source: 'custom',
        correlationId: 'abc',
        userId: 'user-1'
      });
    });

    it('should maintain buffer of events', () => {
      emit('job.started', { jobId: '1' });
      emit('job.completed', { jobId: '1' });
      emit('job.started', { jobId: '2' });

      expect(getEventCount()).toBe(3);

      const events = getRecentEvents(10);
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('job.started');
      expect(events[1].type).toBe('job.completed');
      expect(events[2].type).toBe('job.started');
    });

    it('should trim buffer when exceeding max size', () => {
      // Emit more than MAX_BUFFER_SIZE (1000) events
      for (let i = 0; i < 1100; i++) {
        emit('job.started', { jobId: `${i}` });
      }

      // Should only keep last 1000
      expect(getEventCount()).toBe(1000);

      const events = getRecentEvents(1000);
      // First event should be from iteration 100 (0-indexed, so jobId: '100')
      expect(events[0].payload.jobId).toBe('100');
    });
  });

  describe('getRecentEvents', () => {
    it('should return requested number of events', () => {
      for (let i = 0; i < 10; i++) {
        emit('job.started', { jobId: `${i}` });
      }

      const events = getRecentEvents(5);
      expect(events).toHaveLength(5);
      
      // Should get last 5 events (5-9)
      expect(events[0].payload.jobId).toBe('5');
      expect(events[4].payload.jobId).toBe('9');
    });

    it('should return all events when limit exceeds buffer size', () => {
      for (let i = 0; i < 5; i++) {
        emit('job.started', { jobId: `${i}` });
      }

      const events = getRecentEvents(100);
      expect(events).toHaveLength(5);
    });

    it('should return empty array when no events', () => {
      const events = getRecentEvents(10);
      expect(events).toEqual([]);
    });
  });

  describe('clearEvents', () => {
    it('should clear all events from buffer', () => {
      emit('job.started', { jobId: '1' });
      emit('job.started', { jobId: '2' });
      
      expect(getEventCount()).toBe(2);

      clearEvents();

      expect(getEventCount()).toBe(0);
      expect(getRecentEvents(10)).toEqual([]);
    });
  });

  describe('convenience functions', () => {
    it('emitJobStarted should emit job.started event', () => {
      const event = emitJobStarted('job-123', 'sync-job');

      expect(event.type).toBe('job.started');
      expect(event.payload).toEqual({ jobId: 'job-123', jobType: 'sync-job' });
    });

    it('emitJobCompleted should emit job.completed event', () => {
      const event = emitJobCompleted('job-123', 'sync-job', { status: 'ok' });

      expect(event.type).toBe('job.completed');
      expect(event.payload).toEqual({
        jobId: 'job-123',
        jobType: 'sync-job',
        result: { status: 'ok' }
      });
    });

    it('emitJobFailed should emit job.failed event', () => {
      const event = emitJobFailed('job-123', 'sync-job', 'Network timeout');

      expect(event.type).toBe('job.failed');
      expect(event.payload).toEqual({
        jobId: 'job-123',
        jobType: 'sync-job',
        error: 'Network timeout'
      });
    });

    it('emitWorkflowStarted should emit workflow.started event', () => {
      const event = emitWorkflowStarted('wf-1', 'deploy-workflow');

      expect(event.type).toBe('workflow.started');
      expect(event.payload).toEqual({
        workflowId: 'wf-1',
        definitionId: 'deploy-workflow'
      });
    });

    it('emitWorkflowCompleted should emit workflow.completed event', () => {
      const event = emitWorkflowCompleted('wf-1', 'deploy-workflow', { deployed: true });

      expect(event.type).toBe('workflow.completed');
      expect(event.payload).toEqual({
        workflowId: 'wf-1',
        definitionId: 'deploy-workflow',
        result: { deployed: true }
      });
    });

    it('emitWorkflowFailed should emit workflow.failed event', () => {
      const event = emitWorkflowFailed('wf-1', 'deploy-workflow', 'Deployment failed');

      expect(event.type).toBe('workflow.failed');
      expect(event.payload).toEqual({
        workflowId: 'wf-1',
        definitionId: 'deploy-workflow',
        error: 'Deployment failed'
      });
    });

    it('emitAgentRegistered should emit agent.registered event', () => {
      const event = emitAgentRegistered('agent-1');

      expect(event.type).toBe('agent.registered');
      expect(event.payload).toEqual({ agentId: 'agent-1' });
    });

    it('emitAgentDeregistered should emit agent.deregistered event', () => {
      const event = emitAgentDeregistered('agent-1');

      expect(event.type).toBe('agent.deregistered');
      expect(event.payload).toEqual({ agentId: 'agent-1' });
    });

    it('convenience functions should accept metadata', () => {
      const metadata = { source: 'test', correlationId: 'abc123' };
      const event = emitJobStarted('job-1', 'test', metadata);

      expect(event.metadata).toEqual(metadata);
    });
  });
});
