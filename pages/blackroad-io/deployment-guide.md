# BlackRoad Priority Forks - Deployment Guide

**Status:** ✅ Ready for Deployment
**Date:** 2025-12-23
**Location:** `~/blackroad-priority-stack/`

---

## ✅ What's Been Completed

All four priority forks have been configured and validated:

1. **Headscale** - Mesh VPN control plane (Tailscale alternative)
2. **Keycloak** - Identity provider (Auth0 alternative)
3. **vLLM** - Local AI inference (OpenAI alternative)
4. **EspoCRM** - Customer relationship management (Salesforce alternative)

---

## 📦 Deployment Files Created

```
~/blackroad-priority-stack/
├── README.md                    # Complete documentation
├── test-configs.sh             # Validate configurations ✅
├── deploy-and-test.sh          # Deploy with health checks
├── deploy-all.sh               # Interactive deployment
│
├── headscale/
│   ├── docker-compose.yml      # ✅ Valid
│   ├── config/config.yaml      # ✅ Configured
│   └── manage.sh               # Management commands
│
├── keycloak/
│   ├── docker-compose.yml      # ✅ Valid
│   └── .env                    # ✅ Credentials set
│
├── vllm/
│   ├── docker-compose.yml      # ✅ Valid (GPU + CPU)
│   └── .env                    # ✅ API key set
│
└── espocrm/
    ├── docker-compose.yml      # ✅ Valid
    └── .env                    # ✅ Credentials set
```

---

## 🚀 Deployment Options

### Option 1: Test Configurations Only (DONE ✅)

```bash
cd ~/blackroad-priority-stack
./test-configs.sh
```

**Result:** All configurations valid, all ports available (except 11434 - Ollama already running)

### Option 2: Deploy All Services (RECOMMENDED)

```bash
cd ~/blackroad-priority-stack
./deploy-and-test.sh
```

This will:
- Ask which services to deploy
- Deploy each service with Docker Compose
- Wait for services to start
- Test health endpoints
- Show access URLs

### Option 3: Deploy Individual Services

```bash
# Headscale
cd ~/blackroad-priority-stack/headscale
docker compose up -d
./manage.sh status

# Keycloak
cd ~/blackroad-priority-stack/keycloak
docker compose up -d

# vLLM (GPU - on Jetson)
cd ~/blackroad-priority-stack/vllm
docker compose up -d vllm-qwen

# vLLM (CPU - on Pi)
cd ~/blackroad-priority-stack/vllm
docker compose --profile cpu-fallback up -d vllm-phi

# EspoCRM
cd ~/blackroad-priority-stack/espocrm
docker compose up -d
```

---

## 🎯 Recommended Deployment Strategy

### Phase 1: Local Testing (Mac - TODAY)

Deploy lightweight services for testing:

```bash
cd ~/blackroad-priority-stack

# Deploy Headscale (lightweight)
cd headscale && docker compose up -d && cd ..

# Deploy Keycloak (needs 2GB RAM)
cd keycloak && docker compose up -d && cd ..

# Deploy EspoCRM (moderate)
cd espocrm && docker compose up -d && cd ..

# Skip vLLM on Mac (no GPU, requires heavy CPU)
```

**Access:**
- Headscale UI: http://localhost:8081
- Keycloak Admin: http://localhost:8082
- EspoCRM: http://localhost:8085

### Phase 2: GPU Deployment (Jetson - TODAY)

Deploy vLLM to Jetson Orin Nano:

```bash
# Copy deployment files to Jetson
scp -r ~/blackroad-priority-stack/vllm jetson@192.168.4.XX:~/

# SSH to Jetson
ssh jetson@192.168.4.XX

# Deploy vLLM with GPU
cd ~/vllm
docker compose up -d vllm-qwen

# Monitor logs
docker logs -f blackroad-vllm-qwen
```

**First run downloads Qwen2.5-7B (~4GB) - takes 5-10 minutes**

### Phase 3: Production Deployment (Pi 5s - THIS WEEK)

Deploy production services to Pi 5 cluster:

```bash
# Copy to Pi 5 Alpha (main services)
scp -r ~/blackroad-priority-stack pi@192.168.4.64:~/

# SSH and deploy
ssh pi@192.168.4.64
cd ~/blackroad-priority-stack
./deploy-and-test.sh
```

