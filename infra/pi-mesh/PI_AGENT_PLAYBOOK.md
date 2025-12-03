# BlackRoad Pi Mesh Agent Playbook

> Rock-solid WebSocket agents on Raspberry Pi (Debian 12 "Bookworm")

Cloudflare Tunnel + systemd watchdogs + app-level heartbeats + TCP keepalives.

---

## Why This Matters

WebSockets on flaky networks drop. Pi nodes in the BlackRoad mesh need:
- Stable outbound path (Cloudflare Tunnel)
- Auto-healing services (systemd)
- App that knows it's alive (heartbeats/keepalives/backoff)

---

## 1. Outbound Tunnel with Cloudflared

Outbound only (no port-forwarding), neat DNS, auto-reconnect.

```bash
# Install
curl -fsSL https://pkg.cloudflare.com/install.sh | sudo bash
sudo apt-get install -y cloudflared

# Login + create named tunnel
cloudflared tunnel login
cloudflared tunnel create blackroad-pi

# Route a hostname
cloudflared tunnel route dns blackroad-pi pi1.blackroad.systems

# Config file
sudo mkdir -p /etc/cloudflared
sudo tee /etc/cloudflared/config.yml >/dev/null <<'YML'
tunnel: blackroad-pi
credentials-file: /etc/cloudflared/blackroad-pi.json
ingress:
  - hostname: pi1.blackroad.systems
    service: http://localhost:3000
  - service: http_status:404
YML

# Install as systemd service
sudo cloudflared --config /etc/cloudflared/config.yml service install
sudo systemctl enable --now cloudflared
```

---

## 2. Agent systemd Unit

Watchdog pings + restart policies keep things up even if the process wedges.

```ini
# /etc/systemd/system/blackroad-agent.service
[Unit]
Description=BlackRoad Pi Agent
After=network-online.target cloudflared.service
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/blackroad-agent --operator-ws wss://api.blackroad.io/ws/agent
WorkingDirectory=/var/lib/blackroad-agent
User=blackroad
Group=blackroad

# Auto-restart on crashes/hangs
Restart=always
RestartSec=3s
StartLimitIntervalSec=60
StartLimitBurst=10

# Watchdog (systemd kills/restarts if no ping in time)
WatchdogSec=20s
TimeoutStartSec=30s
TimeoutStopSec=10s

# Resource controls (cgroups v2)
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
RestrictSUIDSGID=true
CapabilityBoundingSet=
LockPersonality=true
MemoryMax=300M
CPUQuota=80%
IOWeight=200

# Environment
Environment=NODE_ENV=production
Environment=WS_HEARTBEAT_MS=5000
Environment=WS_BACKOFF_BASE_MS=500
Environment=WS_BACKOFF_MAX_MS=30000
Environment=BLACKROAD_AGENT_DID=did:key:z6Mk...

# Hardening extras
AmbientCapabilities=
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
SystemCallFilter=@system-service

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now blackroad-agent
systemctl status blackroad-agent
```

---

## 3. App-Level Heartbeats + Exponential Backoff

Send heartbeat over WebSocket (every 5s) and reconnect with jittered exponential backoff.

```typescript
// blackroad-agent.ts
const OPERATOR_URL = 'wss://api.blackroad.io/ws/agent';
let backoff = 500; // ms
const maxBackoff = 30000;

function connect() {
  const ws = new WebSocket(OPERATOR_URL);
  let beat: NodeJS.Timeout;

  ws.onopen = () => {
    console.log('[agent] Connected to operator');
    backoff = 500; // Reset on successful connect

    // Send heartbeat every 5s
    beat = setInterval(() => {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        agent_did: process.env.BLACKROAD_AGENT_DID,
        timestamp: Date.now(),
        zeta_time: `ζ-${Date.now().toString(36).toUpperCase()}`
      }));

      // Notify systemd watchdog
      if (process.send) process.send('WATCHDOG=1');
    }, 5000);
  };

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    handleMessage(msg);
  };

  function retry() {
    clearInterval(beat);
    // Jittered exponential backoff
    const delay = Math.min(maxBackoff, Math.floor(backoff * (1.6 + Math.random() * 0.4)));
    console.log(`[agent] Reconnecting in ${delay}ms...`);
    setTimeout(connect, delay);
    backoff = delay;
  }

  ws.onclose = retry;
  ws.onerror = retry;
}

connect();
```

