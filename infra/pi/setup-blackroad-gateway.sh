#!/bin/bash
# ============================================
# BlackRoad OS Pi Gateway Setup
# ============================================
# Run this ON the Pi after SSH access
# Makes Pi the ultimate traffic gatekeeper
# ============================================

set -e

echo "=========================================="
echo "  BlackRoad OS Pi Gateway Setup"
echo "  Owner: Alexa Louise Amundson"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Config
BLACKROAD_INTERCEPT="https://blackroad-intercept.amundsonalexa.workers.dev"
PI_IP="192.168.4.100"  # Change to your preferred static IP
GATEWAY_IP="192.168.4.1"  # Your router

echo -e "${YELLOW}Step 1: Update system${NC}"
sudo apt-get update
sudo apt-get upgrade -y

echo -e "${YELLOW}Step 2: Install required packages${NC}"
sudo apt-get install -y \
    dnsmasq \
    iptables-persistent \
    tcpdump \
    nftables \
    curl \
    jq \
    net-tools

echo -e "${YELLOW}Step 3: Configure static IP${NC}"
cat | sudo tee /etc/dhcpcd.conf << EOF
# BlackRoad Gateway Static IP
interface eth0
static ip_address=${PI_IP}/24
static routers=${GATEWAY_IP}
static domain_name_servers=1.1.1.1 8.8.8.8

interface wlan0
static ip_address=${PI_IP}/24
static routers=${GATEWAY_IP}
static domain_name_servers=1.1.1.1 8.8.8.8
EOF

echo -e "${YELLOW}Step 4: Configure DNS sinkhole (dnsmasq)${NC}"
sudo systemctl stop systemd-resolved 2>/dev/null || true
sudo systemctl disable systemd-resolved 2>/dev/null || true

cat | sudo tee /etc/dnsmasq.conf << 'EOF'
# BlackRoad Gateway DNS Configuration
# Blocks telemetry and redirects to BlackRoad intercept

# Basic settings
domain-needed
bogus-priv
no-resolv

# Upstream DNS (Cloudflare + Google fallback)
server=1.1.1.1
server=8.8.8.8

# Listen on all interfaces
listen-address=0.0.0.0

# Cache size
cache-size=10000

# Log all queries
log-queries
log-facility=/var/log/dnsmasq.log

# ============================================
# BLOCKED TELEMETRY DOMAINS
# Redirect to 0.0.0.0 (black hole)
# ============================================

# OpenAI - HIGH RISK (trains on data)
address=/telemetry.openai.com/0.0.0.0
address=/events.openai.com/0.0.0.0
address=/browser-intake-datadoghq.com/0.0.0.0
address=/stats.openai.com/0.0.0.0

# Google telemetry
address=/telemetry.google.com/0.0.0.0
address=/analytics.google.com/0.0.0.0
address=/www.google-analytics.com/0.0.0.0
address=/ssl.google-analytics.com/0.0.0.0
address=/googleadservices.com/0.0.0.0
address=/pagead2.googlesyndication.com/0.0.0.0

# Microsoft telemetry
address=/telemetry.microsoft.com/0.0.0.0
address=/vortex.data.microsoft.com/0.0.0.0
address=/settings-win.data.microsoft.com/0.0.0.0
address=/watson.telemetry.microsoft.com/0.0.0.0

# Apple telemetry
address=/metrics.apple.com/0.0.0.0
address=/xp.apple.com/0.0.0.0
address=/analytics.apple.com/0.0.0.0

# Facebook/Meta
address=/pixel.facebook.com/0.0.0.0
address=/analytics.facebook.com/0.0.0.0
address=/graph.facebook.com/0.0.0.0

# Amazon
address=/device-metrics-us.amazon.com/0.0.0.0
address=/device-metrics-us-2.amazon.com/0.0.0.0

# Generic trackers
address=/doubleclick.net/0.0.0.0
address=/adservice.google.com/0.0.0.0

# ============================================
# ALLOW LIST (BlackRoad + Essential)
# ============================================
# These pass through normally:
# - *.blackroad.io
# - *.amundsonalexa.workers.dev
# - api.anthropic.com (Claude API - our ally)
# - api.openai.com (needed for API calls, NOT consumer)

