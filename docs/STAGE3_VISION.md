# Stage 3 Vision: Intent Chains & Multi-Step Governance

> **Amundson Protocol v0.1.0**
> - Governor: `alice.governor.v1`
> - Operator: `alexa.operator.v1`

## What We Have Now

**Stage 1:** Education vertical governance (teacher create, student submit, teacher review)
**Stage 2:** Mesh/agent/infra governance (connections, invocations, operations)

Both stages handle **single-action governance**: one request, one policy evaluation, one ledger event.

## Stage 3: Intent Chains

Stage 3 introduces **multi-step intent governance** - sequences of actions that form a coherent workflow.

### The Problem

Consider a deployment workflow:
1. Agent requests deployment authorization
2. Operator approves
3. System runs pre-deploy checks
4. System executes deployment
5. System runs post-deploy validation

Currently, each step is independent. We have no way to:
- Track that steps 2-5 are part of the same workflow
- Enforce that step 4 can only happen after step 3
- Roll back the entire chain if step 5 fails
- Audit the complete workflow as a unit

### The Solution: Intents

An **Intent** is a first-class governance object representing a multi-step workflow:

```yaml
intent:
  id: "intent-deploy-abc123"
  type: "deployment"
  state: "in_progress"  # pending | in_progress | completed | failed | rolled_back
  created_at: "2025-12-01T12:00:00Z"
  created_by: "cece.assistant.v1"

  steps:
    - sequence: 1
      action: "deployment:request"
      status: "completed"
      completed_at: "2025-12-01T12:00:01Z"

    - sequence: 2
      action: "deployment:approve"
      status: "completed"
      completed_at: "2025-12-01T12:01:00Z"
      approved_by: "alexa.operator.v1"

    - sequence: 3
      action: "deployment:pre-check"
      status: "in_progress"
      started_at: "2025-12-01T12:01:05Z"

    - sequence: 4
      action: "deployment:execute"
      status: "pending"

    - sequence: 5
      action: "deployment:validate"
      status: "pending"

  # All ledger events in this chain share this intent_id
  ledger_events:
    - "evt-001"  # deployment:request
    - "evt-002"  # deployment:approve
    - "evt-003"  # deployment:pre-check (in progress)
```

### New Governance Concepts

#### 1. Intent Templates

Define valid workflows as templates:

```yaml
# intent-templates/deployment.yaml
template:
  type: "deployment"
  required_steps:
    - action: "deployment:request"
      required: true
    - action: "deployment:approve"
      required: true
      requires_role: "operator"
    - action: "deployment:pre-check"
      required: true
    - action: "deployment:execute"
      required: true
    - action: "deployment:validate"
      required: true

  rollback_on_failure:
    - "deployment:execute"
    - "deployment:validate"

  timeout: "PT30M"  # 30 minutes max
```

#### 2. Step Dependencies

Enforce ordering:

```python
# In policy evaluation
def evaluate_step(intent_id: str, step: int, action: str):
    intent = get_intent(intent_id)

    # Check previous step is complete
    if step > 1:
        prev_step = intent.steps[step - 1]
        if prev_step.status != "completed":
            return PolicyEffect.DENY, "Previous step not completed"

    # Check intent is still valid
    if intent.state not in ("pending", "in_progress"):
        return PolicyEffect.DENY, f"Intent is {intent.state}"

    # Evaluate the step-specific policy
    return evaluate_policy(...)
```

#### 3. Intent-Scoped Ledger Events

All events in an intent chain share:
- `intent_id`: UUID of the parent intent
- `sequence_num`: Step number within the intent

This allows:
```sql
-- Get full audit trail for a deployment
SELECT * FROM ledger_events
WHERE intent_id = 'intent-deploy-abc123'
ORDER BY sequence_num;
```

### New Endpoints

```
POST /intents/create
  - Create a new intent from a template
  - Returns intent_id

POST /intents/{intent_id}/step/{sequence}
  - Execute a step in the intent
  - Validates dependencies
  - Records ledger event with intent_id

GET /intents/{intent_id}
  - Get intent status and all steps

POST /intents/{intent_id}/rollback
  - Trigger rollback of a failed intent
  - Creates rollback ledger events

GET /intents/{intent_id}/audit
  - Get complete audit trail (all ledger events)
```

### Use Cases

#### 1. Deployment Pipeline
```
intent:deployment → request → approve → pre-check → execute → validate
```

#### 2. Student Assignment Flow
```
intent:assignment → create → publish → submit → grade → release
```

#### 3. Agent Registration
```
intent:agent-register → request → verify-capabilities → approve → activate
```

#### 4. Secret Rotation
```
intent:secret-rotate → request → backup-current → generate-new → validate → activate → cleanup
```

### Governance Implications

| Aspect | Stage 2 (Current) | Stage 3 (Intent Chains) |
|--------|-------------------|-------------------------|
| Scope | Single action | Multi-step workflow |
| Audit | Per-action | Per-workflow + per-action |
| Rollback | Manual | Automatic (template-defined) |
| Dependencies | None | Enforced ordering |
| Timeout | N/A | Configurable per-template |

### Implementation Phases

**Phase 3.1: Intent Storage**
- Intent table in ledger DB
- Intent CRUD endpoints
- Link ledger events to intents

**Phase 3.2: Templates & Validation**
- Template YAML format
- Step dependency validation
- Template registry

**Phase 3.3: Rollback & Recovery**
- Rollback action generation
- Partial completion handling
- Timeout monitoring

**Phase 3.4: UI & Observability**
- Intent status dashboard
- Workflow visualization
- Alert on stuck intents

---

## Beyond Stage 3

### Stage 4: Delegation Chains

Extend the delegation model:
- Time-bounded delegations
- Capability-scoped delegations
- Delegation revocation
- Delegation audit trail

### Stage 5: Cross-Tenant Governance

Multi-tenant scenarios:
- Tenant isolation policies
- Cross-tenant resource sharing
- Tenant-specific policy packs
- Federated ledger queries

### Stage 6: AI Agent Governance

Special policies for AI agents:
- Rate limiting per agent
- Capability escalation rules
- Human-in-the-loop gates
- Agent behavior auditing

---

## Summary

Stage 3 transforms BlackRoad governance from "single actions" to "coherent workflows", enabling:

1. **Traceability**: Follow a workflow from start to finish
2. **Enforcement**: Ensure steps happen in order
3. **Recovery**: Automatic rollback on failure
4. **Audit**: Complete workflow audit trail

The foundation from Stages 1 & 2 (policy evaluation + ledger events) remains unchanged. Stage 3 adds a coordination layer on top.

---

*"Every complex action is really a chain of simpler ones. Governance must see the chain, not just the links."*

— alice.governor.v1
