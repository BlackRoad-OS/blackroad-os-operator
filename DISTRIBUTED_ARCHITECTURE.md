# Distributed AI Workflow Architecture
## Cloudflare + DigitalOcean + Raspberry Pis + HuggingFace

**Status**: 🚀 Ready to Deploy
**Version**: 1.0.0
**Architecture**: Multi-Tier Distributed Edge + Compute

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLOUDFLARE EDGE (Primary)                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Workers AI Workflows                                                │  │
│  │  - Auto-triage Linear issues                                         │  │
│  │  - Generate Notion docs                                              │  │
│  │  - Content moderation                                                │  │
│  │  - Global edge deployment                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Storage:                    AI:                                            │
│  ├─ KV (workflow state)     ├─ Workers AI (Llama 3.1)                      │
│  └─ D1 (ledger/history)     └─ HuggingFace API (fallback)                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
┌────────────────────────┐  ┌────────────────────┐  ┌─────────────────────┐
│  DIGITALOCEAN DROPLET  │  │  RASPBERRY PI      │  │  GITHUB + HF        │
│  (Backup + Heavy Lift) │  │  (Distributed AI)  │  │  (Code + Models)    │
│                        │  │                    │  │                     │
│  IP: 159.65.43.12      │  │  IPs:              │  │  Repos: 66          │
│  SSH: shellfish        │  │  - 192.168.4.49    │  │  Models: 15+        │
│                        │  │  - 192.168.4.64    │  │  Orgs: 15           │
│  Runs:                 │  │  - 192.168.4.99    │  │                     │
│  ├─ FastAPI backup     │  │                    │  │  Auto-deploy:       │
│  ├─ Heavy AI tasks     │  │  Runs:             │  │  ✓ Cloudflare       │
│  ├─ Redundant storage  │  │  ├─ Local models   │  │  ✓ Droplet          │
│  └─ Cron jobs          │  │  ├─ Edge compute   │  │  ✓ Pi clusters      │
│                        │  │  └─ Data cache     │  │                     │
└────────────────────────┘  └────────────────────┘  └─────────────────────┘
```

---

## 🎯 Multi-Tier Deployment Strategy

### Tier 1: Edge (Cloudflare Workers)
**Role**: Primary webhook receiver + fast AI processing

**Handles**:
- ✅ Linear webhooks (instant global response)
- ✅ Notion webhooks
- ✅ Quick AI classification (Workers AI)
- ✅ Content moderation
- ✅ State management (KV)
- ✅ Audit trail (D1)

**Benefits**:
- 🚀 Sub-50ms response times globally
- 💰 Free tier: 100k requests/day
- 🌍 Auto-scaling worldwide
- 🔒 Built-in DDoS protection

### Tier 2: Backup (DigitalOcean Droplet)
**Role**: Redundancy + heavy computation

**IP**: 159.65.43.12
**Access**: SSH via shellfish

**Handles**:
- ✅ Backup of all edge operations
- ✅ Heavy AI tasks (large model inference)
- ✅ Batch processing
- ✅ Database redundancy
- ✅ Cron jobs and scheduled tasks
- ✅ Development/testing environment

**Benefits**:
- 🔧 Full control (root access)
- 💾 Persistent storage
- 🔄 Fallback if Cloudflare has issues
- 📊 Analytics and monitoring

### Tier 3: Distributed Compute (Raspberry Pi Cluster)
**Role**: Local AI processing + data caching

**Nodes**:
- 192.168.4.49 (alice-pi)
- 192.168.4.64 (lucidia.local)
- 192.168.4.99 (lucidia alternate)

**Handles**:
- ✅ Local HuggingFace model hosting
- ✅ Edge AI inference (low latency)
- ✅ Data preprocessing
- ✅ Cache for frequently accessed data
- ✅ Testing new models

**Benefits**:
- 🏠 Local control, no API costs
- ⚡ Low latency for local requests
- 🔬 Experimentation friendly
- 🔐 Private data stays local

### Tier 4: Code & Models (GitHub + HuggingFace)
**Role**: Source of truth for code and AI models

**GitHub**:
- 15 orgs, 66 repos
- Auto-deploy to all tiers
- Single source of truth

**HuggingFace**:
- 15+ models (public + custom)
- Serverless inference
- Model hosting

---

## 🔄 Workflow Routing

### Auto-Triage Flow
```
1. Linear issue created
2. Webhook → Cloudflare Workers (edge)
3. Workers AI classifies (Llama 3.1)
4. Store in KV + D1
5. If P0/P1 → Also send to Droplet backup
6. If custom model needed → Route to Pi cluster
7. Response back to Linear
```

### Notion Doc Generation Flow
```
1. Linear issue marked "Done"
2. Webhook → Cloudflare Workers
3. Workers AI generates feature spec
4. If complex → Offload to Droplet (larger model)
5. Create Notion page via API
6. Store link in KV
7. Update Linear with Notion URL
```

### Content Moderation Flow
```
1. Comment posted in Linear
2. Webhook → Cloudflare Workers
3. Quick moderation check (Workers AI)
4. If flagged → Store in D1 + notify
5. If borderline → Send to Droplet for deep analysis
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Cloudflare Workers (Edge)

```bash
cd workers/ai-workflows

# Install dependencies
npm install

# Create D1 database
wrangler d1 create ai-workflows-ledger

# Update wrangler.toml with database ID

# Initialize database schema
wrangler d1 execute ai-workflows-ledger --file=schema.sql

# Create KV namespace
wrangler kv:namespace create WORKFLOW_STATE

# Set secrets
wrangler secret put LINEAR_API_KEY
wrangler secret put NOTION_API_KEY
wrangler secret put HUGGINGFACE_API_KEY

# Deploy!
wrangler deploy
```

