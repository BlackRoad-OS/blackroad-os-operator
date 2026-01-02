#!/bin/bash

# BlackRoad OS - Complete K8s + Multicloud + SQTT Deployment
# Deploys to K8s cluster, edge devices (alice, aria, octavia, lucidia), and activates quantum layer

set -e

echo "🚀 BlackRoad OS - Complete Infrastructure Deployment"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Deployment Steps:${NC}"
echo "1. Deploy BlackRoad OS to K8s"
echo "2. Deploy MQTT Broker"
echo "3. Deploy Multicloud Orchestrator"
echo "4. Deploy SQTT Quantum Layer"
echo "5. Deploy to Edge Devices"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Deploy BlackRoad OS
echo -e "${GREEN}✓ Step 1: Deploying BlackRoad OS to K8s...${NC}"
kubectl apply -f blackroad-os-deployment.yaml
echo ""

# Wait for pods to be ready
echo -e "${YELLOW}⏳ Waiting for BlackRoad OS pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=blackroad-os -n blackroad-os --timeout=300s
echo -e "${GREEN}✓ BlackRoad OS pods are ready!${NC}"
echo ""

# Step 2: Deploy MQTT Broker
echo -e "${GREEN}✓ Step 2: Deploying MQTT Broker...${NC}"
kubectl apply -f mqtt-broker-deployment.yaml
echo ""

echo -e "${YELLOW}⏳ Waiting for MQTT broker to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=mosquitto -n blackroad-mqtt --timeout=300s
echo -e "${GREEN}✓ MQTT Broker is ready!${NC}"
echo ""

# Step 3: Deploy Multicloud Orchestrator
echo -e "${GREEN}✓ Step 3: Deploying Multicloud Orchestrator...${NC}"
kubectl apply -f multicloud-orchestrator.yaml
echo ""

echo -e "${YELLOW}⏳ Waiting for orchestrator to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=orchestrator -n blackroad-multicloud --timeout=300s
echo -e "${GREEN}✓ Multicloud Orchestrator is ready!${NC}"
echo ""

# Step 4: Deploy SQTT Quantum Layer
echo -e "${GREEN}✓ Step 4: Deploying SQTT Quantum Layer...${NC}"
kubectl apply -f sqtt-quantum-layer.yaml
echo ""

echo -e "${YELLOW}⏳ Waiting for quantum processors to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=sqtt-processor -n blackroad-sqtt --timeout=300s
echo -e "${GREEN}✓ SQTT Quantum Layer is active!${NC}"
echo ""

# Step 5: Deploy Edge Devices
echo -e "${GREEN}✓ Step 5: Deploying Edge Device Infrastructure...${NC}"
kubectl apply -f edge-devices-daemonset.yaml
echo ""

echo -e "${YELLOW}⏳ Waiting for edge agents to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=edge-agent -n blackroad-edge --timeout=300s
echo -e "${GREEN}✓ Edge Device Infrastructure is ready!${NC}"
echo ""

# Display deployment summary
echo -e "${BLUE}=================================================="
echo "🎉 Deployment Complete!"
echo "==================================================${NC}"
echo ""

echo -e "${GREEN}📊 Deployment Summary:${NC}"
echo ""

echo "🌐 BlackRoad OS:"
OS_SERVICE=$(kubectl get svc blackroad-os-service -n blackroad-os -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending...")
echo "   Service IP: $OS_SERVICE"
echo "   URL: https://blackroad.io"
echo "   Pods: $(kubectl get pods -n blackroad-os -l app=blackroad-os --no-headers | wc -l)"
echo ""

echo "📡 MQTT Broker:"
MQTT_SERVICE=$(kubectl get svc mosquitto-mqtt -n blackroad-mqtt -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending...")
echo "   Service IP: $MQTT_SERVICE"
echo "   Port: 1883 (MQTT), 9001 (WebSocket)"
echo "   Pods: $(kubectl get pods -n blackroad-mqtt -l app=mosquitto --no-headers | wc -l)"
echo ""

echo "🌀 Multicloud Orchestrator:"
CLOUD_SERVICE=$(kubectl get svc multicloud-orchestrator -n blackroad-multicloud -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending...")
echo "   Service IP: $CLOUD_SERVICE"
echo "   Pods: $(kubectl get pods -n blackroad-multicloud -l app=orchestrator --no-headers | wc -l)"
echo ""

echo "⚛️  SQTT Quantum Layer:"
QUANTUM_SERVICE=$(kubectl get svc sqtt-api-gateway -n blackroad-sqtt -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending...")
echo "   Service IP: $QUANTUM_SERVICE"
echo "   Quantum Processors: $(kubectl get pods -n blackroad-sqtt -l app=sqtt-processor --no-headers | wc -l)"
echo "   Entanglement Nodes: $(kubectl get pods -n blackroad-sqtt -l app=entanglement-node --no-headers | wc -l)"
echo ""

echo "🔌 Edge Devices:"
echo "   alice (192.168.4.49) - Raspberry Pi 5"
echo "   aria (192.168.4.64) - Raspberry Pi 5"
echo "   octavia (192.168.4.74) - Raspberry Pi"
echo "   lucidia (192.168.4.38) - Raspberry Pi"
echo "   shellfish (174.138.44.45) - DigitalOcean Droplet"
echo "   Edge Agents: $(kubectl get pods -n blackroad-edge -l app=edge-agent --no-headers | wc -l)"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Configure DNS: Point blackroad.io to $OS_SERVICE"
echo "2. Set up SSL certificates"
echo "3. Deploy to edge devices: ./deploy-to-edge.sh"
echo "4. Monitor quantum state: kubectl logs -f -n blackroad-sqtt -l app=sqtt-processor"
echo "5. View MQTT topics: mosquitto_sub -h $MQTT_SERVICE -t 'blackroad/#' -v"
echo ""

echo -e "${GREEN}✨ BlackRoad OS is now running across K8s, multicloud, SQTT, and edge devices!${NC}"
echo ""
