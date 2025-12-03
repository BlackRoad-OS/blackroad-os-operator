# iOS Shortcut: Deploy BlackRoad

Deploy your entire fleet with one tap on your iPhone.

## Quick Setup (2 minutes)

### 1. Open iOS Shortcuts App

### 2. Create New Shortcut

Tap **+** → Name it: **🚀 Deploy BlackRoad**

### 3. Add Action: "Get Contents of URL"

Configure:
- **URL**: `https://blackroad-cece-operator-production.up.railway.app/v1/intent/deploy`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
  - (Optional) `Authorization`: `Bearer YOUR_TOKEN`
- **Request Body**: `JSON`

```json
{
  "target": "all",
  "env": "prod",
  "reason": "Deploy from iPhone"
}
```

### 4. Add Action: "Show Result"

This displays the deployment status when it completes.

### 5. Add to Home Screen

Long-press the shortcut → **Add to Home Screen**

---

## Target Options

You can create multiple shortcuts for different deploy targets:

| Target | What it deploys |
|--------|-----------------|
| `all` | Everything: web, API, workers, Pi mesh |
| `web` | Web frontends (Pages) |
| `api` | API/Operator (Railway) |
| `workers` | Cloudflare Workers |
| `operator` | Just the operator service |
| `pi-mesh` | Raspberry Pi agents |

### Example: Workers-Only Shortcut

```json
{
  "target": "workers",
  "env": "prod",
  "reason": "Deploy workers from iPhone"
}
```

---

## Status Emojis

The response includes a summary with these status indicators:

| Emoji | Meaning |
|-------|---------|
| ✅ | Healthy / Success |
| ⚠️ | Degraded / Warning |
| ❌ | Failed / Down |
| 🪧 | Unknown / Agent offline |

Example response:
```
mac-main: ✅ | railway-agent: ✅ | pi-1: ✅ | pi-2: 🪧 | pi-3: ✅
```

---

## Advanced: Multiple Shortcuts

Create these shortcuts for a complete mobile control center:

### 🚀 Deploy All
```json
{"target": "all", "env": "prod", "reason": "Full deploy from iPhone"}
```

### 🌐 Deploy Web
```json
{"target": "web", "env": "prod", "reason": "Web deploy from iPhone"}
```

### ⚙️ Deploy Workers
```json
{"target": "workers", "env": "prod", "reason": "Workers deploy from iPhone"}
```

### 🔍 Fleet Status
- **URL**: `https://blackroad-cece-operator-production.up.railway.app/v1/fleet/status`
- **Method**: `GET`

### 🩺 Health Check
- **URL**: `https://blackroad-cece-operator-production.up.railway.app/health`
- **Method**: `GET`

---

## Testing with curl

Before setting up the shortcut, test from your Mac:

```bash
# Deploy all
curl -X POST https://blackroad-cece-operator-production.up.railway.app/v1/intent/deploy \
  -H "Content-Type: application/json" \
  -d '{"target": "all", "env": "prod", "reason": "Test from CLI"}'

# Check fleet status
curl https://blackroad-cece-operator-production.up.railway.app/v1/fleet/status

# List connected agents
curl https://blackroad-cece-operator-production.up.railway.app/v1/agents
```

---

## Running br-agent on Your Mac

For the Mac to actually execute commands, run br-agent:

```bash
# Install dependencies
pip3 install aiohttp pyyaml

# Run the agent
python3 ~/blackroad-os-operator/scripts/br-agent.py

# Or run in background
nohup python3 ~/blackroad-os-operator/scripts/br-agent.py &
```

The agent config is at `~/blackroad-agent/config.yaml`.

---

## Troubleshooting

### "Agent not connected" (🪧)

The br-agent isn't running on that machine. Start it:
```bash
python3 ~/blackroad-os-operator/scripts/br-agent.py
```

### "Operator unreachable"

Check Railway is up:
```bash
curl https://blackroad-cece-operator-production.up.railway.app/health
```

### Test action locally

```bash
python3 ~/blackroad-os-operator/scripts/br-agent.py --test-action health_check
```

---

## Architecture

```
┌─────────────┐     POST /v1/intent/deploy     ┌──────────────────┐
│   iPhone    │ ──────────────────────────────▶│    Operator      │
│  Shortcut   │                                │    (Railway)     │
└─────────────┘                                └────────┬─────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────────────────┐
                    │                                   │                                   │
                    ▼                                   ▼                                   ▼
            ┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
            │  br-agent     │                   │  br-agent     │                   │  br-agent     │
            │  (MacBook)    │                   │  (Pi 1)       │                   │  (Pi 2)       │
            └───────────────┘                   └───────────────┘                   └───────────────┘
                    │                                   │                                   │
                    ▼                                   ▼                                   ▼
            ┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
            │ wrangler      │                   │ systemctl     │                   │ systemctl     │
            │ deploy        │                   │ restart       │                   │ restart       │
            └───────────────┘                   └───────────────┘                   └───────────────┘
```

Your iPhone is just the remote. The Operator is the brain. The agents are the muscles.
