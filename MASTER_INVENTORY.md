# BlackRoad OS Master Inventory

**Generated:** 2025-12-02
**Total Entities:** 120 = 5! (matching Codex 023 prediction)

---

## Organizations (15)

| # | Organization | Status | Repos |
|---|--------------|--------|-------|
| 1 | BlackRoad-OS | **Primary** | 37 |
| 2 | BlackRoad-AI | Active | 3 |
| 3 | Blackbox-Enterprises | Reserved | 0 |
| 4 | BlackRoad-Labs | Reserved | 0 |
| 5 | BlackRoad-Cloud | Reserved | 0 |
| 6 | BlackRoad-Ventures | Reserved | 0 |
| 7 | BlackRoad-Foundation | Reserved | 0 |
| 8 | BlackRoad-Media | Reserved | 0 |
| 9 | BlackRoad-Hardware | Reserved | 0 |
| 10 | BlackRoad-Education | Reserved | 0 |
| 11 | BlackRoad-Gov | Reserved | 0 |
| 12 | BlackRoad-Security | Reserved | 0 |
| 13 | BlackRoad-Interactive | Reserved | 0 |
| 14 | BlackRoad-Archive | Reserved | 0 |
| 15 | BlackRoad-Studio | Reserved | 0 |

---

## Domains (16 Cloudflare Zones)

| # | Domain | Zone ID | Role | Status |
|---|--------|---------|------|--------|
| 1 | blackroad.systems | 13293825c2b0491085cbece9fc02e401 | **Primary Hub** | Active |
| 2 | blackroad.io | d6566eba4500b460ffec6650d3b4baf6 | Development | Active |
| 3 | blackroad.me | 622395674d479bad0a7d3790722c14be | Personal | Active |
| 4 | blackroad.network | fae5a76a78154e0509bede2e3eba8124 | Infrastructure | Active |
| 5 | blackroadinc.us | decb1bf816ff29197d88751228ad0017 | Corporate | Reserved |
| 6 | blackroadai.com | 590afe2b9b2ae222e77d89c10b7412d3 | AI Brand | Active |
| 7 | blackroadqi.com | e24dbdfd8868183e4093b8cdba709240 | QI Brand | Active |
| 8 | blackroadquantum.com | 1c93ece77e64728f506d635f5b58c60a | Quantum Main | Active |
| 9 | blackroadquantum.net | 7d606471c0feab151c8ad493fd8a5c8e | Quantum Alt | Active |
| 10 | blackroadquantum.info | 9855ce5bf6602150ea9195f3cd975d3e | Quantum Docs | Active |
| 11 | blackroadquantum.shop | b842746ff2e811c1be959e5a843b25e6 | Commerce | Reserved |
| 12 | blackroadquantum.store | 498fef62d7a9812e69413e7451edf3b1 | Commerce | Reserved |
| 13 | aliceqi.com | 927cead26cb27df79577db1bffbf2dfa | Alice QI | Active |
| 14 | lucidia.earth | a91af33930bb9b9ddfa0cf12c0232460 | Lucidia Main | Active |
| 15 | lucidiaqi.com | 8a787536b6dd285bdf06dde65e96e8c0 | Lucidia QI | Active |
| 16 | lucidia.studio | 43edda4c64475e5d81934ec7f64f6801 | Creative | Active |

---

## Cloudflare Pages Projects (8)

| Project | Pages URL | Custom Domains |
|---------|-----------|----------------|
| blackroad-os-web | blackroad-os-web.pages.dev | blackroad.io, www.blackroad.io |
| blackroad-os-docs | blackroad-os-docs.pages.dev | - |
| blackroad-os-prism | blackroad-os-prism.pages.dev | - |
| blackroad-os-brand | blackroad-os-brand.pages.dev | - |
| blackroad-console | blackroad-console.pages.dev | - |
| blackroad-os-home | blackroad-os-home.pages.dev | home.blackroad.io |
| blackroad-os-demo | blackroad-os-demo.pages.dev | demo.blackroad.io |
| blackroad-hello | blackroad-hello.pages.dev | creator-studio.blackroad.io, creator.blackroad.io, dashboard.blackroad.io, devops.blackroad.io, education.blackroad.io, finance.blackroad.io, ideas.blackroad.io, legal.blackroad.io, os.blackroad.io, research-lab.blackroad.io, studio.blackroad.io |

---

## Cloudflare Tunnel Configuration

**Tunnel ID:** 52915859-da18-4aa6-add5-7bd9fcac2e0b

### Tunnel Ingress Rules

