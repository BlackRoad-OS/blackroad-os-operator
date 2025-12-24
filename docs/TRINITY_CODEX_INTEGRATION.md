# Light Trinity & BlackRoad Codex Integration

This document describes the integration of the **Light Trinity System** and **BlackRoad Codex** into the BlackRoad OS Operator.

## Overview

The operator now provides:

1. **Light Trinity Integration** - Event logging and tracking across GreenLight, YellowLight, and RedLight systems
2. **BlackRoad Codex Access** - API access to governance principles and agent pantheon

## Light Trinity System

The Light Trinity is BlackRoad OS's unified intelligence, templating, and infrastructure system consisting of three interconnected lights:

### 🟢 GreenLight — Project & Collaboration System
**Purpose:** Real-time intelligence, multi-Claude coordination, event tracking

- **14 layers** of integration (Memory → Infrastructure → Business → Intelligence)
- **103 template functions** for logging events across entire stack
- **200+ emoji states** for unified visual language
- **Use for:** Logging deployments, tracking issues, monitoring performance

### 💛 YellowLight — Infrastructure & Deployment System
**Purpose:** Infrastructure automation, deployment workflows, ops intelligence

- **Infrastructure templates** for Railway, Cloudflare, DigitalOcean
- **Deployment automation** with rollback capabilities
- **Server management** across all BlackRoad infrastructure
- **Use for:** Deploying services, managing infrastructure

### 🔴 RedLight — Template & Brand System
**Purpose:** Visual identity, brand consistency, design templates

- **18 HTML brand templates** for landing pages, animations, 3D worlds
- **Template generation system** for creating new branded pages
- **Design patterns** following golden ratio (φ = 1.618)
- **Use for:** Creating new marketing pages, landing pages, product showcases

## BlackRoad Codex

The Codex defines the governance framework, ethical principles, and operational guidelines for BlackRoad OS. It contains 82+ codified principles (entries) that guide all system behavior.

### Codex Entries (Governance Principles)

Examples:
- **001 - First Principle:** Protection & Empowerment
- **002 - Guardian:** System protection
- **011 - Ethical North Star:** Ethical guidance
- **022 - Security Spine:** Zero-trust defenses

### Codex Pantheon

The Pantheon defines 48+ named agent archetypes representing different specializations:

**Knowledge & Reasoning:** Ophelia, Cicero, Athena, Silas
**Technical & Engineering:** Cecilia (Cece), Magnus, Kai, Alaric
**Care & Ethics:** Arden, Seraphina, Cordelia, Miriam
**Creativity & Innovation:** Calliope, Icarus, Thalia, Alice

## API Endpoints

### Codex Endpoints

#### List All Codex Entries
```bash
GET /codex/entries
```

Response:
```json
{
  "entries": [
    {
      "id": "001-first-principle",
      "number": "001",
      "name": "First Principle",
      "file": "001-first-principle.md"
    }
  ],
  "total": 82
}
```

#### Get Specific Codex Entry
```bash
GET /codex/entries/{entry_id}
```

Example:
```bash
curl http://localhost:8080/codex/entries/001-first-principle
```

Response:
```json
{
  "id": "001",
  "file": "001-first-principle.md",
  "content": "# First Principle\n...",
  "path": "/app/codex/entries/001-first-principle.md"
}
```

#### Get Pantheon
```bash
GET /codex/pantheon
```

Returns the complete agent pantheon structure.

#### List Pantheon Agents
```bash
GET /codex/pantheon/agents
```

Response:
```json
{
  "agents": [
    {
      "name": "Cecilia",
      "lineage": "Technical",
      "epithet": "cathedral of meaning",
      "domains": ["language", "grammar"],
      "color": "#E8C4F0"
    }
  ],
  "total": 48
}
```

#### Get Specific Pantheon Agent
```bash
GET /codex/pantheon/agents/{agent_name}
```

Example:
```bash
curl http://localhost:8080/codex/pantheon/agents/alice
```

#### Get Manifesto
```bash
GET /codex/manifesto
```

Returns the codex pantheon manifesto.

#### Search Codex
```bash
GET /codex/search?q={query}
```

Example:
```bash
curl http://localhost:8080/codex/search?q=security
```

### Trinity Endpoints

#### Get Trinity Events
```bash
GET /trinity/events?light={greenlight|yellowlight|redlight}&limit={number}
```

Example:
```bash
curl http://localhost:8080/trinity/events?light=greenlight&limit=50
```

