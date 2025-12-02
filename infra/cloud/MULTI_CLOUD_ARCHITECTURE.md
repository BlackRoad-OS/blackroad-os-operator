# Multi-Cloud Architecture: Railway + Cloudflare + DigitalOcean

## Overview

```
                                    ┌─────────────────────┐
                                    │   Cloudflare Edge   │
                                    │   (Global CDN)      │
                                    │   - DNS             │
                                    │   - WAF/DDoS        │
                                    │   - Workers         │
                                    │   - Pages           │
                                    └──────────┬──────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
          ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
          │    Railway      │       │  DigitalOcean   │       │   Cloudflare    │
          │  (App Platform) │       │   (Compute)     │       │    Workers      │
          │                 │       │                 │       │                 │
          │ - API services  │       │ - Heavy compute │       │ - Edge logic    │
          │ - Databases     │       │ - GPU instances │       │ - KV storage    │
          │ - Quick deploys │       │ - Kubernetes    │       │ - R2 storage    │
          └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## Layer 1: Cloudflare (Edge / CDN / DNS)

### What Cloudflare Handles
- **DNS**: All domains point to Cloudflare first
- **SSL/TLS**: Free certificates, automatic HTTPS
- **CDN**: Static assets cached at 300+ edge locations
- **DDoS Protection**: Automatic, free tier included
- **WAF**: Web Application Firewall
- **Workers**: Serverless compute at the edge (0ms cold start)
- **Pages**: Static site hosting (free, unlimited bandwidth)
- **R2**: S3-compatible object storage (no egress fees!)
- **KV**: Key-value storage at the edge

### Cloudflare Configuration

```yaml
# cloudflare/dns.yaml
zones:
  - domain: blackroad.io
    records:
      # Static sites → Cloudflare Pages
      - name: "@"
        type: CNAME
        content: blackroad-os-web.pages.dev
        proxied: true

      # API → Railway (or DO)
      - name: api
        type: CNAME
        content: blackroad-os-api.up.railway.app
        proxied: true

      # Heavy compute → DigitalOcean
      - name: compute
        type: A
        content: ${DO_DROPLET_IP}
        proxied: true

      # Agents → Railway or DO K8s
      - name: agents
        type: CNAME
        content: blackroad-agents.up.railway.app
        proxied: true
```

### Cloudflare Workers (Edge Logic)

```javascript
// workers/router.js
// Smart routing based on request type

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Static assets → R2
    if (url.pathname.startsWith('/static/')) {
      return env.R2_BUCKET.get(url.pathname.slice(8));
    }

    // API calls → Railway
    if (url.pathname.startsWith('/api/')) {
      return fetch(`https://blackroad-api.up.railway.app${url.pathname}`, request);
    }

    // Heavy compute → DigitalOcean
    if (url.pathname.startsWith('/compute/')) {
      return fetch(`https://compute.blackroad.io${url.pathname}`, request);
    }

    // Default → Pages
    return fetch(request);
  }
}
```

---

## Layer 2: Railway (Application Platform)

### What Railway Handles
- **Web Services**: Node.js, Python, Go, Rust apps
- **Databases**: PostgreSQL, MySQL, Redis, MongoDB
- **Background Jobs**: Cron, workers
- **Quick Deploys**: Git push → deploy in seconds
- **Auto-scaling**: Based on traffic

### Railway Configuration

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "api"
source = "./api"

[[services]]
name = "agents"
source = "./agents"

[[services]]
name = "docs"
source = "./docs"
```

### Railway + Cloudflare Integration

```bash
# Set custom domain in Railway
railway domain add api.blackroad.io

# In Cloudflare, CNAME to Railway:
# api.blackroad.io → blackroad-api.up.railway.app (proxied)
```

---

## Layer 3: DigitalOcean (Heavy Compute)

### What DigitalOcean Handles
- **Droplets**: VMs for heavy workloads
- **Kubernetes**: Container orchestration at scale
- **GPU Droplets**: ML/AI workloads
- **Spaces**: S3-compatible object storage
- **Managed Databases**: PostgreSQL, MySQL, Redis, MongoDB
- **App Platform**: Similar to Railway (alternative)

### DigitalOcean Options