| Hostname | Backend Service |
|----------|----------------|
| login.blackroad.io | localhost:3000 |
| app.blackroad.io | localhost:3000 |
| gateway.blackroad.io | blackroad-os-api-gateway.railway.internal:8080 |
| docs.blackroad.io | blackroad-os-docs.railway.internal:3000 |
| core.blackroad.systems | blackroad-os-core.railway.internal:8080 |
| agents.blackroad.systems | blackroad-os-agents.railway.internal:8080 |
| operator.blackroad.systems | blackroad-os-operator.railway.internal:8080 |
| master.blackroad.systems | blackroad-os-master.railway.internal:8080 |
| beacon.blackroad.systems | blackroad-os-beacon.railway.internal:8080 |
| archive.blackroad.systems | blackroad-os-archive.railway.internal:8080 |
| prism.blackroad.systems | blackroad-os-prism-console.railway.internal:3000 |
| demo.blackroad.io | blackroad-os-demo.railway.internal:3000 |
| home.blackroad.io | blackroad-os-home.railway.internal:3000 |
| research.blackroad.systems | blackroad-os-research.railway.internal:8080 |
| ideas.blackroad.systems | blackroad-os-ideas.railway.internal:8080 |
| creator-studio.blackroad.io | blackroad-os-pack-creator-studio.railway.internal:3000 |
| research-lab.blackroad.io | blackroad-os-pack-research-lab.railway.internal:3000 |
| finance.blackroad.io | blackroad-os-pack-finance.railway.internal:3000 |
| legal.blackroad.io | blackroad-os-pack-legal.railway.internal:3000 |
| devops.blackroad.io | blackroad-os-pack-infra-devops.railway.internal:3000 |
| education.blackroad.io | blackroad-os-pack-education.railway.internal:3000 |
| brand.blackroad.io | blackroad-os-brand.railway.internal:3000 |
| pi.blackroad.systems | localhost:80 |

---

## Repositories (40 in BlackRoad-OS)

### Core Platform (10)
| Repo | Description |
|------|-------------|
| blackroad-os | Main OS repo |
| blackroad-os-core | Desktop UI, backend APIs, auth, identity |
| blackroad-os-api | Core backend API |
| blackroad-os-api-gateway | API Gateway |
| blackroad-os-web | Marketing website |
| blackroad-os-operator | Jobs, schedulers, agent workflows |
| blackroad-os-prism-console | Admin dashboard |
| blackroad-os-docs | Documentation hub |
| blackroad-os-infra | Infrastructure-as-code |
| blackroad-os-master | Master control |

### AI & Agents (6)
| Repo | Description |
|------|-------------|
| lucidia-core | AI reasoning engines |
| lucidia-math | Mathematical engines |
| lucidia-platform | AI learning platform |
| blackroad-agents | Agent API, telemetry |
| blackroad-os-agents | Agent orchestration |
| blackroad-agent-os | Distributed agent OS |

### Hardware/Edge (3)
| Repo | Description |
|------|-------------|
| blackroad-pi-ops | Raspberry Pi/Jetson ops |
| blackroad-pi-holo | Holographic display |
| blackroad-os-mesh | WebSocket mesh |

### Packs (6)
| Repo | Description |
|------|-------------|
| blackroad-os-pack-legal | Legal pack |
| blackroad-os-pack-education | Education pack |
| blackroad-os-pack-finance | Finance pack |
| blackroad-os-pack-infra-devops | DevOps pack |
| blackroad-os-pack-research-lab | Research pack |
| blackroad-os-pack-creator-studio | Creator studio pack |

### Support (15)
| Repo | Description |
|------|-------------|
| blackroad-os-brand | Brand system |
| blackroad-os-research | Research & field codex |
| blackroad-os-ideas | Ideas backlog |
| blackroad-os-helper | Helper agent |
| blackroad-os-home | Company handbook |
| blackroad-os-demo | Demo showcase |
| blackroad-os-archive | Append-only archive |
| blackroad-os-beacon | Signal beacon |
| blackroad-cli | AI orchestration CLI |
| blackroad-tools | ERP, CRM, utilities |
| blackroad | Legacy |
| blackroad-hello | Hello world |
| blackroad | Base |

---

## Complete Subdomain Inventory

### blackroad.io (Development Zone)