---

## 🔐 Security Checklist

Before production deployment:

### Change All Passwords

```bash
cd ~/blackroad-priority-stack

# Keycloak
vim keycloak/.env
# Update: KEYCLOAK_DB_PASSWORD, KEYCLOAK_ADMIN_PASSWORD

# vLLM
vim vllm/.env
# Update: VLLM_API_KEY

# EspoCRM
vim espocrm/.env
# Update: MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, ESPOCRM_ADMIN_PASSWORD
```

### Enable Production Mode

1. **Headscale:** Update `server_url` in `config/config.yaml` to `https://mesh.blackroad.io`
2. **Keycloak:** Set `KC_HOSTNAME_STRICT=true` and `KC_HOSTNAME_STRICT_HTTPS=true`
3. **vLLM:** Enable HTTPS proxy
4. **EspoCRM:** Update `ESPOCRM_SITE_URL` to `https://crm.blackroad.io`

---

## 🌐 Cloudflare Tunnel Configuration

### Create Tunnel

```bash
cloudflared tunnel create blackroad-priority-stack
```

### Configure Routes

```bash
# Headscale
cloudflared tunnel route dns blackroad-priority-stack mesh.blackroad.io

# Keycloak
cloudflared tunnel route dns blackroad-priority-stack identity.blackroad.io

# vLLM
cloudflared tunnel route dns blackroad-priority-stack ai.blackroad.io

# EspoCRM
cloudflared tunnel route dns blackroad-priority-stack crm.blackroad.io
```

### Tunnel Config

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: mesh.blackroad.io
    service: http://localhost:8080

  - hostname: identity.blackroad.io
    service: http://localhost:8082

  - hostname: ai.blackroad.io
    service: http://localhost:8083

  - hostname: crm.blackroad.io
    service: http://localhost:8085

  - service: http_status:404
```

### Run Tunnel

```bash
cloudflared tunnel run blackroad-priority-stack
```

---

## 📊 Service Details

### Headscale (Mesh VPN)

| Item | Value |
|------|-------|
| **Ports** | 8080 (API), 8081 (UI), 9090 (metrics), 50443 (gRPC) |
| **RAM** | 512 MB |
| **Storage** | 1 GB |
| **License** | MIT |
| **Docs** | https://headscale.net/ |

**First Steps:**
```bash
cd ~/blackroad-priority-stack/headscale
./manage.sh namespace create blackroad
./manage.sh preauth blackroad
# Use preauth key to connect Tailscale clients
```

### Keycloak (Identity)

| Item | Value |
|------|-------|
| **Ports** | 8082 (HTTP), 8443 (HTTPS) |
| **RAM** | 2 GB |
| **Storage** | 5 GB |
| **Database** | PostgreSQL |
| **License** | Apache 2.0 |
| **Docs** | https://www.keycloak.org/ |

**First Steps:**
1. Access http://localhost:8082
2. Login as `admin` (password in `.env`)
3. Create realm: `blackroad-production`
4. Add users
5. Create clients for each service

### vLLM (AI Inference)

| Item | Value |
|------|-------|
| **Ports** | 8083 (GPU), 8084 (CPU) |
| **RAM** | 8 GB (GPU), 4 GB (CPU) |
| **Storage** | 20 GB (models) |
| **GPU** | NVIDIA 8GB VRAM (Jetson Orin Nano) |
| **License** | Apache 2.0 |
| **Docs** | https://docs.vllm.ai/ |

**Models:**
- GPU: Qwen/Qwen2.5-7B-Instruct (7B params, 4096 context)
- CPU: microsoft/phi-2 (2.7B params, 2048 context)

**Test API:**
```bash
curl -X POST http://localhost:8083/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer blackroad-vllm-secure-key-2025" \
  -d '{
    "model": "qwen2.5:7b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### EspoCRM (CRM)

| Item | Value |
|------|-------|
| **Ports** | 8085 (App), 8086 (phpMyAdmin) |
| **RAM** | 2 GB |
| **Storage** | 10 GB |
| **Database** | MySQL |
| **License** | GPLv3 |
| **Docs** | https://docs.espocrm.com/ |

