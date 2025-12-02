# Stage 2: Mesh & Infrastructure Governance

> **Amundson Protocol v0.1.0**
> - Governor: `alice.governor.v1`
> - Operator: `alexa.operator.v1`

This document describes the governance integration for mesh networking and infrastructure operations in BlackRoad OS.

## Overview

Stage 2 extends the Amundson governance model to cover:

| Scope | Purpose | Invariant | Ledger Level |
|-------|---------|-----------|--------------|
| `mesh.*` | Mesh network connections | delegation_id OR role=operator | full |
| `agents.*` | Agent-to-agent invocations | actor_agent_id AND capability claim | full |
| `infra.*` | Infrastructure operations | role=operator | full |

All mesh and infra actions flow through:
1. **Policy Evaluation** (`POST /policy/evaluate`)
2. **Ledger Recording** (`POST /ledger/event`)

## Endpoints

### POST /mesh/connect

Governed mesh connection for agents, Pi nodes, and edge devices.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `user_id` | string | No | User ID (if human-initiated) |
| `role` | string | Yes | Role: `agent`, `pi-node`, `edge-device`, `operator` |
| `agent_id` | string | No | Agent identifier |
| `delegation_id` | string | Conditional | Required unless role=operator |
| `connection_type` | string | No | Default: `websocket` |

**Example (with delegation):**
```bash
curl -X POST "http://localhost:8000/mesh/connect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "role=agent&agent_id=cece.assistant.v1&delegation_id=del-abc123"
```

**Example (operator role):**
```bash
curl -X POST "http://localhost:8000/mesh/connect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "user_id=alexa&role=operator"
```

**Response (success):**
```json
{
  "connection_id": "conn-550e8400-e29b-41d4-a716-446655440000",
  "correlation_id": "corr-660e8400-e29b-41d4-a716-446655440001",
  "decision": "allow",
  "policy_id": "mesh.connect.delegated-allow"
}
```

**Response (denied - no delegation):**
```
HTTP 403 Forbidden
{
  "detail": "mesh.*/agents.* actions require explicit delegation or operator role"
}
```

---

### POST /agents/invoke/{agent_id}

Governed agent invocation. One agent calling another through the mesh.

**Path Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agent_id` | string | Target agent to invoke (e.g., `lucidia.system.v1`) |

**Query Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `capability` | string | Yes | Capability being invoked (e.g., `invoke`, `deploy`) |
| `user_id` | string | No | Originating user ID |
| `role` | string | No | Default: `agent` |
| `invoker_agent_id` | string | Conditional | Required for capability validation |
| `payload` | object | No | JSON payload for the invocation |

**Example:**
```bash
curl -X POST "http://localhost:8000/agents/invoke/lucidia.system.v1?capability=invoke&invoker_agent_id=cece.assistant.v1&role=agent" \
  -H "Content-Type: application/json" \
  -d '{"task": "generate_report", "params": {"format": "pdf"}}'