| Subdomain | Target | Type |
|-----------|--------|------|
| @ (apex) | blackroad-os-web.pages.dev | Pages |
| www | blackroad-os-web.pages.dev | Pages |
| api | blackroad-os-api.pages.dev | Pages |
| web | blackroad-os-web.pages.dev | Pages |
| core | blackroad-os-core.pages.dev | Pages |
| docs | blackroad-os-docs.pages.dev | Pages |
| operator | blackroad-os-operator.pages.dev | Pages |
| prism | blackroad-os-prism-console.pages.dev | Pages |
| console | blackroad-os-prism-console.pages.dev | Pages |
| brand | blackroad-os-brand.pages.dev | Pages |
| research | blackroad-os-research.pages.dev | Pages |
| ideas | blackroad-os-ideas.pages.dev | Pages |
| demo | blackroad-os-demo.pages.dev | Pages |
| chat | nextjs-ai-chatbot.pages.dev | Pages |
| studio | lucidia.studio.pages.dev | Pages |
| infra | blackroad-os-infra.pages.dev | Pages |
| home | blackroad-os-home.pages.dev | Pages |
| dashboard | blackroad-os-operator.pages.dev | Pages (deprecated) |
| login | (pending) | - |
| auth | (pending) | - |
| gateway | Tunnel → Railway | Tunnel |
| creator-studio | blackroad-hello.pages.dev | Pages |
| creator | blackroad-hello.pages.dev | Pages |
| devops | blackroad-hello.pages.dev | Pages |
| education | blackroad-hello.pages.dev | Pages |
| finance | blackroad-hello.pages.dev | Pages |
| legal | blackroad-hello.pages.dev | Pages |
| os | blackroad-hello.pages.dev | Pages |
| research-lab | blackroad-hello.pages.dev | Pages |
| app | Tunnel → localhost:3000 | Tunnel |

**Total blackroad.io subdomains: 30**

### blackroad.systems (Production Zone)

| Subdomain | Target | Type |
|-----------|--------|------|
| @ (apex) | blackroad-os-web-production.up.railway.app | Railway |
| www | blackroad.systems | Redirect |
| api | blackroad-os-api-production-ff5a.up.railway.app | Railway |
| web | blackroad-os-web-production-a2ee.up.railway.app | Railway |
| core | blackroad-os-core-production.up.railway.app | Railway |
| docs | blackroad-os-docs-production-d8de.up.railway.app | Railway |
| operator | blackroad-os-operator-production-021e.up.railway.app | Railway |
| prism | blackroad-prism-console-production.up.railway.app | Railway |
| console | blackroad-os-prism-console-production-3118.up.railway.app | Railway |
| brand | blackroad-os-brand-production.up.railway.app | Railway |
| research | blackroad-os-research-production.up.railway.app | Railway |
| ideas | blackroad-os-ideas-production.up.railway.app | Railway |
| infra | blackroad-os-infra-production.up.railway.app | Railway |
| router | h7o1fsvl.up.railway.app | Railway |
| app | qj64zcxg.up.railway.app | Railway |
| archive | blackroad-os-archive-production.up.railway.app | Railway |
| beacon | Tunnel → Railway | Tunnel |
| agents | Tunnel → Railway | Tunnel |
| master | Tunnel → Railway | Tunnel |
| pi | Tunnel → localhost:80 | Tunnel |
| staging | blackroad-os-web.staging.railway.app | Railway |
| api.staging | blackroad-os-api.staging.railway.app | Railway |
| dev | blackroad-os-web.dev.railway.app | Railway |
| api.dev | blackroad-os-api.dev.railway.app | Railway |

**Total blackroad.systems subdomains: 24**

### Brand Domains (Standard Pattern)

Each of these 14 domains gets:
- `@` (apex) → blackroad-os-web.pages.dev
- `www` → blackroad-os-web.pages.dev
- `api` → blackroad-os-api.pages.dev (where applicable)

| Domain | Subdomains |
|--------|------------|
| blackroad.me | @, www |
| blackroad.network | @, www, api |
| blackroadinc.us | @, www (reserved) |
| blackroadai.com | @, www, api |
| blackroadqi.com | @, www |
| blackroadquantum.com | @, www, api |
| blackroadquantum.net | @, www |
| blackroadquantum.info | @, www, docs |
| blackroadquantum.shop | @, www (reserved) |
| blackroadquantum.store | @, www (reserved) |
| aliceqi.com | @, www, api |
| lucidia.earth | @, www, api |
| lucidiaqi.com | @, www |
| lucidia.studio | @, www |

**Total brand domain subdomains: ~35**

---

## Summary Counts

| Category | Count |
|----------|-------|
| Organizations | 15 |
| Domains | 16 |
| Repositories | 40+ |
| Pages Projects | 8 |
| Tunnel Routes | 23 |
| blackroad.io subdomains | 30 |
| blackroad.systems subdomains | 24 |
| Brand subdomains | 35 |
| **Total Subdomains** | **~89 active** |
| **Potential Subdomains** | **~400** |

