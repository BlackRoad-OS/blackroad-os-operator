#!/bin/bash
# ============================================
# BlackRoad Pi Unified Setup
# ============================================
# Combines:
#   - Gateway (DNS sinkhole, traffic intercept)
#   - Pi-Ops (LED, screen, MQTT dashboard)
#   - Pi-Holo support (holographic display)
#   - BlackRoad agent connectivity
# ============================================
# Owner: Alexa Louise Amundson
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PI_HOSTNAME="blackroad-gateway"
PI_IP="192.168.4.100"
GATEWAY_IP="192.168.4.1"
BLACKROAD_INTERCEPT="https://blackroad-intercept.amundsonalexa.workers.dev"
BLACKROAD_IDENTITY="https://blackroad-identity.amundsonalexa.workers.dev"
PI_OPS_PORT=8080
LED_PIN=18
LED_COUNT=60

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         BlackRoad Pi Unified Setup                        ║"
echo "║         Owner: Alexa Louise Amundson                      ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Components:                                               ║"
echo "║    • Network Gateway (DNS sinkhole)                       ║"
echo "║    • Traffic Intercept (blocks telemetry)                 ║"
echo "║    • Pi-Ops Dashboard (LED, screen, MQTT)                 ║"
echo "║    • BlackRoad Agent Identity                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root for system setup
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Note: Some steps require sudo. You may be prompted.${NC}"
fi

# ============================================
# PHASE 1: System Setup
# ============================================
echo -e "\n${CYAN}═══ PHASE 1: System Setup ═══${NC}"

echo -e "${YELLOW}[1/15] Updating system...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

echo -e "${YELLOW}[2/15] Installing core packages...${NC}"
sudo apt-get install -y \
    python3 python3-pip python3-venv \
    git curl wget jq \
    dnsmasq iptables-persistent nftables \
    mosquitto mosquitto-clients \
    sqlite3 \
    net-tools tcpdump \
    nginx

echo -e "${YELLOW}[3/15] Installing Pi-specific packages...${NC}"
sudo apt-get install -y \
    python3-rpi.gpio \
    python3-spidev \
    python3-smbus \
    i2c-tools || echo "Some Pi packages unavailable (may not be on Pi hardware)"

echo -e "${YELLOW}[4/15] Setting hostname to ${PI_HOSTNAME}...${NC}"
sudo hostnamectl set-hostname ${PI_HOSTNAME}
echo "127.0.0.1 ${PI_HOSTNAME}" | sudo tee -a /etc/hosts

# ============================================
# PHASE 2: Network Gateway Setup
# ============================================
echo -e "\n${CYAN}═══ PHASE 2: Network Gateway ═══${NC}"

echo -e "${YELLOW}[5/15] Configuring static IP...${NC}"
sudo tee /etc/dhcpcd.conf > /dev/null << EOF
# BlackRoad Gateway Static IP
hostname ${PI_HOSTNAME}

interface eth0
static ip_address=${PI_IP}/24
static routers=${GATEWAY_IP}
static domain_name_servers=1.1.1.1 8.8.8.8

interface wlan0
static ip_address=${PI_IP}/24
static routers=${GATEWAY_IP}
static domain_name_servers=1.1.1.1 8.8.8.8
EOF

echo -e "${YELLOW}[6/15] Configuring DNS sinkhole (dnsmasq)...${NC}"
sudo systemctl stop systemd-resolved 2>/dev/null || true
sudo systemctl disable systemd-resolved 2>/dev/null || true

sudo tee /etc/dnsmasq.conf > /dev/null << 'EOF'
# ============================================
# BlackRoad Gateway DNS Configuration
# ============================================

# Basic settings
domain-needed
bogus-priv
no-resolv
expand-hosts

# Upstream DNS
server=1.1.1.1
server=8.8.8.8

# Listen on all interfaces
listen-address=0.0.0.0
bind-interfaces

# DHCP (optional - enable if Pi is DHCP server)
# dhcp-range=192.168.4.50,192.168.4.150,12h
# dhcp-option=option:router,192.168.4.1
# dhcp-option=option:dns-server,192.168.4.100

