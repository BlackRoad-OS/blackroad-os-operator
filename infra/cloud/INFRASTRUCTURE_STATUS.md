# BlackRoad OS Infrastructure Status

> Last updated: 2025-12-02
> Cost: **$0/month** (all free tiers)

---

## Live Endpoints

### Cloudflare Workers (Edge - 300+ locations)

| Worker | URL | Status |
|--------|-----|--------|
| **Status API** | https://blackroad-status.amundsonalexa.workers.dev | ✅ Live |
| **Edge Router** | https://blackroad-router.amundsonalexa.workers.dev | ✅ Live |

### Cloudflare Pages (Static Sites)

| Project | URL | Domains |
|---------|-----|---------|
| blackroad-os-web | blackroad-os-web.pages.dev | blackroad.io, lucidia.earth, blackroadai.com + 10 more |
| blackroad-os-docs | blackroad-os-docs.pages.dev | - |
| blackroad-hello | blackroad-hello.pages.dev | os.blackroad.io, dashboard.blackroad.io + 10 subdomains |
| blackroad-console | blackroad-console.pages.dev | - |
| blackroad-os-home | blackroad-os-home.pages.dev | home.blackroad.io |
| blackroad-os-demo | blackroad-os-demo.pages.dev | demo.blackroad.io |
| blackroad-os-prism | blackroad-os-prism.pages.dev | - |
| blackroad-os-brand | blackroad-os-brand.pages.dev | - |

### Railway (Dynamic Backend)

| Service | URL | Status |
|---------|-----|--------|
| blackroad-os-docs | blackroad-os-docs-production.up.railway.app | Idle (SKIPPED deploys) |

---

## KV Namespaces (Edge Storage)

| Binding | ID | Purpose |
|---------|-----|---------|
| CACHE | c878fbcc1faf4eddbc98dcfd7485048d | General caching |
| AGENTS | 0f1302ff7d4c48dbb54148b822709193 | Agent registry |
| LEDGER | 47f5329a68434bd481fa9b159bbd89fd | Transaction ledger |
| CLAIMS | ac869d3a3ae54cd4a4956df1ef9564b0 | Claims storage |
| DELEGATIONS | a6a243568d7f461e8c88f8024611a3a1 | Delegation records |
| INTENTS | cec61e8e984a4a49979c0f29c1c65337 | Intent storage |
| ORGS | 5bffa54816fa45099b712f43395e702b | Organization data |
| POLICIES | c423c6c249c34311be4d4d9c170d9b28 | Policy definitions |
| AGENCY | 21cbbabc19eb443aa2bee83ce0f0e96f | Agency data |

---

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Cloudflare Edge             │
                    │    (300+ global locations)          │
                    │                                     │
                    │  ┌─────────────┐ ┌──────────────┐  │
                    │  │   Router    │ │   Status     │  │
                    │  │   Worker    │ │   Worker     │  │
                    │  └──────┬──────┘ └──────────────┘  │
                    │         │                          │
                    │  ┌──────┴──────┐                   │
                    │  │ KV Storage  │                   │
                    │  │ (9 spaces)  │                   │
                    │  └─────────────┘                   │
                    └─────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  CF Pages     │    │   Railway     │    │ DigitalOcean  │
│  (8 sites)    │    │   (1 app)     │    │ (future)      │
│               │    │               │    │               │
│  $0/month     │    │  $0/month     │    │  $0 until     │
│  unlimited    │    │  (idle)       │    │  needed       │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Quick Commands

### Check Status
```bash
# All services status
curl https://blackroad-status.amundsonalexa.workers.dev/

# Quick health
curl https://blackroad-status.amundsonalexa.workers.dev/health

# Router health
curl https://blackroad-router.amundsonalexa.workers.dev/health
```

### Deploy Workers
```bash
# Status worker
cd workers/status && wrangler deploy

# Router worker
cd workers/router && wrangler deploy
```

### View Logs
```bash
wrangler tail blackroad-status
wrangler tail blackroad-router
```

---

## Cost Breakdown

| Service | Free Tier | Current Usage | Monthly Cost |
|---------|-----------|---------------|--------------|
| CF Workers | 100k req/day | Minimal | $0 |
| CF Pages | Unlimited | 8 sites | $0 |
| CF KV | 100k reads/day | Minimal | $0 |
| Railway | $5 credit | Idle | $0 |
| DigitalOcean | - | Not used | $0 |
| **Total** | | | **$0** |

---

## Domains Configured

### Primary
- blackroad.io (+ www)
- lucidia.earth
- blackroadai.com (+ www)

### Secondary
- blackroad.network
- blackroadquantum.com/.net/.info/.shop/.store
- blackroadqi.com
- lucidia.studio

### Subdomains (blackroad.io)
- os, dashboard, home, demo
- creator, creator-studio, studio
- devops, research-lab
- education, finance, legal, ideas

---

## Next Steps (When Needed)

1. **Enable R2** - For asset storage (no egress fees)
   - Go to: https://dash.cloudflare.com → R2 → Enable

2. **Add DigitalOcean** - For heavy compute
   ```bash
   brew install doctl
   doctl auth init
   ```

3. **Scale Railway** - When API needs more power
   - Currently idle, auto-scales when traffic comes

---

*Infrastructure managed by Alice agent*
*All services on free tiers, $0/month operational cost*