```

**Response (success):**
```json
{
  "invocation_id": "inv-770e8400-e29b-41d4-a716-446655440002",
  "correlation_id": "corr-880e8400-e29b-41d4-a716-446655440003",
  "agent_id": "lucidia.system.v1",
  "capability": "invoke",
  "decision": "allow",
  "policy_id": "agents.invoke.capability-allow",
  "agent": {
    "id": "lucidia.system.v1",
    "name": "Lucidia",
    "capabilities": ["invoke", "deploy", "analyze"]
  }
}
```

**Response (denied - missing capability):**
```
HTTP 403 Forbidden
{
  "detail": "agents.* actions require capability claim for 'invoke'"
}
```

---

### POST /operator/service/{service_name}/{action}

Governed infrastructure operations. Only operators can perform these actions.

**Path Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `service_name` | string | Target service (e.g., `gov-api`, `mesh-router`) |
| `action` | string | Operation: `restart`, `scale`, `deploy`, `rollback` |

**Query Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `user_id` | string | Yes | Operator user ID |
| `scale_to` | int | No | Target replica count (for scale action) |

**Example (restart):**
```bash
curl -X POST "http://localhost:8000/operator/service/gov-api/restart?user_id=alexa"
```

**Example (scale):**
```bash
curl -X POST "http://localhost:8000/operator/service/mesh-router/scale?user_id=alexa&scale_to=4"
```

**Response (success):**
```json
{
  "operation_id": "op-990e8400-e29b-41d4-a716-446655440004",
  "correlation_id": "corr-aa0e8400-e29b-41d4-a716-446655440005",
  "service": "gov-api",
  "action": "restart",
  "decision": "allow",
  "policy_id": "infra.service.restart.operator-only",
  "status": "executed"
}
```

**Response (denied - not operator):**
```
HTTP 403 Forbidden
{
  "detail": "Operation denied by policy"
}
```

---

## Invariants

### Mesh Invariant

**Rule:** `mesh.* actions require delegation_id OR role=operator`

This is enforced in code BEFORE policy evaluation. If violated, the request is denied with:
- `policy_id`: `invariant:mesh-delegation-required`
- `policy_version`: `invariant-v1`
- `ledger_level`: `full`

**Why?** The mesh is a privileged network. Anonymous access would allow unauthorized message routing and eavesdropping.

### Agents Invariant

**Rule:** `agents.* actions require actor_agent_id AND capability claim`

The invoking agent must:
1. Identify itself (`invoker_agent_id`)
2. Present a capability claim matching the action

If violated:
- `policy_id`: `invariant:agents-capability-required`
- `policy_version`: `invariant-v1`
- `ledger_level`: `full`

**Why?** Agent-to-agent communication must be auditable and capability-scoped.

### Infra Invariant

**Rule:** `infra.* actions require role=operator`

Only operators can:
- Restart services
- Scale services
- Deploy new versions
- Run database migrations
- Rotate secrets

All infra actions are logged at full fidelity.

---

## Policy Packs

### mesh-policies v1.0.0

Location: `config/policies.mesh.yaml`

| Policy ID | Action | Effect | Conditions |
|-----------|--------|--------|------------|
| `mesh.connect.operator-allow` | `mesh:connect` | allow | role=operator |
| `mesh.connect.delegated-allow` | `mesh:connect` | allow | delegation claim + delegation_valid |
| `mesh.route.operator-allow` | `mesh:route` | allow | role=operator |
| `mesh.route.delegated-allow` | `mesh:route` | allow | delegation claim + route_within_scope |
| `agents.invoke.operator-allow` | `agents:invoke` | allow | role=operator |
| `agents.invoke.capability-allow` | `agents:invoke` | allow | capability claim + target_registered |
| `agents.register.operator-only` | `agents:register` | allow | role=operator |
| `mesh.pi.connect.device-cert` | `mesh:connect` | allow | role=pi-node + device_cert_valid |
| `mesh.edge.connect.authenticated` | `mesh:connect` | allow | role=edge-device + device_authenticated |
| `mesh.default-deny` | `mesh:*` | deny | (catch-all) |
| `agents.default-deny` | `agents:*` | deny | (catch-all) |

### infra-policies v1.0.0

Location: `config/policies.infra.yaml`

| Policy ID | Action | Effect | Conditions |
|-----------|--------|--------|------------|
| `infra.service.restart.operator-only` | `operator:restart` | allow | role=operator |
| `infra.service.scale.operator-only` | `operator:scale` | allow | role=operator |
| `infra.service.deploy.operator-only` | `operator:deploy` | allow | role=operator |
| `infra.service.rollback.operator-only` | `operator:rollback` | allow | role=operator |
| `infra.db.migrate.operator-only` | `operator:migrate` | allow | role=operator |
| `infra.db.backup.operator-only` | `operator:backup` | allow | role=operator |
| `infra.db.restore.operator-only` | `operator:restore` | warn | role=operator + restore_confirmed |
| `infra.config.update.operator-only` | `operator:config-update` | allow | role=operator |
| `infra.secrets.rotate.operator-only` | `operator:rotate-secrets` | warn | role=operator + rotation_confirmed |
| `infra.logs.view.operator-allow` | `operator:view-logs` | allow | role=operator |
| `infra.metrics.view.operator-allow` | `operator:view-metrics` | allow | role=operator |
| `infra.health.check.any-allow` | `operator:health-check` | allow | is_authenticated |
| `infra.default-deny` | `operator:*` | deny | (catch-all) |

---

## Ledger Events

All mesh/infra actions generate ledger events at `ledger_level=full`. Example event structure:

```json
{
  "id": "evt-123",
  "correlation_id": "corr-456",
  "occurred_at": "2025-12-01T12:00:00Z",
  "layer": "mesh",
  "host": "mesh.blackroad.network",
  "service": "mesh-router",
  "policy_scope": "mesh.*",
  "actor": {
    "user_id": null,
    "role": "agent",
    "agent_id": "cece.assistant.v1",
    "delegation_id": "del-789"
  },
  "action": "mesh:connect",
  "resource_type": "mesh",
  "resource_id": "conn-abc",
  "decision": "allow",
  "policy_id": "mesh.connect.delegated-allow",
  "policy_version": "mesh-v1",
  "ledger_level": "full",
  "metadata": {
    "connection_type": "websocket",
    "event_type": "mesh:connected",
    "language_version": "0.1.0",
    "policy_pack": "mesh-policies",
    "policy_pack_version": "1.0.0"
  },
  "request_context": { ... },
  "response_summary": { "connected": true }
}
```

---

## Python Ledger Builders

Location: `br_operator/ledger_builder.py`

Helper functions for building compliant ledger events:

```python
from br_operator.ledger_builder import (
    build_mesh_connect_event,
    build_mesh_route_event,
    build_agent_invoke_event,
    build_agent_register_event,
    build_operator_infra_event,
    build_db_operation_event,
    validate_ledger_event,
)