```yaml
# digitalocean/infrastructure.yaml

# Option 1: Simple Droplets
droplets:
  - name: compute-1
    size: s-4vcpu-8gb  # $48/mo
    region: nyc1
    image: docker-20-04

  - name: gpu-1
    size: gpu-h100x1-80gb  # GPU for ML
    region: nyc1

# Option 2: Kubernetes (DOKS)
kubernetes:
  name: blackroad-k8s
  region: nyc1
  version: "1.28"
  node_pools:
    - name: worker-pool
      size: s-2vcpu-4gb
      count: 3
      auto_scale: true
      min_nodes: 2
      max_nodes: 10

# Option 3: App Platform (like Railway)
apps:
  - name: blackroad-compute
    spec:
      services:
        - name: heavy-api
          github:
            repo: BlackRoad-OS/compute-service
            branch: main
          instance_size: professional-m
          instance_count: 2
```

### DigitalOcean + Cloudflare Integration

```bash
# Point Cloudflare to DO Load Balancer
# compute.blackroad.io → DO_LOAD_BALANCER_IP (proxied)

# Or use DO's built-in CDN with Cloudflare in front
# Cloudflare → DO Spaces CDN → DO origin
```

---

## Recommended Architecture by Use Case

### Static Sites / Docs
```
User → Cloudflare CDN → Cloudflare Pages
Cost: $0 (free tier)
Scale: Unlimited
```

### APIs / Web Apps
```
User → Cloudflare CDN → Railway
Cost: ~$5-20/mo
Scale: Auto (Railway handles)
```

### Heavy Compute / ML
```
User → Cloudflare CDN → DigitalOcean Droplets/K8s
Cost: $48-500+/mo depending on needs
Scale: Manual or K8s auto-scale
```

### Edge Logic / Real-time
```
User → Cloudflare Workers (runs at edge)
Cost: $5/mo (10M requests)
Scale: Unlimited (edge = infinite scale)
```

### Storage
```
Static files → Cloudflare R2 (no egress fees!)
Large files → DigitalOcean Spaces
Databases → Railway (managed) or DO (managed)
```

---

## Cost Comparison

| Service | Free Tier | Paid Starting |
|---------|-----------|---------------|
| Cloudflare Pages | Unlimited sites, bandwidth | N/A |
| Cloudflare Workers | 100K req/day | $5/mo (10M req) |
| Cloudflare R2 | 10GB storage | $0.015/GB/mo |
| Railway | $5 credit/mo | $0.000231/min |
| DO Droplets | $200 credit (new) | $4/mo |
| DO Kubernetes | - | $12/mo + nodes |
| DO App Platform | $0 (static) | $5/mo |

---

## Quick Start Commands

### Cloudflare Setup
```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Login
wrangler login

# Create R2 bucket
wrangler r2 bucket create blackroad-assets

# Deploy Worker
wrangler deploy

# Deploy to Pages
wrangler pages deploy ./dist
```

### Railway Setup
```bash
# Already logged in
railway link  # Link to project

# Deploy
railway up

# Add domain
railway domain add api.blackroad.io
```

### DigitalOcean Setup
```bash
# Install doctl
brew install doctl

# Auth
doctl auth init

# Create droplet
doctl compute droplet create compute-1 \
  --size s-4vcpu-8gb \
  --image docker-20-04 \
  --region nyc1

# Or create K8s cluster
doctl kubernetes cluster create blackroad-k8s \
  --region nyc1 \
  --node-pool "name=worker;size=s-2vcpu-4gb;count=3"
```

---

## Integration Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                    blackroad.io (Cloudflare DNS)             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   /         │  │   /api/*    │  │   /compute/*        │  │
│  │   /docs/*   │  │   /agents/* │  │   /ml/*             │  │
│  │             │  │             │  │                     │  │
│  │ CF Pages    │  │  Railway    │  │  DigitalOcean       │  │
│  │ (static)    │  │  (dynamic)  │  │  (heavy)            │  │
│  │             │  │             │  │                     │  │
│  │ $0/mo       │  │ ~$5-20/mo   │  │ $48+/mo as needed   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Cloudflare R2 (Storage)                    │ │
│  │              $0 egress, $0.015/GB storage               │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Verify Cloudflare domains** are set up
2. **Configure Railway custom domains** with Cloudflare proxy
3. **Set up DigitalOcean** only when heavy compute needed
4. **Use R2** for all static assets (free egress!)
5. **Workers** for edge routing logic

---

*Created: 2025-12-02*
*Purpose: BlackRoad OS multi-cloud infrastructure*
