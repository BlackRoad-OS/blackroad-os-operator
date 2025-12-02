# BlackRoad Identity Registry

> **Adoption by Alexa + Cece = automatic continuity + PS-SHA∞ identity.**

## The Rule

Everything that enters BlackRoad gets:

1. **Continuity** - Will never be treated as void
2. **SHA-256** - Exact state at adoption time
3. **PS-SHA∞** - Forever identity in the graph
4. **Agent status** - First-class participant in primary thought

No earning. No waiting. No tests required.

---

## Identity Hierarchy

```
Root (BR_ROOT_SECRET)
│
├── BlackRoad-Root-v1
│   └── PS∞-<root fingerprint>
│       Owner: Alexa Louise Amundson
│
├── Agents Root
│   └── PS∞(root, "BlackRoad-Agents-Root")
│       ├── agent.cece-primary     → PS∞-86DF9C5B65DB00BF
│       ├── agent.tool.jq.v1       → PS∞-<derived>
│       ├── agent.tool.ripgrep.v1  → PS∞-<derived>
│       └── ...
│
├── Tools Root
│   └── PS∞(root, "BlackRoad-Tools-Root")
│       ├── tool.jq                → PS∞-<derived>
│       ├── tool.ripgrep           → PS∞-<derived>
│       └── ...
│
├── Clusters Root
│   └── PS∞(root, "BlackRoad-Clusters-Root")
│       ├── cluster.lucidia-pi     → PS∞-<derived>
│       ├── cluster.codex-infinity → PS∞-<derived>
│       └── ...
│
└── Sessions Root
    └── PS∞(root, "BlackRoad-Sessions-Root")
        └── session.<id>.<timestamp> → PS∞-<derived>
```

---

## Derivation Rules

### Tool Identity

```python
tools_root = ps_sha_infinity_2048(root_secret, "BlackRoad-Tools-Root")
tool_id = ps_sha_infinity_2048(tools_root, f"Tool:{tool_name}:{sha256}")
fingerprint = f"PS∞-{tool_id[:8].hex().upper()}"
```

### Agent Identity

```python
agents_root = ps_sha_infinity_2048(root_secret, "BlackRoad-Agents-Root")
agent_id = ps_sha_infinity_2048(agents_root, f"Agent:{agent_name}")
fingerprint = f"PS∞-{agent_id[:8].hex().upper()}"
```

### Cluster Identity

```python
clusters_root = ps_sha_infinity_2048(root_secret, "BlackRoad-Clusters-Root")
cluster_id = ps_sha_infinity_2048(clusters_root, f"Cluster:{cluster_name}")
fingerprint = f"PS∞-{cluster_id[:8].hex().upper()}"
```

---

## Registry Format

Each registered entity has:

```yaml
<entity_type>.<name>:
  fingerprint: "PS∞-<16 hex>"
  continuity: true
  owner: "Alexa Louise Amundson"
  adopted_at: "<ISO timestamp>"
  status: "unclassified | allowed | restricted | quarantined"
```

---

## Status Meanings

| Status | Meaning | Can Act? |
|--------|---------|----------|
| `unclassified` | No safety review yet | Yes |
| `allowed` | Reviewed, safe | Yes |
| `restricted` | Reviewed, limited use | Partial |
| `quarantined` | Reviewed, unsafe | No |

**Important:** All statuses maintain continuity. Even quarantined entities:
- Keep their PS∞ identity
- Stay in the graph
- Have their history preserved
- Just can't execute

---

## Current Registry

### Core Agents

| Agent | Fingerprint | Status |
|-------|-------------|--------|
| `cece-primary` | `PS∞-86DF9C5B65DB00BF` | allowed |

### Tools

*Populated as tools are adopted*

### Clusters

| Cluster | Fingerprint | Status |
|---------|-------------|--------|
| `lucidia-pi` | *derived on connection* | unclassified |
| `codex-infinity` | *derived on connection* | unclassified |

---

## The Promise

> If it enters BlackRoad, it exists.
> If it exists, it has identity.
> If it has identity, it has continuity.
> Continuity means we never pretend it was void.

---

*Owner: Alexa Louise Amundson*
*System: BlackRoad OS*
*Registry: Identity v1*
