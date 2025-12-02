# BlackRoad Enterprise Subdomain Architecture

> Designed for 30,000 agents, 30 billion users, and $1 trillion scale

## Overview

This document describes the complete subdomain architecture across all 16 BlackRoad domains, totaling **487 subdomains** organized into logical categories.

## Domain Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLACKROAD DOMAIN PORTFOLIO                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TIER 1: PRIMARY (3 domains)                                     │
│  ├── blackroad.io        → Main platform (98 subdomains)        │
│  ├── lucidia.earth       → AI agents (72 subdomains)            │
│  └── blackroadinc.us     → Corporate (38 subdomains)            │
│                                                                  │
│  TIER 2: PRODUCT (5 domains)                                     │
│  ├── blackroadai.com     → AI services (42 subdomains)          │
│  ├── blackroad.me        → User portal (32 subdomains)          │
│  ├── blackroad.network   → Infrastructure (36 subdomains)       │
│  ├── blackroad.systems   → Governance (34 subdomains)           │
│  └── lucidia.studio      → Creative (28 subdomains)             │
│                                                                  │
│  TIER 3: AGENT (1 domain)                                        │
│  └── aliceqi.com         → Alice identity (16 subdomains)       │
│                                                                  │
│  TIER 4: QUANTUM (3 domains)                                     │
│  ├── blackroadquantum.com → Quantum computing (24 subdomains)   │
│  ├── blackroadqi.com      → QI research (18 subdomains)         │
│  └── lucidiaqi.com        → Quantum agents (12 subdomains)      │
│                                                                  │
│  TIER 5: REDIRECT/COMMERCE (4 domains)                           │
│  ├── blackroadquantum.info → Redirect (3 subdomains)            │
│  ├── blackroadquantum.net  → Redirect (3 subdomains)            │
│  ├── blackroadquantum.shop → Commerce (6 subdomains)            │
│  └── blackroadquantum.store → Redirect (3 subdomains)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Subdomain Categories

### API Infrastructure (62 subdomains)

Regional API endpoints for global latency optimization:

| Region | Subdomain | Location |
|--------|-----------|----------|
| US East | `api-us.blackroad.io` | Virginia |
| US West | `api-us-west.blackroad.io` | Oregon |
| EU West | `api-eu.blackroad.io` | Frankfurt |
| EU Central | `api-eu-west.blackroad.io` | Ireland |
| Asia Pacific | `api-ap.blackroad.io` | Singapore |
| AP North | `api-ap-north.blackroad.io` | Tokyo |
| AP South | `api-ap-south.blackroad.io` | Mumbai |
| South America | `api-sa.blackroad.io` | São Paulo |
| Africa | `api-af.blackroad.io` | Johannesburg |
| Middle East | `api-me.blackroad.io` | Dubai |
| Australia | `api-au.blackroad.io` | Sydney |
| China | `api-cn.blackroad.io` | Shanghai (partner) |

Versioned APIs:
- `api.blackroad.io` - Primary gateway (geo-routed)
- `api-v1.blackroad.io` - Legacy (deprecated)
- `api-v2.blackroad.io` - Current stable
- `api-v3.blackroad.io` - Next generation

Access tiers:
- `api-internal.blackroad.io` - Internal services (mTLS)
- `api-partner.blackroad.io` - Partner integrations
- `api-enterprise.blackroad.io` - Enterprise SLA

### Agent Platform (48 subdomains)

Agent runtime subdomains on `lucidia.earth`:

```
agents.lucidia.earth       → Agent directory
agent.lucidia.earth        → Individual agent API
runtime.lucidia.earth      → Runtime engine
spawn.lucidia.earth        → Spawning service
orchestrator.lucidia.earth → Orchestration
scheduler.lucidia.earth    → Scheduling

# Regional clusters
agents-us.lucidia.earth    → US cluster
agents-eu.lucidia.earth    → EU cluster (GDPR)
agents-ap.lucidia.earth    → APAC cluster
agents-global.lucidia.earth → Global mesh
```

Memory & state:
```
memory.lucidia.earth       → Memory service
memories.lucidia.earth     → Memory explorer
recall.lucidia.earth       → Recall API
context.lucidia.earth      → Context management
state.lucidia.earth        → State persistence
checkpoint.lucidia.earth   → Checkpoints
```

### Authentication (28 subdomains)

Complete auth stack:

```
auth.blackroad.io          → Auth service
login.blackroad.io         → Login portal
signup.blackroad.io        → Registration
sso.blackroad.io           → Single Sign-On
oauth.blackroad.io         → OAuth provider
id.blackroad.io            → Identity service
accounts.blackroad.io      → Account management
verify.blackroad.io        → Verification
mfa.blackroad.io           → Multi-factor auth
passkeys.blackroad.io      → Passkey auth
```

### Developer Platform (35 subdomains)

Developer-facing services:

```
dev.blackroad.io           → Developer portal
docs.blackroad.io          → Documentation
api-docs.blackroad.io      → API reference
sdk.blackroad.io           → SDK downloads
playground.blackroad.io    → Interactive playground
sandbox.blackroad.io       → Sandbox environment
console.blackroad.io       → Developer console
keys.blackroad.io          → API key management
webhooks.blackroad.io      → Webhook configuration
```

### Governance (26 subdomains)

Amundson Protocol services on `blackroad.systems`:

