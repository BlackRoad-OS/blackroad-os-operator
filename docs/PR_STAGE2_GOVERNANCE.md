# PR: Stage 2 Governance - Mesh, Agents, and Infrastructure Integration

## Summary

This PR implements Stage 2 of the Amundson governance model, extending policy evaluation and ledger recording to mesh networking, agent invocations, and infrastructure operations.

**Governance Headers:**
```
amundson: 0.1.0
governor: alice.governor.v1
operator: alexa.operator.v1
```

## What's New

### Endpoints

| Endpoint | Purpose | Invariant |
|----------|---------|-----------|
| `POST /mesh/connect` | Governed mesh connections | delegation OR operator |
| `POST /agents/invoke/{agent_id}` | Governed agent invocations | agent_id AND capability claim |
| `POST /operator/service/{service}/{action}` | Governed infra operations | operator role only |

### Policy Packs

- **mesh-policies v1.0.0** (`config/policies.mesh.yaml`)
  - 11 policies covering mesh:connect, mesh:route, agents:invoke, agents:register
  - Default stance: deny
  - Ledger level: full

- **infra-policies v1.0.0** (`config/policies.infra.yaml`)
  - 13 policies covering operator:restart, operator:scale, operator:deploy, operator:migrate, etc.
  - Default stance: deny
  - Ledger level: full

### Invariants (Hard Rules)

These are enforced in code BEFORE policy evaluation:

| Scope | Rule | On Violation |
|-------|------|--------------|
| `mesh.*` | Must have `delegation_id` OR `role=operator` | DENY with `invariant:mesh-delegation-required` |
| `agents.*` | Must have `actor_agent_id` AND capability claim | DENY with `invariant:agents-capability-required` |
| `infra.*` | Must have `role=operator` | DENY via default-deny policy |

### Files Changed

**New Files:**
- `config/policies.mesh.yaml` - Mesh/agent policy pack
- `config/policies.infra.yaml` - Infrastructure policy pack
- `br_operator/ledger_builder.py` - Python ledger event builders
- `docs/GOVERNANCE_MESH_INFRA.md` - Stage 2 documentation
- `docs/STAGE3_VISION.md` - Future roadmap
- `examples/stage2-mesh-infra-payloads.json` - Example JSON payloads

**Modified Files:**
- `config/service_registry.yaml` - Added Stage 2 invariants header
- `br_operator/main.py` - Added mesh/agents/infra endpoints + imports

## Testing

### Prerequisites

```bash
# Start the dev stack
./scripts/dev-stack.sh up

# Verify governance health
curl http://localhost:8000/governance/health
```

### Test Checklist

#### Mesh Connect

- [ ] **With delegation (expect ALLOW):**
```bash
curl -X POST "http://localhost:8000/mesh/connect" \
  -d "role=agent&agent_id=test-agent&delegation_id=del-123"
```

- [ ] **As operator (expect ALLOW):**
```bash
curl -X POST "http://localhost:8000/mesh/connect" \
  -d "user_id=alexa&role=operator"
```

- [ ] **Without delegation or operator (expect DENY 403):**
```bash
curl -X POST "http://localhost:8000/mesh/connect" \
  -d "role=agent&agent_id=test-agent"
```

#### Agent Invoke

- [ ] **With capability claim (expect ALLOW):**
```bash
curl -X POST "http://localhost:8000/agents/invoke/test-target?capability=invoke&invoker_agent_id=cece.assistant.v1&role=agent"
```

- [ ] **Without capability (expect DENY 403):**
```bash
curl -X POST "http://localhost:8000/agents/invoke/test-target?capability=invoke&role=agent"
```

#### Infra Operations

- [ ] **Operator restart (expect ALLOW):**
```bash
curl -X POST "http://localhost:8000/operator/service/gov-api/restart?user_id=alexa"
```

- [ ] **Operator scale (expect ALLOW):**
```bash
curl -X POST "http://localhost:8000/operator/service/mesh-router/scale?user_id=alexa&scale_to=4"
```

#### Ledger Verification

- [ ] **Check events were recorded:**
```bash
curl "http://localhost:8000/ledger/events?limit=10"
```

- [ ] **Verify ledger_level=full for mesh/infra events**
- [ ] **Verify policy_pack metadata in event metadata**

### Expected Ledger Event Shape

```json
{
  "layer": "mesh",
  "host": "mesh.blackroad.network",
  "policy_scope": "mesh.*",
  "decision": "allow",
  "ledger_level": "full",
  "metadata": {
    "policy_pack": "mesh-policies",
    "policy_pack_version": "1.0.0",
    "language_version": "0.1.0"
  }
}
```

## Architecture

```
Request → Endpoint → Invariant Check → Policy Engine → Ledger Builder → Record
                          ↓                  ↓
                     DENY (hard)         ALLOW/DENY/WARN
                          ↓                  ↓
                     Record DENY         Record decision
```

## Governance Contract

All mesh/agent/infra actions now:
1. Pass through invariant checks (hard rules)
2. Evaluate against policy packs
3. Record to immutable ledger at appropriate fidelity
4. Include Amundson protocol metadata

## Related

- Stage 1 PR: Education vertical governance
- Stage 3 Vision: Intent chains (multi-step workflows) - see `docs/STAGE3_VISION.md`

## Reviewers

- [ ] Policy pack YAML syntax valid
- [ ] Invariants match documentation
- [ ] Ledger events conform to schema
- [ ] curl examples work as documented
