# BlackRoad OS - Cloudflare Infrastructure

**Generated:** 2025-12-02
**Account:** amundsonalexa@gmail.com
**Account ID:** 848cf0b18d51e0170e0d1537aec3505a

---

## Summary

| Resource | Count | Status |
|----------|-------|--------|
| Pages Projects | 8 | ✅ Active |
| KV Namespaces | 8 | ✅ Active |
| Tunnel | 1 | ✅ Configured |
| D1 Databases | 1 | ✅ Active |
| R2 Buckets | 0 | ⏳ Pending |

---

## Pages Projects (8)

| Project | Custom Domains | Git Connected | Last Deploy |
|---------|----------------|---------------|-------------|
| blackroad-os-web | blackroad.io + 12 more | Yes | 1 day ago |
| blackroad-os-docs | - | Yes | 7 hours ago |
| blackroad-os-prism | - | Yes | 1 day ago |
| blackroad-os-brand | - | Yes | 1 day ago |
| blackroad-console | - | No | 1 day ago |
| blackroad-os-home | home.blackroad.io | No | 2 days ago |
| blackroad-os-demo | demo.blackroad.io | No | 2 days ago |
| blackroad-hello | 11 subdomains | No | 2 days ago |

### blackroad-os-web Custom Domains
- blackroad.io
- www.blackroad.io
- blackroad.network
- blackroadai.com
- www.blackroadai.com
- blackroadqi.com
- blackroadquantum.com
- blackroadquantum.net
- blackroadquantum.info
- blackroadquantum.shop
- blackroadquantum.store
- lucidia.earth
- lucidia.studio

### blackroad-hello Custom Domains (Pack Subdomains)
- creator-studio.blackroad.io
- creator.blackroad.io
- dashboard.blackroad.io
- devops.blackroad.io
- education.blackroad.io
- finance.blackroad.io
- ideas.blackroad.io
- legal.blackroad.io
- os.blackroad.io
- research-lab.blackroad.io
- studio.blackroad.io

---

## KV Namespaces (8)

### blackroad-api Namespaces
| Name | ID | Purpose |
|------|-----|---------|
| blackroad-api-CLAIMS | ac869d3a3ae54cd4a4956df1ef9564b0 | Auth sessions/claims |
| blackroad-api-DELEGATIONS | a6a243568d7f461e8c88f8024611a3a1 | Permission delegations |
| blackroad-api-INTENTS | cec61e8e984a4a49979c0f29c1c65337 | User intents |
| blackroad-api-ORGS | 5bffa54816fa45099b712f43395e702b | Organization data |
| blackroad-api-POLICIES | c423c6c249c34311be4d4d9c170d9b28 | Access policies |

### blackroad-router Namespaces
| Name | ID | Purpose |
|------|-----|---------|
| blackroad-router-AGENCY | 21cbbabc19eb443aa2bee83ce0f0e96f | Agent agency data |
| blackroad-router-AGENTS | 0f1302ff7d4c48dbb54148b822709193 | Agent registry |
| blackroad-router-LEDGER | 47f5329a68434bd481fa9b159bbd89fd | Transaction ledger |

---

## Cloudflare Tunnel

**Tunnel ID:** `52915859-da18-4aa6-add5-7bd9fcac2e0b`
**Config:** `~/.cloudflared/config.yml`

### Ingress Routes (23 routes)

#### blackroad.io Routes
| Hostname | Backend |
|----------|---------|
| login.blackroad.io | localhost:3000 |
| app.blackroad.io | localhost:3000 |
| gateway.blackroad.io | blackroad-os-api-gateway.railway.internal:8080 |
| docs.blackroad.io | blackroad-os-docs.railway.internal:3000 |
| demo.blackroad.io | blackroad-os-demo.railway.internal:3000 |
| home.blackroad.io | blackroad-os-home.railway.internal:3000 |
| brand.blackroad.io | blackroad-os-brand.railway.internal:3000 |

#### Pack Routes (blackroad.io)
| Hostname | Backend |
|----------|---------|
| creator-studio.blackroad.io | blackroad-os-pack-creator-studio.railway.internal:3000 |
| research-lab.blackroad.io | blackroad-os-pack-research-lab.railway.internal:3000 |
| finance.blackroad.io | blackroad-os-pack-finance.railway.internal:3000 |
| legal.blackroad.io | blackroad-os-pack-legal.railway.internal:3000 |
| devops.blackroad.io | blackroad-os-pack-infra-devops.railway.internal:3000 |
| education.blackroad.io | blackroad-os-pack-education.railway.internal:3000 |

