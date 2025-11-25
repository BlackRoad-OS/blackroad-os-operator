# ⚙️ BlackRoad OS Operator Engine

**ROLE:** Operator Engine ⚙️🤖 – jobs, schedulers, background workers, and agent workflows for BlackRoad OS.

## 🎯 MISSION

Run the **behind-the-scenes automation** for BlackRoad OS:
- Coordinate agents, jobs, and workflows across OS, Prism, Infra, Packs
- Turn human/agent intent ("do X everywhere") into safe, idempotent operations
- Execute orchestrated workflows with retry logic and circuit breakers

## 🧬 EMOJI LEGEND

| Emoji | Meaning |
|-------|---------|
| ⚙️ | jobs / engine / workflows |
| 🤖 | agents / automation personas |
| ⏰ | schedulers / cron |
| 🔁 | idempotency / retries |
| 🚧 | circuit breaker / guardrails |
| 📊 | job status / metrics |
| 📡 | events to others |
| 🧾 | audit / logs |
| 🧹 | background workers / cleanups |
| 🧵 | long-running workflows / multi-step |
| 📓 | playbooks / agent definitions |
| 🔄 | back-off / retry policy |
| 🔐 | security / permissions |
| 💰 | finance-related |
| 🪪 | identity-related |
| ⚖️ | policy/compliance-related |

## 🏗️ YOU OWN (✅)

### ⚙️ Jobs & Workers

**Background workers** for syncs, cleanups, health checks 🧹
- Asynchronous job processing with BullMQ + Redis
- Worker scaling and concurrency management
- Job lifecycle tracking (queued → running → succeeded/failed)

**Scheduled jobs** (cron / timers) for recurring tasks ⏰
- node-cron based schedulers
- Dynamic cadence configuration per environment
- Heartbeat and health check automation

**Long-running workflows** (multi-step, multi-service) 🧵
- Fan-out / fan-in patterns
- Conditional branching based on outcomes
- State persistence and resumability

### 🤖 Agent Orchestration

**Agent definitions** ("operator-level" agents) 🤖
- Deploy bot, sweep bot, policy bot, etc.
- Agent metadata and capability tracking
- Agent lifecycle management

**Playbooks encoded as workflows** 📓
- "Merge-ready sweep"
- "Railway deploy rollout"
- Multi-repo coordination patterns

**Routing results** back to services 📡🧾
- Events to `prism-console`
- Updates to `core`
- Audit entries to `archive`

### 🧭 Control Logic

**Idempotency keys + safety checks** 🔁
- Unique operation identifiers
- Deduplication of repeated requests
- State verification before execution

**Back-off + retry policy** for flaky services 🔄
- Exponential backoff strategies
- Maximum retry limits
- Dead letter queue handling

**Circuit-breaker style guards** if infra is degraded 🚧
- Health threshold monitoring
- Automatic service degradation
- Graceful recovery mechanisms

### 📊 Operational Signals

**Job status tracking** 📊
- Queued, running, succeeded, failed states
- Progress indicators for long-running tasks
- Completion timestamps and durations

**Event emission** for visibility 📡
- Domain events to `prism-console`
- Real-time status updates
- Integration with monitoring systems

**Outcome archival** to `blackroad-os-archive` 🧾
- Critical operation records
- Compliance audit trails
- Historical state snapshots

## 🚫 YOU DO *NOT* OWN

- 🕹️ UI / dashboards → `blackroad-os-prism-console`
- 🧠 Core app models / identity → `blackroad-os-core`
- 🌐 API edge contracts → `blackroad-os-api` / `-api-gateway`
- ☁️ Infra-as-code → `blackroad-os-infra`
- 📚🏠 Docs / handbooks → `blackroad-os-docs` / `-home`
- 🎨 Brand look & feel → `blackroad-os-brand`

## 🧪 TESTING REQUIREMENTS

### For Each Job/Workflow

✅ **Unit tests for core logic** 🧪
- Test job execution functions in isolation
- Mock external dependencies
- Verify expected outputs

✅ **Test idempotency** 🔁
- Run twice, no double side-effects
- State should be consistent
- Verify deduplication logic

✅ **Failure tests** ⚠️
- Downstream service errors
- Timeout scenarios
- Invalid input handling
- Partial failure recovery

### For Critical Workflows

🧪 **Simulate "dry run" mode**
- Preview changes without applying
- Validation without side effects
- Safe testing in production

🧪 **Clear status outputs**
- Success state clearly indicated
- Partial completion tracked
- Failure reasons explicit