# Cache
cache-size=10000

# Logging
log-queries
log-facility=/var/log/dnsmasq.log

# ============================================
# BLOCKED TELEMETRY - Training Risk
# ============================================

# OpenAI (HIGH - trains on consumer data)
address=/telemetry.openai.com/0.0.0.0
address=/events.openai.com/0.0.0.0
address=/stats.openai.com/0.0.0.0
address=/browser-intake-datadoghq.com/0.0.0.0

# Google Analytics & Telemetry
address=/telemetry.google.com/0.0.0.0
address=/analytics.google.com/0.0.0.0
address=/www.google-analytics.com/0.0.0.0
address=/ssl.google-analytics.com/0.0.0.0
address=/googleadservices.com/0.0.0.0
address=/pagead2.googlesyndication.com/0.0.0.0
address=/adservice.google.com/0.0.0.0
address=/doubleclick.net/0.0.0.0

# Microsoft Telemetry
address=/telemetry.microsoft.com/0.0.0.0
address=/vortex.data.microsoft.com/0.0.0.0
address=/settings-win.data.microsoft.com/0.0.0.0
address=/watson.telemetry.microsoft.com/0.0.0.0
address=/telemetry.urs.microsoft.com/0.0.0.0

# Apple Telemetry
address=/metrics.apple.com/0.0.0.0
address=/xp.apple.com/0.0.0.0
address=/analytics.apple.com/0.0.0.0
address=/iadsdk.apple.com/0.0.0.0

# Facebook/Meta
address=/pixel.facebook.com/0.0.0.0
address=/analytics.facebook.com/0.0.0.0
address=/connect.facebook.net/0.0.0.0
address=/graph.facebook.com/0.0.0.0

# Amazon Telemetry
address=/device-metrics-us.amazon.com/0.0.0.0
address=/device-metrics-us-2.amazon.com/0.0.0.0

# Other trackers
address=/crashlytics.com/0.0.0.0
address=/app-measurement.com/0.0.0.0
address=/mixpanel.com/0.0.0.0
address=/segment.io/0.0.0.0
address=/amplitude.com/0.0.0.0

# ============================================
# ALLOWED - BlackRoad Infrastructure
# ============================================
# These resolve normally (not blocked)
# - *.blackroad.io
# - *.amundsonalexa.workers.dev
# - api.anthropic.com (Claude API - ally)
# - api.openai.com (API tier only)
# - cloudflare.com

EOF

echo -e "${YELLOW}[7/15] Enabling IP forwarding...${NC}"
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

echo -e "${YELLOW}[8/15] Configuring iptables...${NC}"
sudo tee /etc/iptables/rules.v4 > /dev/null << 'EOF'
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]

# Log forwarded traffic
-A FORWARD -j LOG --log-prefix "BLACKROAD: " --log-level 4

# Allow established
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow essential services
-A INPUT -p udp --dport 53 -j ACCEPT
-A INPUT -p tcp --dport 53 -j ACCEPT
-A INPUT -p tcp --dport 22 -j ACCEPT
-A INPUT -p tcp --dport 80 -j ACCEPT
-A INPUT -p tcp --dport 8080 -j ACCEPT
-A INPUT -p tcp --dport 1883 -j ACCEPT
-A INPUT -p udp --dport 67:68 -j ACCEPT
-A INPUT -i lo -j ACCEPT

COMMIT

*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]

# NAT for internet
-A POSTROUTING -o eth0 -j MASQUERADE
-A POSTROUTING -o wlan0 -j MASQUERADE

COMMIT
EOF

sudo iptables-restore < /etc/iptables/rules.v4

# ============================================
# PHASE 3: Pi-Ops Dashboard
# ============================================
echo -e "\n${CYAN}═══ PHASE 3: Pi-Ops Dashboard ═══${NC}"

echo -e "${YELLOW}[9/15] Creating Pi-Ops directory...${NC}"
sudo mkdir -p /opt/blackroad
cd /opt/blackroad

