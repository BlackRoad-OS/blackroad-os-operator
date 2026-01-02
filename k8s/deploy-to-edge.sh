#!/bin/bash

# BlackRoad OS - Edge Device Deployment Script
# Deploys K8s agents to Raspberry Pi edge devices (alice, aria, octavia, lucidia)

set -e

echo "🔌 BlackRoad OS - Edge Device Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Edge device configuration
ALICE_IP="192.168.4.49"
ARIA_IP="192.168.4.64"
OCTAVIA_IP="192.168.4.74"
LUCIDIA_IP="192.168.4.38"

EDGE_USER="pi"  # Default Raspberry Pi user
EDGE_PASSWORD="octavia"  # Update this to your actual password

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass
    fi
fi

# Function to deploy to edge device
deploy_to_device() {
    local device_name=$1
    local device_ip=$2

    echo -e "${BLUE}📡 Deploying to $device_name ($device_ip)...${NC}"

    # Check if device is reachable
    if ! ping -c 1 -W 2 $device_ip &> /dev/null; then
        echo -e "${RED}❌ Cannot reach $device_name at $device_ip${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ $device_name is reachable${NC}"

    # Create deployment directory on device
    sshpass -p "$EDGE_PASSWORD" ssh -o StrictHostKeyChecking=no $EDGE_USER@$device_ip "mkdir -p ~/blackroad-os"

    # Copy K8s manifests
    echo -e "${YELLOW}⏳ Copying K8s manifests to $device_name...${NC}"
    sshpass -p "$EDGE_PASSWORD" scp -o StrictHostKeyChecking=no \
        edge-devices-daemonset.yaml \
        mqtt-broker-deployment.yaml \
        $EDGE_USER@$device_ip:~/blackroad-os/

    # Install dependencies (k3s, docker, mosquitto)
    echo -e "${YELLOW}⏳ Installing dependencies on $device_name...${NC}"
    sshpass -p "$EDGE_PASSWORD" ssh -o StrictHostKeyChecking=no $EDGE_USER@$device_ip << 'EOF'
# Update package list
sudo apt-get update -qq

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install k3s (lightweight Kubernetes)
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | sh -
fi

# Install Mosquitto MQTT broker
if ! command -v mosquitto &> /dev/null; then
    sudo apt-get install -y mosquitto mosquitto-clients
    sudo systemctl enable mosquitto
    sudo systemctl start mosquitto
fi

# Install Node.js for edge agents
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✓ Dependencies installed"
EOF

    # Deploy edge agent
    echo -e "${YELLOW}⏳ Deploying BlackRoad edge agent on $device_name...${NC}"
    sshpass -p "$EDGE_PASSWORD" ssh -o StrictHostKeyChecking=no $EDGE_USER@$device_ip << EOF
cd ~/blackroad-os

# Create edge agent service
cat > edge-agent.service << 'SERVICE'
[Unit]
Description=BlackRoad OS Edge Agent
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/blackroad-os
ExecStart=/usr/bin/node edge-agent.js
Restart=always
RestartSec=10
Environment=DEVICE_NAME=$(hostname)
Environment=DEVICE_IP=$device_ip

[Install]
WantedBy=multi-user.target
SERVICE

# Create edge agent script
cat > edge-agent.js << 'AGENT'
const mqtt = require('mqtt');
const os = require('os');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mosquitto-mqtt.blackroad-mqtt.svc.cluster.local:1883';
const DEVICE_NAME = process.env.DEVICE_NAME || os.hostname();
const DEVICE_IP = process.env.DEVICE_IP;

console.log(\`🚀 BlackRoad Edge Agent starting on \${DEVICE_NAME} (\${DEVICE_IP})\`);

const client = mqtt.connect(\`mqtt://\${MQTT_BROKER}\`);

client.on('connect', () => {
    console.log(\`✓ Connected to MQTT broker: \${MQTT_BROKER}\`);

    // Subscribe to device-specific topics
    client.subscribe(\`blackroad/\${DEVICE_NAME}/#\`);
    client.subscribe('blackroad/sqtt/quantum/#');

    // Publish status
    setInterval(() => {
        const status = {
            device: DEVICE_NAME,
            ip: DEVICE_IP,
            uptime: os.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            },
            cpu: os.cpus(),
            timestamp: new Date().toISOString()
        };

        client.publish(\`blackroad/\${DEVICE_NAME}/status\`, JSON.stringify(status));
    }, 30000); // Every 30 seconds
});

client.on('message', (topic, message) => {
    console.log(\`📨 Message on \${topic}: \${message.toString()}\`);
});

client.on('error', (err) => {
    console.error(\`❌ MQTT Error: \${err.message}\`);
});

console.log(\`✨ Edge agent running on \${DEVICE_NAME}\`);
AGENT

# Install npm dependencies
npm init -y
npm install mqtt

# Install and start service
sudo cp edge-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable edge-agent
sudo systemctl start edge-agent

echo "✓ Edge agent deployed and running"
EOF

    echo -e "${GREEN}✓ Successfully deployed to $device_name${NC}"
    echo ""
}

# Main deployment flow
echo -e "${BLUE}📋 Deployment Plan:${NC}"
echo "1. alice (192.168.4.49) - Raspberry Pi 5 - Compute"
echo "2. aria (192.168.4.64) - Raspberry Pi 5 - Compute"
echo "3. octavia (192.168.4.74) - Raspberry Pi - Storage"
echo "4. lucidia (192.168.4.38) - Raspberry Pi - Gateway"
echo ""

read -p "Continue with edge deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Deploy to each device
deploy_to_device "alice" "$ALICE_IP"
deploy_to_device "aria" "$ARIA_IP"
deploy_to_device "octavia" "$OCTAVIA_IP"
deploy_to_device "lucidia" "$LUCIDIA_IP"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 Edge Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}📊 Deployment Summary:${NC}"
echo ""
echo "✓ alice (192.168.4.49) - Edge agent running"
echo "✓ aria (192.168.4.64) - Edge agent running"
echo "✓ octavia (192.168.4.74) - Edge agent running"
echo "✓ lucidia (192.168.4.38) - Edge agent running"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Monitor edge agents: ssh pi@<device-ip> 'sudo systemctl status edge-agent'"
echo "2. View agent logs: ssh pi@<device-ip> 'sudo journalctl -u edge-agent -f'"
echo "3. Check MQTT messages: mosquitto_sub -h <mqtt-broker-ip> -t 'blackroad/#' -v"
echo "4. Deploy to main K8s cluster: ./deploy-all.sh"
echo ""

echo -e "${GREEN}✨ All edge devices are now running BlackRoad OS agents!${NC}"
echo ""
