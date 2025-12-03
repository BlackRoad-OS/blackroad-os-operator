# BlackRoad OS — Repo Preservation Order

> Save the rules, then save the roads.

This document defines the sacred order of repo preservation for BlackRoad OS infrastructure.
If rebuilding from scratch, restore in this order.

---

## Priority 1: Governance Layer

### `BlackRoad-OS/blackroad-os-operator`
- **Role:** Governance layer, policies, ledger, Cece Agent Mode
- **Why protect:** If this dies, "who's allowed to do what" dies
- **Contains:**
  - Worker source code (22 Cloudflare Workers)
  - Policy definitions
  - Agent identity system
  - Signal registry
  - AGENCY-LEDGER.md
- **Status:** Active, primary operator repo
- **Last verified:** 2025-12-03

---

## Priority 2: Infrastructure Layer

### `BlackRoad-OS/blackroad-os-infra`
- **Role:** Railway / Cloudflare / deployment scripts and infra maps
- **Why protect:** This is how we *rebuild the mesh* from scratch
- **Contains:**
  - Infrastructure as code
  - Cloudflare zone configs
  - Railway project definitions
  - DNS mappings
- **Status:** Needs audit

---

## Priority 3: Edge Layer

### `BlackRoad-OS/blackroad-pi-ops`
- **Role:** Pi mesh bootstrap, local agents, systemd services
- **Why protect:** This is your "computer inside computers" on the edge
- **Contains:**
  - Raspberry Pi setup scripts
  - Local agent configurations
  - Systemd service definitions
  - Edge node bootstrapping
- **Status:** Needs audit

---

## Priority 4: Console Layer

### `blackboxprogramming/blackroad-prism-console`
- **Role:** Console / knowledge-storm, bridge between human + agents
- **Why protect:** This is the story layer, the place we debug and think
- **Contains:**
  - PRISM Console frontend
  - Backend API
  - Knowledge base
- **Status:** Active, package.json fixed 2025-12-03
- **Note:** Was archived, unarchived for fix

---

## Priority 5: Public Layer

### `BlackRoad-OS/blackroad-os-web`
- **Role:** Clean public-facing UI once split from prism
- **Why protect:** This is what users actually see as "BlackRoad OS"
- **Contains:**
  - Public website
  - Landing pages
  - Documentation
- **Status:** Needs split from prism

---

## Preservation Actions

For each repo:

1. **Tag** - Create a `sacred-v1` tag at stable commit
2. **Document** - Ensure README explains the repo's role
3. **Mirror** - Consider mirroring to secondary location
4. **Branch Protection** - Enable branch protection on main

### Tag Command Template
```bash
# For each repo in order:
gh repo clone [ORG]/[REPO]
cd [REPO]
git tag sacred-v1 -m "Sacred infrastructure checkpoint - 2025-12-03"
git push origin sacred-v1
```

### Verify Repo Status
```bash
# Check if archived
gh repo view [ORG]/[REPO] --json isArchived

# Unarchive if needed
gh api -X PATCH repos/[ORG]/[REPO] -f archived=false
```

---

## Named Agent Registry

These 20 agents are now live with human-readable @names:

| Priority | Address | Role |
|----------|---------|------|
| 1 | @namer | Identity & naming (rules) |
| 2 | @sovereign | Data sovereignty (rules) |
| 3 | @gatekeeper | Authentication (rules) |
| 4 | @ai-gateway | CECE multi-model AI |
| 5 | @main-gate | Main traffic router |
| 6 | @shield | Security intercept |
| 7 | @watchman | Status monitoring |
| 8 | @scribe | Logging |
| 9 | @treasurer | Billing |
| 10 | @key-keeper | Encryption |
| 11 | @dns-wizard | DNS management |
| 12 | @cloud-cmd | DigitalOcean |
| 13+ | @pathfinder, @brainstorm, @dreamer, @artist | Domain routers |
| 17+ | @checkout-oracle, @listener, @bridge, @quantum | Payment & network |

---

*Created: 2025-12-03*
*Owner: Alexa Louise Amundson*