EOF

echo -e "${YELLOW}Step 5: Enable IP forwarding${NC}"
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

echo -e "${YELLOW}Step 6: Configure iptables for traffic logging${NC}"
cat | sudo tee /etc/iptables/rules.v4 << 'EOF'
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]

# Log all forwarded traffic
-A FORWARD -j LOG --log-prefix "BLACKROAD_FWD: " --log-level 4

# Allow established connections
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow DNS
-A INPUT -p udp --dport 53 -j ACCEPT
-A INPUT -p tcp --dport 53 -j ACCEPT

# Allow SSH
-A INPUT -p tcp --dport 22 -j ACCEPT

# Allow DHCP
-A INPUT -p udp --dport 67:68 -j ACCEPT

COMMIT

*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]

# NAT for internet access through Pi
-A POSTROUTING -o eth0 -j MASQUERADE
-A POSTROUTING -o wlan0 -j MASQUERADE

COMMIT
EOF

sudo iptables-restore < /etc/iptables/rules.v4

echo -e "${YELLOW}Step 7: Create traffic monitoring script${NC}"
cat | sudo tee /usr/local/bin/blackroad-monitor << 'EOF'
#!/bin/bash
# BlackRoad Traffic Monitor
# Shows real-time blocked requests

echo "=========================================="
echo "  BlackRoad Traffic Monitor"
echo "  Watching for blocked telemetry..."
echo "=========================================="

tail -f /var/log/dnsmasq.log | grep --line-buffered -E "(0.0.0.0|BLOCKED)" | while read line; do
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] BLOCKED: $line"

    # Log to BlackRoad intercept
    curl -s -X POST "${BLACKROAD_INTERCEPT}/log" \
        -H "Content-Type: application/json" \
        -d "{\"blocked\": \"$line\", \"timestamp\": \"$timestamp\"}" \
        >/dev/null 2>&1 &
done
EOF
sudo chmod +x /usr/local/bin/blackroad-monitor

echo -e "${YELLOW}Step 8: Create systemd service${NC}"
cat | sudo tee /etc/systemd/system/blackroad-gateway.service << 'EOF'
[Unit]
Description=BlackRoad Gateway Monitor
After=network.target dnsmasq.service

[Service]
Type=simple
ExecStart=/usr/local/bin/blackroad-monitor
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

echo -e "${YELLOW}Step 9: Enable services${NC}"
sudo systemctl daemon-reload
sudo systemctl enable dnsmasq
sudo systemctl enable blackroad-gateway
sudo systemctl start dnsmasq

echo -e "${YELLOW}Step 10: Create status script${NC}"
cat | sudo tee /usr/local/bin/blackroad-status << 'EOF'
#!/bin/bash
echo "=========================================="
echo "  BlackRoad Gateway Status"
echo "=========================================="
echo ""
echo "IP Address:"
ip addr show | grep "inet " | grep -v 127.0.0.1
echo ""
echo "DNS Service:"
systemctl status dnsmasq --no-pager | head -5
echo ""
echo "Blocked today:"
grep "0.0.0.0" /var/log/dnsmasq.log 2>/dev/null | wc -l
echo ""
echo "Top blocked domains:"
grep "0.0.0.0" /var/log/dnsmasq.log 2>/dev/null | awk '{print $6}' | sort | uniq -c | sort -rn | head -10
EOF
sudo chmod +x /usr/local/bin/blackroad-status

echo ""
echo -e "${GREEN}=========================================="
echo "  BlackRoad Gateway Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Pi IP: ${PI_IP}"
echo ""
echo "To use this as your gateway:"
echo "  1. On your Mac, go to System Preferences > Network"
echo "  2. Set DNS Server to: ${PI_IP}"
echo "  3. Or set router DHCP to give ${PI_IP} as DNS"
echo ""
echo "Commands:"
echo "  blackroad-status  - Show gateway status"
echo "  blackroad-monitor - Watch blocked requests live"
echo ""
echo "Reboot to apply all changes:"
echo "  sudo reboot"
