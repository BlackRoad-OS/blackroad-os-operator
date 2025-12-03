#!/bin/bash
# BlackRoad Cloudflare Tunnel Setup Script
# Run on the host that will run the tunnel (e.g., DigitalOcean droplet)

set -e

echo "=== BlackRoad Cloudflare Tunnel Setup ==="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
    echo "cloudflared installed: $(cloudflared --version)"
else
    echo "cloudflared already installed: $(cloudflared --version)"
fi

# Create cloudflared user if not exists
if ! id "cloudflared" &>/dev/null; then
    echo "Creating cloudflared user..."
    useradd -r -s /bin/false cloudflared
fi

# Create directories
echo "Creating directories..."
mkdir -p /etc/cloudflared
mkdir -p /var/log/cloudflared
chown cloudflared:cloudflared /var/log/cloudflared

# Check for existing tunnel
if [ -f /etc/cloudflared/blackroad-primary.json ]; then
    echo "Tunnel credentials already exist."
else
    echo ""
    echo "=== MANUAL STEP REQUIRED ==="
    echo "Run the following command to authenticate and create the tunnel:"
    echo ""
    echo "  cloudflared tunnel login"
    echo "  cloudflared tunnel create blackroad-primary"
    echo ""
    echo "Then copy the credentials file:"
    echo "  cp ~/.cloudflared/*.json /etc/cloudflared/blackroad-primary.json"
    echo ""
fi

# Copy config
if [ -f ./config.yml ]; then
    echo "Copying config.yml to /etc/cloudflared/..."
    cp ./config.yml /etc/cloudflared/config.yml
    chown cloudflared:cloudflared /etc/cloudflared/config.yml
fi

# Install systemd service
if [ -f ./blackroad-tunnel.service ]; then
    echo "Installing systemd service..."
    cp ./blackroad-tunnel.service /etc/systemd/system/
    systemctl daemon-reload
    echo "Service installed. Enable with: systemctl enable blackroad-tunnel"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Authenticate: cloudflared tunnel login"
echo "  2. Create tunnel: cloudflared tunnel create blackroad-primary"
echo "  3. Copy credentials: cp ~/.cloudflared/*.json /etc/cloudflared/blackroad-primary.json"
echo "  4. Add DNS routes: cloudflared tunnel route dns blackroad-primary app.blackroad.io"
echo "  5. Start: systemctl start blackroad-tunnel"
echo ""