# Build a mesh connection event
event = build_mesh_connect_event(
    request=policy_request,
    response=policy_response,
    connection_id="conn-123",
    connection_type="websocket",
    client_info={"device_type": "raspberry-pi"},
)

# Validate before recording
validate_ledger_event(event)

# Record to ledger
await ledger_service.record(event)
```

---

## Architecture Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Caller     │────▶│   Endpoint   │────▶│   Invariant  │
│ (Agent/Op)   │     │ /mesh/connect│     │    Check     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                          ┌───────────────────────┴──────────┐
                          │                                  │
                          ▼                                  ▼
                   ┌──────────────┐                  ┌──────────────┐
                   │   DENY       │                  │   Policy     │
                   │ (invariant)  │                  │   Engine     │
                   └──────────────┘                  └──────┬───────┘
                          │                                  │
                          │                                  ▼
                          │                          ┌──────────────┐
                          │                          │   Ledger     │
                          │                          │   Builder    │
                          │                          └──────┬───────┘
                          │                                  │
                          ▼                                  ▼
                   ┌──────────────┐                  ┌──────────────┐
                   │   Record     │◀─────────────────│   Record     │
                   │   DENY evt   │                  │   evt        │
                   └──────────────┘                  └──────────────┘
```

---

## Related Files

- `config/policies.mesh.yaml` - Mesh policy pack
- `config/policies.infra.yaml` - Infra policy pack
- `config/service_registry.yaml` - Host → governance mapping
- `br_operator/ledger_builder.py` - Python ledger builders
- `br_operator/main.py` - Endpoint implementations
- `lib/ledger-builder.ts` - TypeScript ledger builders
- `examples/stage2-mesh-infra-payloads.json` - Example JSON payloads