#### blackroad.systems Routes
| Hostname | Backend |
|----------|---------|
| core.blackroad.systems | blackroad-os-core.railway.internal:8080 |
| agents.blackroad.systems | blackroad-os-agents.railway.internal:8080 |
| operator.blackroad.systems | blackroad-os-operator.railway.internal:8080 |
| master.blackroad.systems | blackroad-os-master.railway.internal:8080 |
| beacon.blackroad.systems | blackroad-os-beacon.railway.internal:8080 |
| archive.blackroad.systems | blackroad-os-archive.railway.internal:8080 |
| prism.blackroad.systems | blackroad-os-prism-console.railway.internal:3000 |
| research.blackroad.systems | blackroad-os-research.railway.internal:8080 |
| ideas.blackroad.systems | blackroad-os-ideas.railway.internal:8080 |

#### Local Routes
| Hostname | Backend |
|----------|---------|
| pi.blackroad.systems | localhost:80 |

---

## Domains (16 Zones)

| Domain | Purpose | Status |
|--------|---------|--------|
| blackroad.io | Development | Active |
| blackroad.systems | Production | Active |
| blackroad.me | Personal | Active |
| blackroad.network | Infrastructure | Active |
| blackroadinc.us | Corporate | Reserved |
| blackroadai.com | AI Brand | Active |
| blackroadqi.com | QI Brand | Active |
| blackroadquantum.com | Quantum Main | Active |
| blackroadquantum.net | Quantum Alt | Active |
| blackroadquantum.info | Quantum Docs | Active |
| blackroadquantum.shop | Commerce | Reserved |
| blackroadquantum.store | Commerce | Reserved |
| aliceqi.com | Alice QI | Active |
| lucidia.earth | Lucidia Main | Active |
| lucidiaqi.com | Lucidia QI | Active |
| lucidia.studio | Creative | Active |

---

## Wrangler Permissions

```
- account (read)
- user (read)
- workers (write)
- workers_kv (write)
- workers_routes (write)
- workers_scripts (write)
- workers_tail (read)
- d1 (write)
- pages (write)
- zone (read)
- ssl_certs (write)
- ai (write)
- queues (write)
- pipelines (write)
- secrets_store (write)
- containers (write)
- cloudchamber (write)
- connectivity (admin)
```

---

## D1 Database

**Name:** `blackroad-os-main`
**ID:** `e2c6dcd9-c21a-48ac-8807-7b3a6881c4f7`
**Region:** ENAM
**Created:** 2025-12-02

### Tables
| Table | Purpose |
|-------|---------|
| users | User accounts |
| organizations | Orgs/workspaces |
| org_members | Org membership |
| projects | Projects within orgs |
| agents | AI agents |
| agent_runs | Agent execution logs |
| api_keys | API key management |
| audit_log | Activity audit trail |

### Binding Config
```json
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "blackroad-os-main",
    "database_id": "e2c6dcd9-c21a-48ac-8807-7b3a6881c4f7"
  }]
}
```

---

## Endpoint Status (2025-12-02)

### Main Domains
| Domain | Status |
|--------|--------|
| blackroad.io | ✅ 200 |
| blackroad.systems | ⚠️ 522 (Railway down) |
| blackroadai.com | ✅ 200 |
| blackroadquantum.com | ✅ 200 |
| lucidia.earth | ✅ 200 |

### blackroad.io Subdomains
| Subdomain | Status |
|-----------|--------|
| home.blackroad.io | ✅ 200 |
| demo.blackroad.io | ✅ 200 |
| docs.blackroad.io | ✅ 200 |
| api.blackroad.io | ✅ 200 |

---

## Quick Commands

```bash
# Pages
wrangler pages project list
wrangler pages deploy ./dist --project-name=blackroad-os-web

# KV
wrangler kv namespace list
wrangler kv key list --namespace-id=<id>

# Tunnel
cloudflared tunnel run 52915859-da18-4aa6-add5-7bd9fcac2e0b

# Workers
wrangler deploy  # from worker directory
wrangler tail <worker-name>
```

---

## Architecture Notes

### Traffic Flow
1. **Static Sites** → Cloudflare Pages (*.pages.dev)
2. **API** → Cloudflare Workers
3. **Railway Services** → Cloudflare Tunnel → Railway Private Network
4. **Local Dev** → Tunnel → localhost

### DNS Strategy
- **blackroad.io** = Development (Pages)
- **blackroad.systems** = Production (Railway via Tunnel)

---

*Last updated: 2025-12-02 by Cece (Claude Code)*