Response:
```json
{
  "events": [
    {
      "light": "greenlight",
      "event_type": "operator_started",
      "message": "BlackRoad OS Operator started (version: abc123)",
      "metadata": {
        "service": "operator",
        "version": "abc123"
      },
      "timestamp": "2025-12-24T06:00:00Z"
    }
  ],
  "total": 1,
  "light": "greenlight"
}
```

#### Log Trinity Event
```bash
POST /trinity/log
```

Request body:
```json
{
  "light": "greenlight",
  "event_type": "deployment_complete",
  "message": "Service deployed successfully",
  "metadata": {
    "service": "api",
    "environment": "production"
  }
}
```

#### Get Trinity Status
```bash
GET /trinity/status
```

Response:
```json
{
  "trinity_path": "/app/.trinity",
  "lights": {
    "greenlight": true,
    "yellowlight": true,
    "redlight": true
  },
  "total_events": 42
}
```

## Integration with Agent Catalog

The agent catalog (`agent-catalog/agents.yaml`) now includes pantheon agents:

- **cece** (Cecilia) - Language & communication
- **alice** - Question opener & explorer
- **lucidia** - Clarity & synthesis
- **aria** - Infrastructure Queen
- **silas** - Logic & verification
- **athena** - Strategic planning
- **magnus** - Infrastructure orchestration
- **seraphina** - Protection & ethics

Each pantheon agent includes:
- `pantheon: true` flag
- `lineage` designation (Technical, Scholars, Care, Creativity)
- `epithet` description
- `color` hex code

## Usage Examples

### Example 1: Access Codex Entry Before Policy Evaluation

```python
from br_operator.codex_service import get_codex_service

# Load security principles before evaluating policy
codex = get_codex_service()
security_entry = codex.load_entry("022-security-spine")

# Use principles to guide policy evaluation
if "zero-trust" in security_entry["content"]:
    # Apply zero-trust principles
    pass
```

### Example 2: Log Deployment with Trinity

```python
from br_operator.trinity_service import get_trinity_service

trinity = get_trinity_service()

# Log deployment start
trinity.log_deployment(
    service="api",
    platform="railway",
    url="https://api.blackroad.io",
    status="started"
)

# ... perform deployment ...

# Log deployment completion
trinity.log_deployment(
    service="api",
    platform="railway",
    url="https://api.blackroad.io",
    status="success"
)
```

### Example 3: Query Pantheon Agent

```python
from br_operator.codex_service import get_codex_service

codex = get_codex_service()

# Get Alice's archetype for exploration tasks
alice = codex.get_agent_archetype("alice")
print(f"Alice: {alice['epithet']}")
# Output: Alice: question doors
```

## Architecture

### Services

1. **CodexService** (`br_operator/codex_service.py`)
   - Loads codex entries from `codex/entries/`
   - Parses pantheon from `codex/pantheon.json`
   - Provides search and access methods

2. **TrinityService** (`br_operator/trinity_service.py`)
   - Logs events to GreenLight, YellowLight, RedLight
   - Maintains in-memory event buffer
   - Supports NATS subject pattern generation

### Integration Points

- **Startup:** Trinity logs operator start event
- **Chat:** Codex principles inform responses
- **Policy:** Codex entries validate governance
- **Deployment:** Trinity tracks infrastructure changes

## Environment Variables

```bash
# Override codex path (default: ./codex)
CODEX_PATH=/path/to/codex

# Override trinity path (default: ./.trinity)
TRINITY_PATH=/path/to/.trinity
```

## Testing

Test codex access:
```bash
curl http://localhost:8080/codex/entries
curl http://localhost:8080/codex/pantheon/agents
```

Test trinity logging:
```bash
curl http://localhost:8080/trinity/status
curl http://localhost:8080/trinity/events
```

## Compliance

Trinity compliance is automatically checked via:
```bash
.github/workflows/trinity-compliance.yml
```

The workflow verifies:
- ✅ `.trinity/` directory exists
- ✅ All three lights present (Red, Green, Yellow)
- ✅ System documentation present
- ✅ Template counts match expected

## Philosophy

> "We don't just log events. We share understanding."
> — The Light Trinity Principle

The Trinity and Codex integration ensures:
1. **Ethical AI** - All agents guided by explicit principles
2. **Transparency** - Decisions traceable to codified rules
3. **Collective Intelligence** - Knowledge shared across entire organization
4. **Operational Excellence** - Infrastructure operations guided by proven patterns

## Further Reading

- `.trinity/README.md` - Complete Trinity system overview
- `.trinity/system/THE_LIGHT_TRINITY.md` - Light Trinity specification
- `codex/README.md` - Codex governance overview
- `codex/manifesto.md` - Agent pantheon manifesto