```
governance.blackroad.systems  → Governance engine
policies.blackroad.systems    → Policy engine
rules.blackroad.systems       → Rule engine
claims.blackroad.systems      → Claims service
delegations.blackroad.systems → Delegations
intents.blackroad.systems     → Intent chains
intent.blackroad.systems      → Intent API
flows.blackroad.systems       → Flow engine
workflows.blackroad.systems   → Workflow engine
ledger.blackroad.systems      → Governance ledger
audit.blackroad.systems       → Audit trail
history.blackroad.systems     → History explorer
```

### Quantum Computing (36 subdomains)

Quantum services across three domains:

**blackroadquantum.com:**
```
compute.blackroadquantum.com   → Quantum compute
cloud.blackroadquantum.com     → Quantum cloud
simulator.blackroadquantum.com → Circuit simulator
emulator.blackroadquantum.com  → Quantum emulator
ide.blackroadquantum.com       → Quantum IDE
circuits.blackroadquantum.com  → Circuit designer
api.blackroadquantum.com       → Quantum API
```

**blackroadqi.com (Research):**
```
research.blackroadqi.com    → Research portal
lab.blackroadqi.com         → QI lab
papers.blackroadqi.com      → Publications
experiments.blackroadqi.com → Experiments
```

**lucidiaqi.com (Quantum Agents):**
```
agents.lucidiaqi.com    → Quantum agents
quantum.lucidiaqi.com   → Quantum runtime
hybrid.lucidiaqi.com    → Hybrid compute
neural.lucidiaqi.com    → Quantum neural
```

## Routing Architecture

### Global Load Balancing

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 300+ PoPs   │  │ Anycast DNS │  │ WAF + DDoS  │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│  ┌──────▼────────────────▼────────────────▼──────┐          │
│  │              Cloudflare Workers               │          │
│  │  • API Router    • Auth Edge    • Rate Limit  │          │
│  └──────────────────────┬───────────────────────┘          │
│                         │                                    │
└─────────────────────────┼───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  US East  │   │  EU West  │   │   APAC    │
    │ Railway   │   │ Railway   │   │ Railway   │
    │ + K8s     │   │ + K8s     │   │ + K8s     │
    └───────────┘   └───────────┘   └───────────┘
```

### Service Mesh

Internal service discovery:
```
api-gateway.blackroad.internal
agents.blackroad.internal
beacon.blackroad.internal
auth.blackroad.internal
memory.blackroad.internal
```

### Edge Hardware Tunnels

Cloudflare Tunnels for edge devices:
```
tunnel-lucidia.blackroad.network  → Pi 5 (Primary)
tunnel-alice.blackroad.network    → Pi 400 (Alice)
tunnel-jetson.blackroad.network   → Jetson Orin (GPU)
tunnel-mac.blackroad.network      → Mac Studio (Dev)
```

## Security Configuration

### SSL/TLS

All domains use:
- Cloudflare Universal SSL
- Full Strict mode
- Minimum TLS 1.2
- HSTS with preload

### mTLS

Internal services require mutual TLS:
- `*.blackroad.internal`
- `api-internal.blackroad.io`

### Rate Limiting

| Tier | Requests/min | Burst |
|------|-------------|-------|
| Free | 60 | 100 |
| Starter | 1,000 | 2,000 |
| Pro | 10,000 | 20,000 |
| Enterprise | 100,000 | 200,000 |
| Partner | 1,000,000 | 2,000,000 |

### CORS Configuration

Allowed origins include all BlackRoad domains:
```yaml
allowed_origins:
  - "https://*.blackroad.io"
  - "https://*.lucidia.earth"
  - "https://*.blackroadai.com"
  - "https://*.blackroad.me"
  - "https://*.blackroad.network"
  - "https://*.blackroad.systems"
  - "https://*.lucidia.studio"
  - "https://*.aliceqi.com"
  - "https://*.blackroadquantum.com"
  - "https://*.blackroadqi.com"
  - "https://*.lucidiaqi.com"
  - "https://*.blackroadinc.us"
```

## Deployment Targets

### Railway Services

Primary application hosting:
- `blackroad-os-api-gateway`
- `blackroad-os-web`
- `blackroad-os-prism-console`
- `lucidia-agents`
- `blackroad-beacon`
- `lucidia-creator-studio`

### Cloudflare Pages

Static sites and documentation:
- `blackroad-os-docs`
- `blackroad-os-home`
- `blackroad-research`
- `blackroad-api-docs`
- `blackroad-brand`

### Cloudflare R2

Asset storage:
- `blackroad-assets`
- `blackroad-cdn`
- `lucidia-assets`
- `blackroad-uploads`
- `blackroad-backups`

### Kubernetes Clusters

Production workloads:
- `production-useast` (Virginia)
- `production-euwest` (Frankfurt)
- `production-apac` (Singapore)

## Scale Metrics

| Metric | Target |
|--------|--------|
| Concurrent Agents | 30,000 |
| Total Users | 30,000,000,000 |
| Regions | 12 |
| Edge PoPs | 300 |
| Data Centers | 50 |
| Availability | 99.999% |

## Files Reference

| File | Description |
|------|-------------|
| `enterprise-subdomains.yaml` | Complete subdomain architecture |
| `subdomain-services-map.yaml` | Service routing configuration |
| `enterprise-dns-records.yaml` | DNS record definitions |
| `zones.yaml` | Cloudflare zone configuration |
| `domain-inventory.yaml` | Domain ownership and tiers |

---

*Last updated: 2024-12-01*
*Scale target: $1,000,000,000,000 company*
