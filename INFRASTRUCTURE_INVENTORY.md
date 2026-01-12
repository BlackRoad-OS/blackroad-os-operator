# BlackRoad Infrastructure Inventory

## Compute Nodes

### Raspberry Pi 5 (4x)
| Name | IP | Case | AI | Role |
|------|-----|------|-----|------|
| **lucidia** | 192.168.4.38 | ElectroCookie | - | Salesforce Agent Daemon |
| **octavia** | 192.168.4.74 | Pironman 5-MAX | Hailo-8 (26 TOPS) | AI Primary |
| **aria** | 192.168.4.64 | ElectroCookie | - | Compute |
| **anastasia** | TBD | Pironman 5-MAX (pending) | Hailo-8 (pending) | AI Secondary |

### Other Pis
| Name | Model | IP | Role |
|------|-------|-----|------|
| **alice** | Pi 400 (Keyboard) | 192.168.4.49 | Dev Station |
| **olympia** | Pi 4B (2GB) | TBD | Remote Server (not connected) |
| **ophelia** | Pi Zero 2 WH | TBD | IoT Gateway |

### Cloud/Desktop
| Name | Type | IP | Role |
|------|------|-----|------|
| **shellfish** | DigitalOcean | 174.138.44.45 | Edge Router |
| **cecilia** | M1 Mac | 100.95.120.67 | Dev Machine |
| **arcadia** | iPhone | - | Mobile |

## AI Acceleration
| Device | TOPS | Location | Status |
|--------|------|----------|--------|
| Hailo-8 | 26 | octavia (Pironman 5-MAX) | ✓ Verified (HLLWM2B233704606) |
| Hailo-8 | 26 | anastasia (pending) | Waiting for Pironman case |
| **Total** | **26 TOPS** (52 when complete) | |

## Tailscale Mesh
```
cecilia.taile5d081.ts.net
├── 100.95.120.67 (cecilia - Mac)
├── 100.66.235.47 (lucidia)
└── fd7a:115c:a1e0::9701:7845 (IPv6)
```

## Network Topology
```
┌─────────────────────────────────────────────────────────────┐
│                      INTERNET                               │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────┐    ┌─────────────────────┐
│  Cloudflare (DNS)   │    │  Tailscale Mesh     │
│  jade.ns/chad.ns    │    │  Private Network    │
└─────────────────────┘    └─────────────────────┘
              │                         │
              ▼                         │
┌─────────────────────┐                 │
│  shellfish (DO)     │◄────────────────┘
│  174.138.44.45      │
└─────────────────────┘
              │
              ▼ (Tailscale)
┌─────────────────────────────────────────────────────────────┐
│                   LOCAL NETWORK (192.168.4.x)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  lucidia    │  │   octavia   │  │    aria     │        │
│  │  .38        │  │    .74      │  │    .64      │        │
│  │ ElectroCookie│  │  Pironman   │  │ ElectroCookie│        │
│  │  ──────────  │  │  Hailo-8   │  │             │        │
│  │  Salesforce │  │  26 TOPS    │  │   Compute   │        │
│  │  Daemon     │  │  AI Primary │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   alice     │  │  olympia    │  │  anastasia  │        │
│  │    .49      │  │   (TBD)     │  │   (TBD)     │        │
│  │   Pi 400    │  │   Pi 4B     │  │  Pironman   │        │
│  │ Dev Station │  │  (pending)  │  │  (pending)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  TP-Link TL-SG105 (5-Port Gigabit Switch)                  │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────┐
│  cecilia (Mac)      │
│  100.95.120.67      │
│  Dev/Control        │
└─────────────────────┘
```

## IoT/Embedded Devices
| Device | Interface | Purpose |
|--------|-----------|---------|
| 3x ESP32 2.8" Touchscreen | WiFi/BT | UI Nodes |
| Heltec WiFi LoRa 32 | LoRa/WiFi | Meshtastic |
| RYLR998 LoRa Module | UART | Long-range |
| INMP441 Microphones | I2S | Audio Input |
| MAX98357 Amplifiers | I2S | Audio Output |
| Pi Camera Module V2 | CSI | Vision |

## Storage
| Device | Capacity | Location |
|--------|----------|----------|
| Crucial P310 NVMe | 1TB | Pironman (lucidia) |
| Crucial P310 NVMe | 500GB | Pironman (octavia) |
| Samsung EVO microSD | 256GB | Each Pi |