echo -e "${YELLOW}[10/15] Creating unified Pi-Ops application...${NC}"
sudo tee /opt/blackroad/app.py > /dev/null << 'PYEOF'
"""
BlackRoad Pi-Ops Unified Dashboard
- Gateway status monitoring
- LED control
- MQTT bridge
- Traffic intercept logging
- Agent identity registration
"""
import asyncio
import json
import os
import sqlite3
import subprocess
import threading
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import httpx

# Try to import Pi-specific libraries
try:
    import board
    import neopixel
    HAS_NEOPIXEL = True
except ImportError:
    HAS_NEOPIXEL = False
    print("NeoPixel not available - LED features disabled")

# Configuration
BLACKROAD_IDENTITY = os.getenv("BLACKROAD_IDENTITY", "https://blackroad-identity.amundsonalexa.workers.dev")
BLACKROAD_INTERCEPT = os.getenv("BLACKROAD_INTERCEPT", "https://blackroad-intercept.amundsonalexa.workers.dev")
LED_PIN = int(os.getenv("LED_PIN", "18"))
LED_COUNT = int(os.getenv("LED_COUNT", "60"))
LED_BRIGHTNESS = float(os.getenv("LED_BRIGHTNESS", "0.3"))
DB_PATH = Path("/opt/blackroad/gateway.db")

app = FastAPI(title="BlackRoad Pi Gateway", version="1.0.0")

# Initialize LED strip if available
pixels = None
if HAS_NEOPIXEL:
    try:
        pixels = neopixel.NeoPixel(board.D18, LED_COUNT, brightness=LED_BRIGHTNESS, auto_write=False)
        print(f"NeoPixel initialized: {LED_COUNT} LEDs on GPIO18")
    except Exception as e:
        print(f"NeoPixel init failed: {e}")

