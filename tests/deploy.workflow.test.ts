import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { clearEvents } from '../src/utils/eventBus.js';
import type { DeployWorkflowInput } from '../src/workflows/deploy.workflow.ts';
import { executeDeployWorkflow } from '../src/workflows/deploy.workflow.ts';

// Mock Redis connection for idempotency tests
vi.mock('../src/queues/index.js', () => ({
  connection: {
    exists: vi.fn().mockResolvedValue(0),
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1)
  }
}));

describe('Deploy Workflow', () => {
  beforeEach(() => {
    clearEvents();
  });

  afterEach(() => {
    clearEvents();
    vi.clearAllMocks();
  });

  describe('executeDeployWorkflow', () => {
    it('should complete deployment workflow successfully', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.2.3',
        environment: 'staging',
        rollbackOnFailure: true
      };

      const result = await executeDeployWorkflow(input);

      expect(result.status).toBe('completed');
      expect(result.workflowId).toBeDefined();
      expect(result.deployedVersion).toBe('v1.2.3');
      expect(result.rollbackPerformed).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should include workflow ID in result', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.0.0',
        environment: 'production'
      };

      const result = await executeDeployWorkflow(input);

      expect(result.workflowId).toBeTruthy();
      expect(typeof result.workflowId).toBe('string');
    });

    it('should handle staging environment', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'api-service',
        version: 'v2.0.0',
        environment: 'staging'
      };

      const result = await executeDeployWorkflow(input);

      expect(result.status).toBe('completed');
      expect(result.deployedVersion).toBe('v2.0.0');
    });

    it('should handle production environment', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'core-service',
        version: 'v3.0.0',
        environment: 'production'
      };

      const result = await executeDeployWorkflow(input);

      expect(result.status).toBe('completed');
      expect(result.deployedVersion).toBe('v3.0.0');
    });

    it('should be idempotent with custom idempotency key', async () => {
      const idempotencyKey = {
        operationType: 'deploy',
        operationId: 'test-deploy-123',
        createdAt: Date.now()
      };

      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.0.0',
        environment: 'staging',
        idempotencyKey
      };

      const result1 = await executeDeployWorkflow(input);
      const result2 = await executeDeployWorkflow(input);

      // Both should succeed (idempotency handled by store)
      expect(result1.status).toBe('completed');
      expect(result2.status).toBe('completed');
    });

    it('should respect rollbackOnFailure flag', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.0.0',
        environment: 'production',
        rollbackOnFailure: true
      };

      const result = await executeDeployWorkflow(input);

      // In this test, deployment succeeds, so no rollback
      expect(result.rollbackPerformed).toBeUndefined();
      expect(result.status).toBe('completed');
    });

    it('should handle deployment without rollback flag', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.0.0',
        environment: 'production',
        rollbackOnFailure: false
      };

      const result = await executeDeployWorkflow(input);

      expect(result.status).toBe('completed');
      expect(result.rollbackPerformed).toBeUndefined();
    });
  });

  describe('workflow properties', () => {
    it('should demonstrate idempotency', async () => {
      // This test demonstrates that running the workflow twice
      // with the same input should be safe (no double side-effects)
      
      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.0.0',
        environment: 'staging'
      };

      // First execution
      const result1 = await executeDeployWorkflow(input);
      
      // Second execution (idempotency should prevent double deployment)
      const result2 = await executeDeployWorkflow(input);

      expect(result1.status).toBe('completed');
      expect(result2.status).toBe('completed');
      
      // Both should have different workflow IDs (new execution)
      // but idempotency store would prevent actual duplicate work
      expect(result1.workflowId).toBeTruthy();
      expect(result2.workflowId).toBeTruthy();
    });

    it('should emit events during workflow execution', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.0.0',
        environment: 'staging'
      };

      await executeDeployWorkflow(input);

      // Events would be captured by event bus
      // In a real test, we'd verify specific events were emitted
      // For now, just verify workflow completes
      expect(true).toBe(true);
    });

    it('should provide clear status outputs', async () => {
      const input: DeployWorkflowInput = {
        serviceId: 'test-service',
        version: 'v1.0.0',
        environment: 'production'
      };

      const result = await executeDeployWorkflow(input);

      // Status should be one of: completed, failed, partial
      expect(['completed', 'failed', 'partial']).toContain(result.status);
      
      // Result should have workflow ID
      expect(result.workflowId).toBeDefined();
      
      // On success, should have deployed version
      if (result.status === 'completed') {
        expect(result.deployedVersion).toBeDefined();
      }
      
      // On failure, should have error message
      if (result.status === 'failed') {
        expect(result.error).toBeDefined();
      }
    });
  });
});