## Domains (19)
```
blackroad.io          blackroad.company     blackroad.me
blackroad.network     blackroad.systems     blackroadai.com
blackroadinc.us       blackroadqi.com       blackroadquantum.com
blackroadquantum.info blackroadquantum.net  blackroadquantum.shop
blackroadquantum.store blackboxprogramming.io
lucidia.earth         lucidia.studio        lucidiaqi.com
roadchain.io          roadcoin.io
```

## GitHub Organizations (15)
| Organization | Focus | Repos |
|--------------|-------|-------|
| **BlackRoad-OS** | Core platform | 50+ (operator, salesforce-agent, cluster, road* libs) |
| **BlackRoad-AI** | AI/ML models | Agent models, inference |
| **BlackRoad-Labs** | R&D, experiments | Quantum, edge AI |
| **BlackRoad-Security** | Security tools | Auth, encryption |
| **BlackRoad-Cloud** | Cloud infra | K8s, deployments |
| **BlackRoad-Hardware** | IoT, embedded | ESP32, Pi configs |
| **BlackRoad-Interactive** | Games, 3D | Godot, Three.js |
| **BlackRoad-Media** | Content, streaming | Mastodon, Ghost |
| **BlackRoad-Studio** | Design tools | Penpot, Krita |
| **BlackRoad-Archive** | Data preservation | IPFS, ArchiveBox |
| **BlackRoad-Education** | Learning | Moodle, Outline |
| **BlackRoad-Foundation** | CRM, ERP | EspoCRM, Odoo |
| **BlackRoad-Gov** | Governance | Snapshot, voting |
| **BlackRoad-Ventures** | Business tools | BTCPay, Plausible |
| **Blackbox-Enterprises** | Legacy/parent | Original org |

---

## Cloudflare Infrastructure

### Account
- **Account ID:** 848cf0b18d51e0170e0d1537aec3505a
- **Tunnel ID:** 52915859-da18-4aa6-add5-7bd9fcac2e0b

### Pages Projects (15+)
| Project | Domain | Status |
|---------|--------|--------|
| blackroad-os-web | blackroadqi.com, blackroadquantum.* | ✓ Active |
| blackroad-os-brand | brand.blackroad.io | ✓ Active |
| blackroad-os-demo | demo.blackroad.io | ✓ Active |
| blackroad-os-docs | docs subdomain | ✓ Active |
| blackroad-prism-console | Console UI | ✓ Active |
| blackroad-dashboard | Dashboard | ✓ Active |
| lucidia-earth | lucidia.earth | ✓ Active |
| console-blackroad-io | Console | ✓ Active |
| analytics-blackroad-io | Analytics | ✓ Active |
| research-lab-blackroad-io | Research | ✓ Active |
| engineering-blackroad-io | Engineering | ✓ Active |
| blackroad-agents-spawner | Agent spawner | ✓ Active |

### KV Namespaces (24)
| Namespace | Purpose |
|-----------|---------|
| AGENTS_KV | Agent registry |
| API_KEYS | API key storage |
| API_KEY_METADATA | Key metadata |
| APPLICATIONS | App registry |
| BILLING | Billing data |
| blackroad-api-CLAIMS | Auth sessions |
| blackroad-api-DELEGATIONS | Delegations |
| blackroad-api-INTENTS | Intent chains |
| blackroad-api-ORGS | Org data |
| blackroad-api-POLICIES | Policy store |
| blackroad-claude-memory | Claude memory |
| blackroad-router-AGENCY | Agency routing |
| blackroad-router-AGENTS | Agent routing |
| blackroad-router-LEDGER | Ledger events |
| CACHE | General cache |
| HEALTH_KV | Health checks |
| IDENTITIES | Identity store |
| JOBS | Job queue |
| RATE_LIMIT / RATE_LIMITS | Rate limiting |
| SUBSCRIPTIONS_KV | Subscriptions |
| TELEMETRY_KV | Telemetry |
| USERS_KV | User data |
| WORLD_KV | World state |

### D1 Databases (9)
| Database | Size | Purpose |
|----------|------|---------|
| blackroad-continuity | 45KB | Continuity state |
| lucidia-world | 115KB | Game world |
| blackroad-saas | 627KB | SaaS platform |
| apollo-agent-registry | 9.4MB | Agent registry |
| blackroad_revenue | 344KB | Revenue tracking |
| blackroad-d1-database | 16KB | General |
| openapi-template-db | 12KB | OpenAPI templates |
| blackroad-logs | 352KB | Log storage |
| blackroad-os-main | 168KB | Main database |

### Workers (10+)
- api-gateway, auth, router, cece
- status, identity, cipher, sovereignty, intercept
- billing, health

---