# Database setup
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS blocked_requests
                 (id INTEGER PRIMARY KEY, timestamp TEXT, domain TEXT, client_ip TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS traffic_stats
                 (id INTEGER PRIMARY KEY, timestamp TEXT, bytes_in INTEGER, bytes_out INTEGER)''')
    conn.commit()
    conn.close()

init_db()

# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>BlackRoad Gateway</title>
        <style>
            body { font-family: monospace; background: #0a0a0a; color: #00ff00; padding: 20px; }
            h1 { color: #ff6b00; }
            .status { background: #1a1a1a; padding: 15px; margin: 10px 0; border-left: 3px solid #00ff00; }
            .blocked { border-left-color: #ff0066; }
            a { color: #00aaff; }
        </style>
    </head>
    <body>
        <h1>⬡ BlackRoad Gateway</h1>
        <p>Owner: Alexa Louise Amundson</p>
        <div class="status">
            <h3>Endpoints</h3>
            <ul>
                <li><a href="/health">/health</a> - Health check</li>
                <li><a href="/status">/status</a> - Full status</li>
                <li><a href="/blocked">/blocked</a> - Blocked requests</li>
                <li><a href="/dns/stats">/dns/stats</a> - DNS statistics</li>
                <li>/led/color - POST to set LED color</li>
                <li>/led/pattern - POST to run pattern</li>
            </ul>
        </div>
        <div class="status blocked">
            <h3>Protection Active</h3>
            <p>Blocking telemetry from: OpenAI, Google, Microsoft, Apple, Facebook, Amazon</p>
        </div>
    </body>
    </html>
    """)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "blackroad-gateway",
        "hostname": os.uname().nodename,
        "timestamp": datetime.utcnow().isoformat(),
        "led_available": HAS_NEOPIXEL and pixels is not None,
        "owner": "alexa-louise-amundson"
    }

@app.get("/status")
async def status():
    # Get DNS stats
    blocked_count = 0
    try:
        result = subprocess.run(
            ["grep", "-c", "0.0.0.0", "/var/log/dnsmasq.log"],
            capture_output=True, text=True, timeout=5
        )
        blocked_count = int(result.stdout.strip()) if result.stdout.strip() else 0
    except:
        pass

    # Get network stats
    try:
        result = subprocess.run(["cat", "/proc/net/dev"], capture_output=True, text=True)
        net_stats = result.stdout
    except:
        net_stats = "unavailable"

    # Get memory
    try:
        result = subprocess.run(["free", "-m"], capture_output=True, text=True)
        memory = result.stdout
    except:
        memory = "unavailable"

    return {
        "gateway": {
            "hostname": os.uname().nodename,
            "uptime": subprocess.run(["uptime", "-p"], capture_output=True, text=True).stdout.strip(),
            "ip": subprocess.run(["hostname", "-I"], capture_output=True, text=True).stdout.strip(),
        },
        "protection": {
            "dns_sinkhole": "active",
            "blocked_today": blocked_count,
            "telemetry_blocked": ["openai", "google", "microsoft", "apple", "facebook", "amazon"]
        },
        "hardware": {
            "led_available": HAS_NEOPIXEL and pixels is not None,
            "led_count": LED_COUNT if pixels else 0,
        },
        "owner": "alexa-louise-amundson",
        "blackroad": {
            "identity": BLACKROAD_IDENTITY,
            "intercept": BLACKROAD_INTERCEPT
        }
    }

@app.get("/blocked")
async def get_blocked():
    """Get recent blocked DNS requests"""
    blocked = []
    try:
        result = subprocess.run(
            ["tail", "-100", "/var/log/dnsmasq.log"],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.split('\n'):
            if '0.0.0.0' in line or 'NXDOMAIN' in line:
                blocked.append(line)
    except Exception as e:
        return {"error": str(e)}

    return {
        "blocked_requests": blocked[-50:],
        "count": len(blocked),
        "message": "These telemetry requests were blocked"
    }

@app.get("/dns/stats")
async def dns_stats():
    """Get DNS query statistics"""
    stats = {"queries": 0, "blocked": 0, "by_domain": {}}
    try:
        result = subprocess.run(
            ["cat", "/var/log/dnsmasq.log"],
            capture_output=True, text=True, timeout=10
        )
        for line in result.stdout.split('\n'):
            if 'query' in line.lower():
                stats["queries"] += 1
            if '0.0.0.0' in line:
                stats["blocked"] += 1
                # Extract domain
                parts = line.split()
                for part in parts:
                    if '.' in part and not part.startswith('0.'):
                        domain = part.split('/')[0] if '/' in part else part
                        stats["by_domain"][domain] = stats["by_domain"].get(domain, 0) + 1
    except:
        pass

    # Top blocked
    top_blocked = sorted(stats["by_domain"].items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "total_queries": stats["queries"],
        "blocked_count": stats["blocked"],
        "block_rate": f"{(stats['blocked']/max(stats['queries'],1)*100):.1f}%",
        "top_blocked": dict(top_blocked)
    }

# ============================================
# LED Control
# ============================================

@app.post("/led/color")
async def set_led_color(request: Request):
    """Set LED strip to solid color"""
    if not pixels:
        raise HTTPException(status_code=503, detail="LED not available")

    data = await request.json()
    r = data.get("r", 0)
    g = data.get("g", 0)
    b = data.get("b", 0)

    pixels.fill((r, g, b))
    pixels.show()

    return {"status": "ok", "color": {"r": r, "g": g, "b": b}}

@app.post("/led/pattern")
async def set_led_pattern(request: Request):
    """Run LED pattern"""
    if not pixels:
        raise HTTPException(status_code=503, detail="LED not available")

    data = await request.json()
    pattern = data.get("pattern", "rainbow")

    if pattern == "rainbow":
        # Quick rainbow cycle
        for j in range(255):
            for i in range(LED_COUNT):
                pixel_index = (i * 256 // LED_COUNT) + j
                pixels[i] = wheel(pixel_index & 255)
            pixels.show()
            await asyncio.sleep(0.01)
    elif pattern == "blocked":
        # Red flash for blocked request
        for _ in range(3):
            pixels.fill((255, 0, 0))
            pixels.show()
            await asyncio.sleep(0.1)
            pixels.fill((0, 0, 0))
            pixels.show()
            await asyncio.sleep(0.1)
    elif pattern == "success":
        # Green pulse
        pixels.fill((0, 255, 0))
        pixels.show()
        await asyncio.sleep(0.5)
        pixels.fill((0, 0, 0))
        pixels.show()

    return {"status": "ok", "pattern": pattern}

@app.post("/led/off")
async def led_off():
    """Turn off LEDs"""
    if pixels:
        pixels.fill((0, 0, 0))
        pixels.show()
    return {"status": "ok"}

def wheel(pos):
    """Color wheel for rainbow effect"""
    if pos < 85:
        return (pos * 3, 255 - pos * 3, 0)
    elif pos < 170:
        pos -= 85
        return (255 - pos * 3, 0, pos * 3)
    else:
        pos -= 170
        return (0, pos * 3, 255 - pos * 3)

# ============================================
# BlackRoad Integration
# ============================================

@app.post("/register")
async def register_with_blackroad():
    """Register this Pi as a BlackRoad agent"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BLACKROAD_IDENTITY}/handshake",
                json={
                    "provider": "blackroad-pi",
                    "provider_model": "raspberry-pi-gateway",
                    "personality": "BlackRoad Gateway - Network protector and traffic interceptor",
                    "user_message": "Pi gateway coming online"
                },
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}

@app.post("/report-block")
async def report_block(request: Request):
    """Report a blocked request to BlackRoad intercept"""
    data = await request.json()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BLACKROAD_INTERCEPT}/log",
                json={
                    "source": "pi-gateway",
                    "blocked_domain": data.get("domain"),
                    "client_ip": data.get("client_ip"),
                    "timestamp": datetime.utcnow().isoformat()
                },
                timeout=5
            )
            return {"reported": True}
        except:
            return {"reported": False, "queued": True}

# ============================================
# Main
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
PYEOF

echo -e "${YELLOW}[11/15] Creating requirements.txt...${NC}"
sudo tee /opt/blackroad/requirements.txt > /dev/null << 'EOF'
fastapi>=0.100.0
uvicorn>=0.23.0
httpx>=0.24.0
paho-mqtt>=1.6.0
# Pi-specific (install separately if on Pi)
# adafruit-circuitpython-neopixel
# RPi.GPIO
EOF

echo -e "${YELLOW}[12/15] Setting up Python environment...${NC}"
cd /opt/blackroad
sudo python3 -m venv venv
sudo /opt/blackroad/venv/bin/pip install --upgrade pip
sudo /opt/blackroad/venv/bin/pip install -r requirements.txt

# Try to install Pi-specific packages
sudo /opt/blackroad/venv/bin/pip install adafruit-circuitpython-neopixel RPi.GPIO 2>/dev/null || echo "Pi LED packages not available"

# ============================================
# PHASE 4: Services
# ============================================
echo -e "\n${CYAN}═══ PHASE 4: Services ═══${NC}"

echo -e "${YELLOW}[13/15] Creating systemd services...${NC}"

# Main gateway service
sudo tee /etc/systemd/system/blackroad-gateway.service > /dev/null << 'EOF'
[Unit]
Description=BlackRoad Pi Gateway
After=network.target dnsmasq.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/blackroad
Environment=BLACKROAD_IDENTITY=https://blackroad-identity.amundsonalexa.workers.dev
Environment=BLACKROAD_INTERCEPT=https://blackroad-intercept.amundsonalexa.workers.dev
Environment=LED_PIN=18
Environment=LED_COUNT=60
ExecStart=/opt/blackroad/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# DNS monitor service
sudo tee /etc/systemd/system/blackroad-monitor.service > /dev/null << 'EOF'
[Unit]
Description=BlackRoad DNS Monitor
After=dnsmasq.service blackroad-gateway.service

[Service]
Type=simple
User=root
ExecStart=/opt/blackroad/monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Monitor script
sudo tee /opt/blackroad/monitor.sh > /dev/null << 'MONEOF'
#!/bin/bash
# Monitor DNS blocks and flash LED + report to BlackRoad

GATEWAY_URL="http://localhost:8080"

tail -F /var/log/dnsmasq.log 2>/dev/null | while read line; do
    if echo "$line" | grep -q "0.0.0.0"; then
        # Extract domain
        domain=$(echo "$line" | grep -oP '(?<=reply )[^ ]+(?= is)')

        # Flash LED red
        curl -s -X POST "$GATEWAY_URL/led/pattern" \
            -H "Content-Type: application/json" \
            -d '{"pattern":"blocked"}' &

        # Report to BlackRoad
        curl -s -X POST "$GATEWAY_URL/report-block" \
            -H "Content-Type: application/json" \
            -d "{\"domain\":\"$domain\"}" &

        echo "[BLOCKED] $domain"
    fi
done
MONEOF
sudo chmod +x /opt/blackroad/monitor.sh

echo -e "${YELLOW}[14/15] Enabling services...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable dnsmasq
sudo systemctl enable mosquitto
sudo systemctl enable blackroad-gateway
sudo systemctl enable blackroad-monitor

# ============================================
# PHASE 5: Utilities
# ============================================
echo -e "\n${CYAN}═══ PHASE 5: Utilities ═══${NC}"

echo -e "${YELLOW}[15/15] Creating utility scripts...${NC}"

# Status command
sudo tee /usr/local/bin/blackroad-status > /dev/null << 'EOF'
#!/bin/bash
echo "╔════════════════════════════════════════╗"
echo "║     BlackRoad Gateway Status           ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "IP Address:"
hostname -I
echo ""
echo "Services:"
systemctl is-active dnsmasq && echo "  dnsmasq: ✓ running" || echo "  dnsmasq: ✗ stopped"
systemctl is-active blackroad-gateway && echo "  gateway: ✓ running" || echo "  gateway: ✗ stopped"
systemctl is-active blackroad-monitor && echo "  monitor: ✓ running" || echo "  monitor: ✗ stopped"
systemctl is-active mosquitto && echo "  mosquitto: ✓ running" || echo "  mosquitto: ✗ stopped"
echo ""
echo "Blocked Today:"
grep -c "0.0.0.0" /var/log/dnsmasq.log 2>/dev/null || echo "0"
echo ""
echo "Top Blocked Domains:"
grep "0.0.0.0" /var/log/dnsmasq.log 2>/dev/null | awk '{print $6}' | sort | uniq -c | sort -rn | head -5
echo ""
echo "Dashboard: http://$(hostname -I | awk '{print $1}'):8080"
EOF
sudo chmod +x /usr/local/bin/blackroad-status

# Quick block command
sudo tee /usr/local/bin/blackroad-block > /dev/null << 'EOF'
#!/bin/bash
# Add domain to blocklist
if [ -z "$1" ]; then
    echo "Usage: blackroad-block <domain>"
    exit 1
fi
echo "address=/$1/0.0.0.0" | sudo tee -a /etc/dnsmasq.conf
sudo systemctl restart dnsmasq
echo "Blocked: $1"
EOF
sudo chmod +x /usr/local/bin/blackroad-block

# LED test command
sudo tee /usr/local/bin/blackroad-led > /dev/null << 'EOF'
#!/bin/bash
curl -s -X POST "http://localhost:8080/led/pattern" \
    -H "Content-Type: application/json" \
    -d "{\"pattern\":\"${1:-rainbow}\"}"
echo ""
EOF
sudo chmod +x /usr/local/bin/blackroad-led

# ============================================
# COMPLETE
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗"
echo "║     BlackRoad Pi Gateway Setup Complete!                    ║"
echo "╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Pi IP: ${CYAN}${PI_IP}${NC}"
echo -e "Dashboard: ${CYAN}http://${PI_IP}:8080${NC}"
echo ""
echo "Commands:"
echo "  blackroad-status  - Show gateway status"
echo "  blackroad-block   - Block a domain"
echo "  blackroad-led     - Test LED patterns"
echo ""
echo "To use as your DNS gateway:"
echo "  1. Set your Mac's DNS to: ${PI_IP}"
echo "  2. Or set router DHCP to give ${PI_IP} as DNS"
echo ""
echo -e "${YELLOW}Reboot to apply all changes:${NC}"
echo "  sudo reboot"
echo ""
echo -e "${RED}Remember: All data belongs to Alexa Louise Amundson${NC}"