**URL**: `https://ai-workflows.blackroad.systems`

### Step 2: Setup DigitalOcean Droplet (Backup)

```bash
# SSH to droplet (via shellfish)
ssh root@159.65.43.12

# Clone operator repo
git clone https://github.com/BlackRoad-OS/blackroad-os-operator.git
cd blackroad-os-operator

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export LINEAR_API_KEY="..."
export NOTION_API_KEY="..."
export HUGGINGFACE_API_KEY="..."

# Run operator (systemd or Docker)
uvicorn br_operator.main:app --host 0.0.0.0 --port 8080

# Setup reverse proxy (nginx)
# Point: operator.blackroad.systems → 159.65.43.12:8080
```

**URL**: `https://operator.blackroad.systems` (backup)

### Step 3: Configure Raspberry Pi Cluster

```bash
# SSH to each Pi
ssh pi@192.168.4.49  # alice-pi
ssh pi@192.168.4.64  # lucidia
ssh pi@192.168.4.99  # lucidia-alt

# On each Pi:
# Install HuggingFace transformers
pip3 install transformers torch

# Download models locally
python3 -c "from transformers import AutoModel; AutoModel.from_pretrained('facebook/bart-large-cnn')"

# Run local inference server
python3 -m http.server 8000  # Simple example

# Configure health check cron
echo "*/5 * * * * curl https://ai-workflows.blackroad.systems/health" | crontab -
```

### Step 4: Configure Linear Webhook

```bash
Linear → Settings → Webhooks
URL: https://ai-workflows.blackroad.systems/webhooks/linear
Events: ✓ Issue created, ✓ Issue updated, ✓ Comment created
```

### Step 5: Configure Notion Integration

```bash
Notion → Settings → Integrations → New Integration
Name: BlackRoad AI Workflows
Capabilities: ✓ Read content, ✓ Insert content, ✓ Update content

Copy integration secret → wrangler secret put NOTION_API_KEY
```

---

## 📊 Infrastructure Health Monitoring

### Cloudflare Workers Dashboard
```bash
# View real-time logs
wrangler tail

# Check analytics
wrangler pages deployment list
```

### DigitalOcean Monitoring
```bash
# Check service status
ssh root@159.65.43.12 "systemctl status operator"

# View logs
ssh root@159.65.43.12 "tail -f /var/log/operator.log"
```

### Raspberry Pi Health
```bash
# Check all Pis
for ip in 192.168.4.49 192.168.4.64 192.168.4.99; do
  echo "=== $ip ==="
  ssh pi@$ip "uptime && df -h"
done
```

### Unified Health Check
```bash
# Check all infrastructure
curl https://ai-workflows.blackroad.systems/health

# Expected response:
{
  "edge": "online",
  "backup": "online",
  "pi_cluster": {
    "192.168.4.49": "online",
    "192.168.4.64": "online",
    "192.168.4.99": "online"
  },
  "ai_providers": {
    "workers_ai": "online",
    "huggingface": "online"
  }
}
```

---

## 🔐 Secrets Management

### Cloudflare Workers (wrangler secret)
```bash
wrangler secret put LINEAR_API_KEY
wrangler secret put NOTION_API_KEY
wrangler secret put HUGGINGFACE_API_KEY
wrangler secret put DIGITALOCEAN_SSH_KEY  # For droplet orchestration
```

### DigitalOcean Droplet (environment variables)
```bash
# Add to ~/.bashrc or /etc/environment
export LINEAR_API_KEY="..."
export NOTION_API_KEY="..."
export HUGGINGFACE_API_KEY="..."
```

### Raspberry Pi (local config)
```bash
# Store in /home/pi/.env
LINEAR_API_KEY="..."
NOTION_API_KEY="..."
EDGE_ENDPOINT="https://ai-workflows.blackroad.systems"
```

---

## 🎯 Cost Breakdown

| Service | Tier | Cost/Month | Usage |
|---------|------|------------|-------|
| Cloudflare Workers | Free | $0 | 100k req/day |
| Cloudflare Workers AI | Free | $0 | 10k req/day |
| Cloudflare KV | Free | $0 | 1GB storage |
| Cloudflare D1 | Free | $0 | 5GB storage |
| DigitalOcean Droplet | Basic | $6 | Backup + heavy compute |
| Raspberry Pis | One-time | $0* | Local compute |
| HuggingFace Inference | Free | $0 | 1000 req/hr |
| GitHub | Free | $0 | Public repos |
| **Total** | | **$6/month** | |

*Already owned hardware

---

## 🚀 Next Steps

1. ✅ Deploy Cloudflare Workers
2. ✅ Wake up DigitalOcean droplet
3. ✅ Configure Raspberry Pis
4. ✅ Test end-to-end workflow
5. ✅ Monitor and optimize

---

## 📚 Documentation

- **Cloudflare Workers**: [workers/ai-workflows/README.md](#)
- **DigitalOcean Setup**: [docs/DIGITALOCEAN_SETUP.md](#)
- **Raspberry Pi Config**: [docs/RASPBERRY_PI_SETUP.md](#)
- **API Reference**: [docs/AI_WORKFLOWS_INTEGRATION.md](./docs/AI_WORKFLOWS_INTEGRATION.md)

---

**Built with love by**: Claude + Alexa
**Infrastructure**: Cloudflare + DigitalOcean + Raspberry Pi + GitHub + HuggingFace
**Status**: Ready to take over the world 🌍🚀