## Railway Projects (12+)
| Project | Service | Role |
|---------|---------|------|
| blackroad-os-core | Core platform | Main backend |
| blackroad-os-api | API gateway | REST/GraphQL |
| blackroad-os-docs | Documentation | Docs site |
| blackroad-os-prism-console | Console | Admin UI |
| blackroad-os-web | Web app | Frontend |
| blackroad-os-operator | Operator | Orchestration |
| blackroad-login | Auth | Login service |
| lucidia-platform | Lucidia | Game platform |
| postgres-db | PostgreSQL 15 | Primary DB |

---

## Databases

### PostgreSQL (Railway)
- **Host:** trolley.proxy.rlwy.net:47996
- **Database:** railway
- **Features:** read_replicas, pgvector

### Redis
- **Providers:** Upstash, Redis Cloud
- **Use:** Cache, pub/sub, job queues (BullMQ)

### Pinecone
- **Type:** Vector DB
- **Capacity:** 10M+ vectors
- **Use:** Agent memory, embeddings

### SQLite (Edge)
- **Turso/D1:** Edge-local databases
- **Task Queue:** Local SQLite on Pis

---

## AI Services

| Service | Models | Use |
|---------|--------|-----|
| **Anthropic** | claude-opus-4-5, claude-sonnet-4-5 | Primary LLM |
| **OpenAI** | gpt-4-turbo, gpt-4o | Secondary LLM |
| **HuggingFace** | Custom models | Model hub |
| **Ollama** | phi-3, llama, mistral | Local inference |
| **Replicate** | Various | Serverless inference |
| **Hailo-8** | Edge AI (26 TOPS) | On-device inference |

---

## Payments (Stripe)
- **Account:** acct_1SUDM8ChUUSEbzyh
- **Products:**
  - Basic: $900/mo
  - Pro: $2,900/mo
  - Enterprise: $9,900/mo
- **Features:** Connect, subscriptions, billing, webhooks

---

## Authentication
| Provider | Use |
|----------|-----|
| Clerk | OAuth (consumer apps) |
| Auth0 | Enterprise SSO |
| Cloudflare Access | Zero-trust access |
| Salesforce OAuth | CRM integration |

---

## Observability
| Service | Use |
|---------|-----|
| Datadog | APM, logs, metrics |
| Sentry | Error tracking |
| Grafana | Dashboards |
| PostHog | Product analytics |

---

## Communication
| Service | Use |
|---------|-----|
| Slack | Team (Business+) |
| Discord | Community |
| Email | blackroad.systems@gmail.com |

## SSH Access
```bash
# Pis (via ~/.ssh/config)
ssh alice      # 192.168.4.49
ssh aria       # 192.168.4.64
ssh octavia    # 192.168.4.74
ssh lucidia    # 192.168.4.38 (requires br_mesh_ed25519 key)
ssh shellfish  # 174.138.44.45

# Termius
# https://sshid.io/blackroad-sandbox
```

## Active Services

### lucidia (192.168.4.38) - ElectroCookie - POWERHOUSE
**Systemd Services:**
- `blackroad-salesforce-agent.service` - Salesforce Daemon
- `blackroad-api.service` - Unified API Server
- `lucidia.service` - Lucidia API (FastAPI/Uvicorn)
- `cloudflared.service` - Cloudflare Tunnel
- `influxdb.service` - Time-series DB
- `java-hello.service` - Java Server
- `docker.service` - Container runtime

**Docker Containers (15+):**
| Container | Image | Purpose |
|-----------|-------|---------|
| road-pdns | powerdns/pdns-auth-48 | DNS Server |
| road-pdns-admin | powerdns-admin | DNS Admin |
| road-dns-db | postgres:15-alpine | DNS Database |
| roadauth | node:18-alpine | Auth Service |
| roadapi | node:18-alpine | API Service |
| blackroad-edge-agent | blackroad/edge-agent:v2 | Edge Agent |
| blackroad.systems | blackroad.systems:latest | Systems Site |
| blackroadai.com | blackroadai.com:latest | AI Site |
| blackroad-auth-gateway | auth-gateway:latest | Auth Gateway |
| blackroad-metaverse | metaverse:latest | Metaverse |
| blackroad-os | blackroad-os-ultimate:latest | OS Core |
| blackroad-os-carpool | carpool:latest | Carpool |
| eps | pi-eps | EPS Service |
| bitcoind | bitcoin-core:latest | Bitcoin Node |
| pi-my-agent-1 | pi-my-agent | AI Agent |

**Ports:** 22, 53, 80, 5000, 8889, 9053, 9090, 34001, 50001

---