---

## 4. OS-Level TCP Keepalives

Make dead links die fast so reconnects happen quickly.

```bash
sudo tee /etc/sysctl.d/99-websocket-keepalive.conf >/dev/null <<'SYS'
net.ipv4.tcp_keepalive_time = 30
net.ipv4.tcp_keepalive_intvl = 10
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_syn_retries = 5
net.ipv4.tcp_retries2 = 8
SYS
sudo sysctl --system
```

Also set per-socket keepalives in agent code:
- `TCP_KEEPIDLE=30`
- `TCP_KEEPINTVL=10`
- `TCP_KEEPCNT=3`

---

## 5. Journal + Log Rotation

Avoid disk fill on SD card:

```bash
sudo tee /etc/systemd/journald.conf.d/10-pi.conf >/dev/null <<'CONF'
[Journal]
SystemMaxUse=100M
MaxFileSec=1week
Compress=yes
CONF
sudo systemctl restart systemd-journald
```

---

## 6. Health Probes

### Local Check
```bash
systemctl is-active blackroad-agent || journalctl -u blackroad-agent --no-pager -n 100
```

### HTTP Health Endpoint
Add `/healthz` to agent:

```typescript
import http from 'http';

const healthServer = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      agent: process.env.BLACKROAD_AGENT_DID,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(3000, '127.0.0.1');
```

---

## 7. Security Hardening

### Create Dedicated User
```bash
sudo useradd -r -s /usr/sbin/nologin -m -d /var/lib/blackroad-agent blackroad
sudo chown -R blackroad:blackroad /var/lib/blackroad-agent
```

### Firewall
```bash
sudo apt-get install -y ufw fail2ban
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
```

### Patching & Time Sync
```bash
sudo apt-get update && sudo apt-get -y upgrade
sudo apt-get install -y unattended-upgrades
timedatectl set-ntp true
```

---

## 8. BlackRoad-Specific Configuration

### Agent Registration
Each Pi agent registers with the identity service on startup:

```bash
curl -X POST https://blackroad-identity.amundsonalexa.workers.dev/handshake \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "pi-mesh",
    "personality": "Edge agent on Raspberry Pi",
    "hostname": "pi1.blackroad.systems",
    "did": "did:key:z6Mk..."
  }'
```

### Environment Variables
```bash
# /var/lib/blackroad-agent/.env
BLACKROAD_AGENT_DID=did:key:z6Mk...
BLACKROAD_OPERATOR_WS=wss://api.blackroad.io/ws/agent
BLACKROAD_IDENTITY_URL=https://blackroad-identity.amundsonalexa.workers.dev
NODE_ENV=production
WS_HEARTBEAT_MS=5000
WS_BACKOFF_BASE_MS=500
WS_BACKOFF_MAX_MS=30000
```

---

## 9. Quick Checklist

- [ ] Cloudflared tunnel installed, configured, `systemctl status cloudflared` = active
- [ ] `blackroad-agent.service` with `Type=notify`, `Restart=always`, `WatchdogSec` set
- [ ] Agent sends `WATCHDOG=1` and app heartbeats every 5s
- [ ] Exponential reconnect backoff (cap ~30s, add jitter)
- [ ] OS TCP keepalives: 30/10/3 applied (`sysctl --system`)
- [ ] Journald capped (≤100MB), logs compressing
- [ ] Service hardening (`NoNewPrivileges`, `Protect*`, cgroups limits)
- [ ] UFW egress-only, Fail2ban on, time sync on
- [ ] Health endpoints wired (local + Cloudflare)
- [ ] Agent DID registered with identity service

---

## 10. Monitoring Commands

```bash
# Check agent status
systemctl status blackroad-agent

# View recent logs
journalctl -u blackroad-agent -f

# Check tunnel status
systemctl status cloudflared

# Test health endpoint
curl http://localhost:3000/healthz

# Check TCP keepalive settings
sysctl net.ipv4.tcp_keepalive_time
sysctl net.ipv4.tcp_keepalive_intvl
sysctl net.ipv4.tcp_keepalive_probes

# Disk usage
df -h /var/log
journalctl --disk-usage
```

---

*Created: 2025-12-03*
*Owner: Alexa Louise Amundson*
*Pi Node: 192.168.4.49 (alice/lucidia)*