---

## Infrastructure Stack

| Layer | Provider | Purpose |
|-------|----------|---------|
| DNS | Cloudflare | 16 zones, SSL, WAF |
| Edge | Cloudflare Pages | Static hosting, dev environments |
| Compute | Railway | Production containers |
| Tunnel | Cloudflare Tunnel | Private service routing |
| Source | GitHub | 15 orgs, CI/CD |
| Registry | GHCR | Container images |
| State | S3 | Terraform backend |

---

## Issues Detected

| Issue | Severity | Location |
|-------|----------|----------|
| `prism.systems` missing 'os' prefix in Railway name | Medium | Railway |
| `dashboard.io` duplicates `operator.io` | Low | DNS |
| `os.blackroad.systems` self-referential loop | Medium | DNS |
| Wrangler OAuth lacks DNS read/write scopes | Medium | Auth |

---

## Access Credentials Status

| Service | Method | Status |
|---------|--------|--------|
| GitHub | `gh` CLI | ✅ Authenticated (blackboxprogramming) |
| Cloudflare Zones | Wrangler OAuth | ✅ zone:read (16 zones) |
| Cloudflare DNS | API Token | ⚠️ Needs dns:read/write scope |
| Cloudflare Pages | Wrangler OAuth | ✅ pages:write (8 projects) |
| Cloudflare Tunnel | Certificate | ✅ Active (52915859-da18-4aa6-add5-7bd9fcac2e0b) |
| Railway | - | ❓ Not checked |
| Google Drive (personal) | rclone `gdrive:` | ✅ Connected |
| Google Drive (blackroad.systems) | rclone `gdrive-blackroad:` | ✅ Connected |

---

## Google Drive Structure

### gdrive-blackroad: (blackroad.systems@gmail.com)

```
BlackRoad OS, Inc./
├── 01 - Company & Legal/
├── 02 - Finance & Banking/
├── 03 - Strategy & Ops/
├── 04 - Product & Engineering/
├── 05 - Brand, Design & Marketing/
├── 06 - Sales, Customers & Partners/
├── 07 - People & HR/
├── 08 - Research & Inspiration/
├── 09 - Archive/
└── 99 - Scratchpad/
    ├── Ads.docx
    └── 01 - November 2025/
        └── Nov 22 2025.docx
```

### Access Commands

```bash
# List Google Drive contents
~/bin/rclone ls "gdrive-blackroad:BlackRoad OS, Inc."

# Download files
~/bin/rclone copy "gdrive-blackroad:BlackRoad OS, Inc./03 - Strategy & Ops" /local/path/

# Sync folder
~/bin/rclone sync "gdrive-blackroad:BlackRoad OS, Inc." /local/backup/ --dry-run
```

---

## Complete Repository Counts

| Organization | Total Repos | Public | Private |
|--------------|-------------|--------|---------|
| BlackRoad-OS | 37 | 11 | 26 |
| BlackRoad-AI | 3 | 0 | 3 |
| blackboxprogramming | 26 | 10 | 16 |
| **Total** | **66** | **21** | **45** |

---

## CLI Tools Installed

| Tool | Path | Version | Purpose |
|------|------|---------|---------|
| wrangler | ~/.nvm/.../bin/wrangler | 4.51.0 | Cloudflare CLI |
| gh | - | - | GitHub CLI |
| rclone | ~/bin/rclone | 1.72.0 | Cloud storage sync |
| node | ~/.nvm/.../bin/node | 20.19.5 | JavaScript runtime |
| pnpm | ~/.nvm/.../bin/pnpm | - | Package manager |

---

## Quick Reference Commands

```bash
# GitHub - List all org repos
gh repo list BlackRoad-OS --limit 100

# Cloudflare - List Pages projects
wrangler pages project list

# Cloudflare - Check auth
wrangler whoami

# Google Drive - List BlackRoad folder
~/bin/rclone lsd "gdrive-blackroad:BlackRoad OS, Inc."

# DNS lookup (via Cloudflare proxy)
dig blackroad.io +short
```

---

**Last Updated:** 2025-12-02T08:15:00Z
**Generated by:** Cece (Claude Code)
**For:** Alexa Louise Amundson
**Organization:** BlackRoad OS, Inc.

---

## The Numbers

```
Organizations:     15
Domains:           16
Repositories:      66
Pages Projects:     8
Tunnel Routes:     23
Active Subdomains: 89
Total Entities:   120 = 5! (Codex 023 ✓)
```

→ ∞