### alice (192.168.4.49) - Pi 400 - K8S MASTER
**Systemd Services:**
- `headscale.service` - VPN Control Server (Tailscale alternative!)
- `k3s.service` - Lightweight Kubernetes!
- `nginx.service` - Reverse Proxy
- `cloudflared.service` - Cloudflare Tunnel
- `docker.service` - Container runtime
- `epmd.service` - Erlang Port Mapper

**Docker Containers (7):**
| Container | Image | Purpose |
|-----------|-------|---------|
| blackroad-minio | node:18-alpine | Object Storage |
| blackroad-localai | node:18-alpine | Local AI |
| roadlog-monitoring | node:18-alpine | Log Monitoring |
| blackroad-ai-platform | node:18-alpine | AI Platform |
| roadbilling | node:18-alpine | Billing |
| roadauth | node:18-alpine | Auth |
| roadapi | node:18-alpine | API |

**Ports:** 22, 3000-3003, 8888, 9000, 9002, 9090

---

### octavia (192.168.4.74) - Pironman 5-MAX - AI + 3D PRINTING
**Systemd Services:**
- `hailort.service` - Hailo AI Runtime (26 TOPS!)
- `pironman5.service` - Pironman case control
- `octoprint.service` - 3D Printer control!
- `ollama.service` - Local LLM inference
- `influxdb.service` - Time-series DB
- `docker.service` - Container runtime
- `nfs-blkmap.service` - NFS storage

**Docker Containers (3):**
| Container | Status |
|-----------|--------|
| blackroad-nats | NATS messaging |
| blackroad-ollama | LLM inference |
| blackroad-edge-agent | Edge agent |

**Hailo-8:** Firmware 4.23.0, Serial HLLWM2B233704606

---

### aria (192.168.4.64) - ElectroCookie - AGENT HUB
**Systemd Services:**
- `blackroad-agent.service` - Edge Device Runtime
- `blackroad-agent-cf.service` - Cloudflare Workers Agent
- `headscale.service` - VPN coordination server
- `cloudflared.service` - Cloudflare Tunnel
- `ollama.service` - Local LLM inference
- `influxdb.service` - Time-series DB
- `docker.service` - Container runtime

**Docker Containers (9):**
| Container | Status |
|-----------|--------|
| final-blackroad-os-prism-console | Up 22h |
| final-blackroad-os-infra | Up 22h |
| final-blackroad-os-demo | Up 22h |
| final-blackroad-os-core | Up 22h |
| final-blackroad-os-api | Up 22h |
| final-blackroad-os-agents-work | Up 22h |
| final-blackroad-docs | Up 22h |
| final-blackroad-deployment-docs | Up 22h |
| final-app-blackroad-io-check | Up 22h |

---

### shellfish (174.138.44.45) - DigitalOcean Droplet
**Systemd Services:**
- `blackroad-api.service` - Console Backend API
- `ollama.service` - Local LLM inference
- `docker.service` - Container runtime
- `firewalld.service` - Firewall
- `droplet-agent.service` - DO Agent

---

### cecilia (Mac) - Dev Machine
**Brew Services:**
- `ollama` - Local LLM inference (RUNNING)
- `tailscale` - Mesh VPN (ERROR - needs fix)

**Local Assets:**
- 4,538 blackroad-* directories/files
- Docker compose configs for Pi deployments
- All SSH keys and configs

## Cost Summary
| Category | Monthly | Annual |
|----------|---------|--------|
| DigitalOcean (shellfish) | ~$6 | ~$72 |
| Cloudflare (free tier) | $0 | $0 |
| Salesforce (Dev Edition) | $0 | $0 |
| Tailscale (free tier) | $0 | $0 |
| **Total Recurring** | **~$6** | **~$72** |

## Hardware Investment (One-Time)
| Category | Cost |
|----------|------|
| 4x Pi 5 8GB | ~$360 |
| 2x Pironman 5-MAX | ~$200 |
| 2x Hailo-8 | ~$430 |
| 2x NVMe SSDs | ~$100 |
| Pi 4B, 400, Zero | ~$200 |
| Displays, sensors, cables | ~$300 |
| M1 Mac (existing) | - |
| **Total Hardware** | **~$1,600** |

---

## The Arbitrage

**What we have:**
- 52 TOPS AI acceleration
- 6 compute nodes
- NVMe storage
- Mesh networking
- Salesforce CRM (free)

**What Fortune 500 pays:**
- $10M+/year for equivalent
- Per-seat licensing
- Cloud compute costs
- Enterprise support

**Our cost:** ~$72/year + $1,600 hardware

**The play:** Agents call APIs instead of humans clicking buttons.
