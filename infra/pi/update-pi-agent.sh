#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# BLACKROAD PI AGENT UPDATE SCRIPT
# ═══════════════════════════════════════════════════════════════════
# Owner: ALEXA LOUISE AMUNDSON
# Purpose: Update Pi agents to use Cloudflare Workers
# ═══════════════════════════════════════════════════════════════════

set -e

# Configuration
PI_HOST="${1:-192.168.4.64}"
PI_USER="${2:-pi}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════════════════════════"
echo "     BLACKROAD PI AGENT UPDATE"
echo "═══════════════════════════════════════════════════════════════════"
echo "     Updating: $PI_USER@$PI_HOST"
echo "     Owner: ALEXA LOUISE AMUNDSON"
echo "═══════════════════════════════════════════════════════════════════"
echo

# Check connectivity
echo "[1/6] Checking connectivity..."
if ! ping -c 1 -W 2 "$PI_HOST" > /dev/null 2>&1; then
    echo "✗ Cannot reach $PI_HOST"
    exit 1
fi
echo "✓ Pi is reachable"

# Copy new agent
echo
echo "[2/6] Copying new agent code..."
scp "$SCRIPT_DIR/blackroad-agent-cloudflare.py" "$PI_USER@$PI_HOST:/tmp/agent.py"
echo "✓ Agent code copied"

# Create directories and backup old agent
echo
echo "[3/6] Preparing Pi..."
ssh "$PI_USER@$PI_HOST" << 'REMOTE'
    sudo mkdir -p /opt/blackroad
    sudo chown pi:pi /opt/blackroad

    # Backup old agent if exists
    if [ -f /opt/blackroad/agent.py ]; then
        cp /opt/blackroad/agent.py /opt/blackroad/agent.py.bak.$(date +%s)
    fi

    # Copy new agent
    cp /tmp/agent.py /opt/blackroad/agent.py
    chmod +x /opt/blackroad/agent.py

    # Install dependencies
    pip3 install aiohttp --quiet 2>/dev/null || true
REMOTE
echo "✓ Pi prepared"

# Create systemd service
echo
echo "[4/6] Creating systemd service..."
ssh "$PI_USER@$PI_HOST" << 'REMOTE'
sudo tee /etc/systemd/system/blackroad-agent.service > /dev/null << 'SERVICE'
[Unit]
Description=BlackRoad Agent - Cloudflare Workers Edition
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Environment=AGENT_ID=blackroad-pi-5
Environment=AGENT_TYPE=pi-gateway
ExecStart=/usr/bin/python3 /opt/blackroad/agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
REMOTE
echo "✓ Systemd service created"

# Stop old agent
echo
echo "[5/6] Stopping old agent..."
ssh "$PI_USER@$PI_HOST" << 'REMOTE'
    sudo systemctl stop blackroad-agent 2>/dev/null || true
    # Kill any old websocket connections
    pkill -f "ws://.*:8000" 2>/dev/null || true
REMOTE
echo "✓ Old agent stopped"

# Start new agent
echo
echo "[6/6] Starting new agent..."
ssh "$PI_USER@$PI_HOST" << 'REMOTE'
    sudo systemctl enable blackroad-agent
    sudo systemctl start blackroad-agent
    sleep 2
    sudo systemctl status blackroad-agent --no-pager | head -20
REMOTE

echo
echo "═══════════════════════════════════════════════════════════════════"
echo "     UPDATE COMPLETE"
echo "═══════════════════════════════════════════════════════════════════"
echo
echo "Pi is now connected to Cloudflare Workers:"
echo "  - Identity:    https://blackroad-identity.amundsonalexa.workers.dev"
echo "  - Cipher:      https://blackroad-cipher.amundsonalexa.workers.dev"
echo "  - Sovereignty: https://blackroad-sovereignty.amundsonalexa.workers.dev"
echo
echo "Check logs: ssh $PI_USER@$PI_HOST 'sudo journalctl -u blackroad-agent -f'"
echo
echo "═══════════════════════════════════════════════════════════════════"