**First Steps:**
1. Access http://localhost:8085
2. Login as `admin` (password in `.env`)
3. Complete setup wizard
4. Configure SMTP in `.env`
5. Import contacts

---

## 🧪 Testing & Verification

### Check All Services Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep blackroad
```

### Test Endpoints

```bash
# Headscale
curl http://localhost:8080/metrics
curl http://localhost:8081

# Keycloak
curl http://localhost:8082/health

# vLLM
curl http://localhost:8083/health

# EspoCRM
curl -I http://localhost:8085
```

### View Logs

```bash
docker logs -f blackroad-headscale
docker logs -f blackroad-keycloak
docker logs -f blackroad-vllm-qwen
docker logs -f blackroad-espocrm
```

---

## 💰 Cost Analysis

### Traditional Cloud Stack

| Service | Provider | Annual Cost |
|---------|----------|-------------|
| Mesh VPN | Tailscale | $720 (10 users @ $6/mo) |
| Identity | Auth0 | $276 ($23/mo) |
| AI Inference | OpenAI | $1,200-7,200 (varies) |
| CRM | Salesforce | $3,000 (10 users @ $25/mo) |
| **Total** | | **$5,196-11,196** |

### BlackRoad Sovereign Stack

| Item | One-Time | Annual |
|------|----------|--------|
| Hardware (Jetson) | $500 | - |
| Electricity | - | $180 |
| Domains (4 @ $12/yr) | - | $48 |
| Backup Droplet | - | $72 |
| **Total Year 1** | **$500** | **$300** |
| **Total Year 2+** | **$0** | **$300** |

**Savings:** $4,896-10,896/year (94-97% reduction)

---

## 🔧 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker logs blackroad-<service-name>

# Check port conflicts
lsof -i :<port-number>

# Restart service
cd ~/blackroad-priority-stack/<service-name>
docker compose restart
```

### Database Connection Errors

```bash
# Check database is running
docker ps | grep postgres  # Keycloak
docker ps | grep mysql     # EspoCRM

# Wait longer - databases take 10-30 seconds to initialize
```

### vLLM Model Download Slow

First run downloads ~4GB model. Be patient or:

```bash
# Pre-download model
docker exec -it blackroad-vllm-qwen bash
huggingface-cli download Qwen/Qwen2.5-7B-Instruct
```

---

## 📚 Next Steps

### Immediate (Today)

- [ ] Run `./test-configs.sh` to verify ✅ DONE
- [ ] Deploy services locally with `./deploy-and-test.sh`
- [ ] Access each service and complete setup wizards
- [ ] Change default passwords

### This Week

- [ ] Deploy vLLM to Jetson
- [ ] Deploy production stack to Pi 5 cluster
- [ ] Configure Cloudflare Tunnels
- [ ] Set up Keycloak realms and clients
- [ ] Create Headscale namespaces and connect devices

### Next Week

- [ ] Integrate Keycloak with Headscale (OIDC)
- [ ] Secure vLLM API with Keycloak
- [ ] Configure EspoCRM SSO with Keycloak
- [ ] Set up automated backups
- [ ] Deploy monitoring (Prometheus + Grafana)

---

## 📖 Documentation

- **Main Guide:** `~/blackroad-priority-stack/README.md`
- **Forkies Stack:** `~/Desktop/BLACKROAD_FORKIES_CANONICAL_STACK.md`
- **This Guide:** `~/Desktop/BLACKROAD_PRIORITY_FORKS_DEPLOYMENT_GUIDE.md`

---

## ✅ Validation Checklist

Before marking as production-ready:

- [x] All Docker Compose files validated
- [x] All .env files created with passwords
- [x] All ports available (except 11434 - Ollama)
- [x] Test scripts created
- [x] Management scripts created
- [x] Documentation complete
- [ ] Services deployed and running
- [ ] Health endpoints responding
- [ ] Cloudflare Tunnels configured
- [ ] Production passwords set
- [ ] Backup automation configured

---

**You are now ready to deploy the BlackRoad Priority Stack!**

Run `./deploy-and-test.sh` when ready.

---

*Generated: 2025-12-23*
*BlackRoad OS Priority Forks v1.0*