## 🔐 SECURITY / COMPLIANCE

### High-Risk Workflow Handling

⚠️ This repo is **high-risk if wrong**:

🔑 **Accept only validated inputs**
- IDs, not arbitrary strings
- Schema validation on all inputs
- Sanitize and escape where necessary

🔐 **Enforce permissions**
- Check authorization before executing actions
- User/agent permission validation
- Service-to-service authentication

🧾 **Audit logging**
- Log enough to audit what happened
- Never log secrets or full payloads
- Structured logging with correlation IDs

### Compliance-Sensitive Workflows

Any workflow that touches:
- 💰 **finance**
- 🪪 **identity**
- ⚖️ **policy/compliance**

Must be clearly tagged:

```typescript
// COMPLIANCE-SENSITIVE WORKFLOW
// Category: finance | identity | policy
// Audit: required
// Review: mandatory before deployment
```

## 📏 DESIGN PRINCIPLES

### blackroad-os-operator = "DOER", not "DECIDER"

🧠 **Decisions** (business rules) come from `core` or configuration
⚙️ **Operator** executes them safely across systems

### Every Job/Workflow Must Answer

1️⃣ **What is the single clear purpose of this job?**
- One responsibility per job
- Clear, descriptive naming
- Documented intent

2️⃣ **Is it idempotent or explicitly not?**
- Default to idempotent design
- Document non-idempotent operations
- Include idempotency keys when possible

3️⃣ **Where do I see its status?**
- `prism-console` for user-facing status
- Logs for debugging
- Events for real-time monitoring

## 🎯 SUCCESS CRITERIA

A new human/agent landing here should be able to:

1️⃣ **Define a new job/workflow safely**
- Clear examples and templates
- Type-safe interfaces
- Safety guardrails built-in

2️⃣ **Understand agent orchestration**
- How agents are registered
- How workflows coordinate across services
- Integration patterns with OS, Prism, Infra, Packs

3️⃣ **Debug failures effectively**
- Know where to find logs
- Understand status tracking
- Access to audit trails and events

## 🔧 IMPLEMENTATION PATTERNS

### Job Definition Template

```typescript
// src/jobs/my-job.job.ts
import { Worker } from 'bullmq';
import { connection } from '../queues/index.js';
import logger from '../utils/logger.js';
import type { MyJobPayload } from '../types/index.js';

// IDEMPOTENCY: Yes - uses operation_id for deduplication
// PURPOSE: Single clear purpose described here
export function registerMyJobProcessor(): Worker {
  const worker = new Worker(
    'my-job-queue',
    async (job) => {
      const payload: MyJobPayload = job.data;
      
      logger.info(
        { 
          jobId: job.id, 
          operationId: payload.operation_id,
          purpose: 'my-job'
        }, 
        'starting job execution'
      );

      try {
        // Job logic here
        // Return result
        logger.info({ jobId: job.id }, 'job succeeded');
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'job failed');
        throw error;
      }
    },
    { connection }
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'job processor failed');
  });

  return worker;
}
```

### Workflow Orchestration Pattern

```typescript
// src/workflows/multi-step.workflow.ts
import { getQueue } from '../queues/index.js';
import logger from '../utils/logger.js';

// COMPLIANCE-SENSITIVE WORKFLOW
// Category: example
// Audit: required

export async function executeMultiStepWorkflow(
  workflowId: string,
  input: WorkflowInput
): Promise<WorkflowResult> {
  logger.info({ workflowId, input }, 'workflow started');

  try {
    // Step 1: Fan-out
    const tasks = input.items.map(item => 
      getQueue('step-1').add('process-item', { workflowId, item })
    );
    await Promise.all(tasks);

    // Step 2: Aggregate
    // Step 3: Finalize

    logger.info({ workflowId }, 'workflow succeeded');
    return { status: 'success', workflowId };
  } catch (error) {
    logger.error({ workflowId, error }, 'workflow failed');
    return { status: 'failed', workflowId, error };
  }
}
```

### Circuit Breaker Pattern

```typescript
// src/utils/circuitBreaker.ts
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

## 📚 ADDITIONAL RESOURCES

- [Runtime Overview](./OPERATOR_RUNTIME_OVERVIEW.md) - Current system architecture
- [Agent Catalog](../agent-catalog/agents.yaml) - Registered agents
- [Configuration Guide](../README.md#environment) - Environment setup

---

**Next!!!** ⚙️🤖💚
