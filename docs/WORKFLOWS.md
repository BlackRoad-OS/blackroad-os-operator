# 🧵 Workflow Patterns & Examples

This document provides practical examples of implementing workflows in the BlackRoad OS Operator Engine.

## 📋 Table of Contents

- [Overview](#overview)
- [Workflow Best Practices](#workflow-best-practices)
- [Example Workflows](#example-workflows)
  - [Deploy Workflow](#deploy-workflow)
  - [Sweep Workflow](#sweep-workflow)
- [Creating Your Own Workflow](#creating-your-own-workflow)
- [Testing Workflows](#testing-workflows)

## Overview

Workflows in the Operator Engine coordinate multi-step operations across BlackRoad OS services. Each workflow should:

1. **Have a single, clear purpose** 🎯
2. **Be idempotent by default** 🔁
3. **Emit events for visibility** 📡
4. **Include proper error handling** ⚠️
5. **Use retry logic and circuit breakers** 🔄🚧

## Workflow Best Practices

### ✅ DO

- **Use idempotency keys** for all workflows that modify state
- **Emit events** at workflow start, completion, and failure
- **Log structured data** with workflow ID, step names, and context
- **Handle partial failures** gracefully
- **Document compliance requirements** for sensitive workflows
- **Include rollback logic** for critical operations
- **Use circuit breakers** for external service calls
- **Apply retry policies** for transient failures

### 🚫 DON'T

- Don't make workflows depend on specific execution order across services
- Don't forget to mark workflows as processed for idempotency
- Don't log secrets or sensitive data
- Don't skip error handling for "impossible" failures
- Don't create unbounded loops

## Example Workflows

### Deploy Workflow

**File:** `src/workflows/deploy.workflow.ts`

**Purpose:** Safely deploy services to Railway with health checks and rollback capability.

**Compliance:** Yes - deployment operations require audit trails

**Key Features:**
- 🔁 Idempotent using operation ID
- 🚧 Circuit breaker protection for Railway API calls
- 🔄 Retry logic with exponential backoff
- 🏥 Post-deployment health checks
- 🔙 Automatic rollback on health check failure
- 📡 Events emitted to prism-console

**Usage:**

```typescript
import { executeDeployWorkflow } from './workflows/deploy.workflow.js';

const result = await executeDeployWorkflow({
  serviceId: 'blackroad-os-api',
  version: 'v1.2.3',
  environment: 'production',
  rollbackOnFailure: true
});

if (result.status === 'completed') {
  console.log(`Deployed version ${result.deployedVersion}`);
} else if (result.status === 'partial' && result.rollbackPerformed) {
  console.log('Deployment rolled back due to health check failure');
} else {
  console.error(`Deployment failed: ${result.error}`);
}
```

**Workflow Steps:**

1. **Pre-deployment validation** 🔍
   - Validate service exists
   - Validate version format
   - Check environment readiness

2. **Execute deployment** 🚀
   - Call Railway API with circuit breaker protection
   - Monitor deployment initiation
   - Wait for deployment to start

3. **Health check** 🏥
   - Call service health endpoint
   - Verify expected version
   - Check critical functionality
   - Rollback if checks fail (when enabled)

4. **Finalize** ✅
   - Mark as processed for idempotency
   - Emit success events
   - Return deployment result

### Sweep Workflow

**File:** `src/workflows/sweep.workflow.ts`

**Purpose:** Run quality checks across multiple repositories in parallel.

**Compliance:** No - code quality checks don't require special compliance handling

**Key Features:**
- 🧵 Fan-out pattern: parallel execution across repos
- 🧵 Fan-in pattern: aggregate results
- 🔁 Idempotent using PR ID and commit SHA
- 🔄 Retry logic for flaky check execution
- 📡 Progress events for each completed check

**Usage:**

```typescript
import { executeSweepWorkflow } from './workflows/sweep.workflow.js';

const result = await executeSweepWorkflow({
  repositories: [
    'blackroad-os-core',
    'blackroad-os-api',
    'blackroad-os-prism-console'
  ],
  prId: 'PR-123',
  commitSha: 'abc123def456',
  checks: ['lint', 'test', 'security']
});

console.log(`Total checks: ${result.summary.total}`);
console.log(`Passed: ${result.summary.passed}`);
console.log(`Failed: ${result.summary.failed}`);
```

**Workflow Steps:**

1. **Fan-out: Parallel checks** 🧵
   - For each repository
     - For each check type
       - Run check with retry logic
       - Emit progress event

2. **Fan-in: Aggregate results** 🧵
   - Collect all check results
   - Calculate summary statistics
   - Determine overall status

3. **Finalize** ✅
   - Mark as processed
   - Emit completion event
   - Return aggregated results

## Creating Your Own Workflow

### 1. Define Input and Result Types

```typescript
export interface MyWorkflowInput {
  // Required parameters
  resourceId: string;
  action: string;
  
  // Optional parameters
  options?: {
    dryRun?: boolean;
    timeout?: number;
  };
  
  // Idempotency support
  idempotencyKey?: IdempotencyKey;
}

export interface MyWorkflowResult extends Record<string, unknown> {
  workflowId: string;
  status: 'completed' | 'failed' | 'partial';
  // Add workflow-specific result fields
  processedItems?: number;
  error?: string;
}
```

### 2. Implement Main Workflow Function

```typescript
import { randomUUID } from 'crypto';
import type { IdempotencyKey } from '../types/index.js';
import {
  emitWorkflowStarted,
  emitWorkflowCompleted,
  emitWorkflowFailed
} from '../utils/eventBus.js';
import {
  createIdempotencyKey,
  isProcessed,
  markProcessed
} from '../utils/idempotency.js';
import logger from '../utils/logger.js';
import { withRetry, DEFAULT_RETRY_POLICY } from '../utils/retry.js';

export async function executeMyWorkflow(
  input: MyWorkflowInput
): Promise<MyWorkflowResult> {
  const workflowId = randomUUID();
  const definitionId = 'my-workflow';

  // 🔁 Check idempotency
  const idempotencyKey =
    input.idempotencyKey ||
    createIdempotencyKey('my-workflow', input.resourceId);

  if (await isProcessed(idempotencyKey)) {
    logger.info(
      { workflowId, idempotencyKey },
      '🔁 workflow already processed'
    );
    // Return cached result
    return { workflowId, status: 'completed' };
  }

  // 📡 Emit workflow started
  emitWorkflowStarted(workflowId, definitionId, {
    source: 'blackroad-os-operator',
    correlationId: workflowId
  });

  logger.info({ workflowId, input }, 'workflow started');

  try {
    // Step 1: Execute workflow logic
    const result = await withRetry(
      async () => {
        // Your workflow logic here
        logger.info({ workflowId }, 'step 1: executing');
        return { processedItems: 42 };
      },
      DEFAULT_RETRY_POLICY,
      { operation: 'my-workflow-step-1' }
    );

    // Create final result
    const workflowResult: MyWorkflowResult = {
      workflowId,
      status: 'completed',
      processedItems: result.processedItems
    };

    // 🔁 Mark as processed
    await markProcessed(idempotencyKey, workflowResult);

    // 📡 Emit success
    emitWorkflowCompleted(workflowId, definitionId, workflowResult, {
      source: 'blackroad-os-operator',
      correlationId: workflowId
    });

    logger.info({ workflowId, result: workflowResult }, 'workflow completed');

    return workflowResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({ workflowId, error: errorMessage }, 'workflow failed');

    // 📡 Emit failure
    emitWorkflowFailed(workflowId, definitionId, errorMessage, {
      source: 'blackroad-os-operator',
      correlationId: workflowId
    });

    const failedResult: MyWorkflowResult = {
      workflowId,
      status: 'failed',
      error: errorMessage
    };

    await markProcessed(idempotencyKey, failedResult);

    return failedResult;
  }
}
```

### 3. Mark Compliance-Sensitive Workflows

For workflows that touch finance, identity, or policy:

```typescript
/**
 * My Compliance-Sensitive Workflow
 * 
 * COMPLIANCE-SENSITIVE WORKFLOW
 * Category: finance | identity | policy
 * Audit: required
 * Review: mandatory before deployment
 */
export async function executeComplianceWorkflow(
  input: ComplianceInput
): Promise<ComplianceResult> {
  // Implementation with extra logging and validation
}
```

## Testing Workflows

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { clearEvents } from '../src/utils/eventBus.js';
import { executeMyWorkflow } from '../src/workflows/my.workflow.ts';

// Mock Redis for idempotency
vi.mock('../src/queues/index.js', () => ({
  connection: {
    exists: vi.fn().mockResolvedValue(0),
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1)
  }
}));

describe('My Workflow', () => {
  beforeEach(() => {
    clearEvents();
  });

  afterEach(() => {
    clearEvents();
    vi.clearAllMocks();
  });

  it('should complete workflow successfully', async () => {
    const result = await executeMyWorkflow({
      resourceId: 'test-123',
      action: 'process'
    });

    expect(result.status).toBe('completed');
    expect(result.workflowId).toBeDefined();
  });

  it('should be idempotent', async () => {
    const input = {
      resourceId: 'test-123',
      action: 'process'
    };

    const result1 = await executeMyWorkflow(input);
    const result2 = await executeMyWorkflow(input);

    expect(result1.status).toBe('completed');
    expect(result2.status).toBe('completed');
    // Verify no double side-effects
  });

  it('should handle failures gracefully', async () => {
    // Test error scenarios
  });
});
```

### Testing Checklist

For each workflow, ensure tests cover:

- ✅ **Success path**: Workflow completes normally
- ✅ **Idempotency**: Running twice has no double side-effects
- ✅ **Failure handling**: Errors are caught and logged
- ✅ **Partial failures**: Some steps succeed, others fail
- ✅ **Event emission**: Workflow emits expected events
- ✅ **Status outputs**: Result has clear status (success/failed/partial)

For critical workflows (deploys, migrations, policy changes):

- 🧪 **Dry run mode**: Preview changes without applying
- 🧪 **Rollback scenarios**: Verify rollback logic works
- 🧪 **Circuit breaker**: Test behavior when services are down
- 🧪 **Timeout handling**: Long-running operations timeout properly

## See Also

- [OPERATOR_ENGINE.md](./OPERATOR_ENGINE.md) - Comprehensive operator engine documentation
- [OPERATOR_RUNTIME_OVERVIEW.md](./OPERATOR_RUNTIME_OVERVIEW.md) - Runtime architecture
- [Agent Catalog](../agent-catalog/agents.yaml) - Available operator agents

---

**Next!!!** 🚀⚙️💚
