# BlackRoad OS - Kubernetes Infrastructure

Complete K8s deployment for BlackRoad OS with multicloud orchestration, SQTT quantum layer, and edge device integration.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BlackRoad OS Infrastructure                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐       │
│  │   K8s Cluster │  │  Cloudflare  │  │  DigitalOcean  │       │
│  │   (Main OS)   │  │   (Pages)    │  │   (Droplet)    │       │
│  └───────────────┘  └──────────────┘  └────────────────┘       │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                │
│                             │                                    │
│                   ┌─────────┴─────────┐                         │
│                   │  Multicloud       │                         │
│                   │  Orchestrator     │                         │
│                   └─────────┬─────────┘                         │
│                             │                                    │
│          ┌──────────────────┼──────────────────┐               │
│          │                  │                  │                │
│   ┌──────┴──────┐    ┌─────┴─────┐    ┌──────┴──────┐         │
│   │    MQTT     │    │   SQTT    │    │    Edge     │         │
│   │   Broker    │    │  Quantum  │    │   Devices   │         │
│   └──────┬──────┘    └─────┬─────┘    └──────┬──────┘         │
│          │                  │                  │                │
│   ┌──────┴──────────────────┴──────────────────┴──────┐        │
│   │                                                     │        │
│   │  alice    aria    octavia    lucidia   shellfish   │        │
│   │  (Pi 5)   (Pi 5)   (Pi)       (Pi)      (DO)      │        │
│   │  .49      .64      .74        .38      44.45       │        │
│   │                                                     │        │
│   │  ┌─────────────────────────────────────────────┐  │        │
│   │  │         Tailscale Mesh Network              │  │        │
│   │  │      alexa-louise.taile5d081.ts.net         │  │        │
│   │  └─────────────────────────────────────────────┘  │        │
│   └─────────────────────────────────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Components

### 1. BlackRoad OS Core (`blackroad-os-deployment.yaml`)
- **Namespace**: `blackroad-os`
- **Deployment**: Web application with 3+ replicas
- **HPA**: Autoscaling from 3 to 30,000 replicas
- **Service**: LoadBalancer on port 80/443
- **Scaling Triggers**: CPU (70%), Memory (80%), HTTP Requests (1000/s)

### 2. MQTT Broker (`mqtt-broker-deployment.yaml`)
- **Namespace**: `blackroad-mqtt`
- **Broker**: Eclipse Mosquitto 2.0
- **Replicas**: 3 (StatefulSet)
- **Ports**: 1883 (MQTT), 8883 (MQTT-TLS), 9001 (WebSocket)
- **Bridges**: alice, aria, octavia, lucidia edge devices
- **Topics**:
  - `blackroad/{device}/#` - Device-specific
  - `blackroad/sqtt/quantum/#` - Quantum communication
  - `blackroad/cloud/{provider}/sync` - Cloud sync

### 3. Multicloud Orchestrator (`multicloud-orchestrator.yaml`)
- **Namespace**: `blackroad-multicloud`
- **Replicas**: 3
- **Services**:
  - Cloudflare Pages sync (every 5 minutes)
  - GitHub webhook receiver
  - Edge device sync controller
  - HAProxy load balancer
- **Domains**: blackroad.io, blackroadai.com, blackroadquantum.com, lucidia.earth

### 4. SQTT Quantum Layer (`sqtt-quantum-layer.yaml`)
- **Namespace**: `blackroad-sqtt`
- **Components**:
  - Quantum Processor (3 replicas)
  - Entanglement Nodes (4 StatefulSet)
  - Quantum Teleportation Service (2 replicas)
  - Quantum-Classical Bridge (2 replicas)
  - API Gateway (3 replicas)
- **Configuration**:
  - Quantum Mode: Superposition
  - Qubit Count: 1024
  - Coherence Time: 10s
  - Dimensions: 11
  - Edge Entanglement: alice, aria, octavia, lucidia

### 5. Edge Devices (`edge-devices-daemonset.yaml`)
- **Namespace**: `blackroad-edge`
- **DaemonSet**: Runs on every K8s node
- **Devices**:
  - **alice** (192.168.4.49) - Raspberry Pi 5 - Compute
  - **aria** (192.168.4.64) - Raspberry Pi 5 - Compute
  - **octavia** (192.168.4.74) - Raspberry Pi - Storage (1TB)
  - **lucidia** (192.168.4.38) - Raspberry Pi - Gateway (Tailscale)
  - **shellfish** (174.138.44.45) - DigitalOcean Droplet
- **Tailscale**: alexa-louise.taile5d081.ts.net (100.95.120.67)

## 🚀 Deployment

### Prerequisites

1. **Kubernetes Cluster**
   ```bash
   # Verify kubectl is installed
   kubectl version

   # Check cluster connection
   kubectl cluster-info
   ```

2. **Edge Devices** (Raspberry Pi)
   - SSH access enabled
   - Network connectivity (192.168.4.x)
   - Sufficient storage (recommend 32GB+ SD cards)

3. **Domain Configuration**
   - DNS records pointing to LoadBalancer IPs
   - SSL certificates configured

### Quick Start

```bash
# 1. Deploy everything to K8s cluster
cd /Users/alexa/projects/blackroad-os-operator/k8s
chmod +x deploy-all.sh
./deploy-all.sh

# 2. Deploy to edge devices (Raspberry Pi cluster)
chmod +x deploy-to-edge.sh
./deploy-to-edge.sh
```

### Step-by-Step Deployment

#### 1. Deploy BlackRoad OS
```bash
kubectl apply -f blackroad-os-deployment.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=blackroad-os -n blackroad-os --timeout=300s

# Check status
kubectl get pods -n blackroad-os
kubectl get svc -n blackroad-os
```

#### 2. Deploy MQTT Broker
```bash
kubectl apply -f mqtt-broker-deployment.yaml

# Wait for broker to be ready
kubectl wait --for=condition=ready pod -l app=mosquitto -n blackroad-mqtt --timeout=300s

# Get MQTT broker IP
kubectl get svc mosquitto-mqtt -n blackroad-mqtt
```

#### 3. Deploy Multicloud Orchestrator
```bash
kubectl apply -f multicloud-orchestrator.yaml

# Wait for orchestrator
kubectl wait --for=condition=ready pod -l app=orchestrator -n blackroad-multicloud --timeout=300s

# Check orchestrator status
kubectl get pods -n blackroad-multicloud
```

#### 4. Deploy SQTT Quantum Layer
```bash
kubectl apply -f sqtt-quantum-layer.yaml

# Wait for quantum processors
kubectl wait --for=condition=ready pod -l app=sqtt-processor -n blackroad-sqtt --timeout=300s

# Check quantum state
kubectl logs -f -n blackroad-sqtt -l app=sqtt-processor
```

#### 5. Deploy Edge Device Infrastructure
```bash
kubectl apply -f edge-devices-daemonset.yaml

# Wait for edge agents
kubectl wait --for=condition=ready pod -l app=edge-agent -n blackroad-edge --timeout=300s

# Check edge agents
kubectl get pods -n blackroad-edge -o wide
```

## 🔧 Configuration

### Update Edge Device IPs

Edit `edge-devices-daemonset.yaml`:
```yaml
data:
  ALICE_IP: "192.168.4.49"      # Update to your alice IP
  ARIA_IP: "192.168.4.64"       # Update to your aria IP
  OCTAVIA_IP: "192.168.4.74"    # Update to your octavia IP
  LUCIDIA_IP: "192.168.4.38"    # Update to your lucidia IP
```

### Configure MQTT Bridges

Edit `mqtt-broker-deployment.yaml`:
```conf
# Bridge to edge devices
connection alice
address 192.168.4.49:1883      # Update to your alice IP
topic blackroad/alice/# both 0
```

### Adjust Autoscaling

Edit `blackroad-os-deployment.yaml`:
```yaml
spec:
  minReplicas: 3          # Minimum pods
  maxReplicas: 30000      # Maximum pods (adjust based on capacity)
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70   # Adjust threshold
```

## 📊 Monitoring

### Check Pod Status
```bash
# All namespaces
kubectl get pods --all-namespaces

# Specific namespace
kubectl get pods -n blackroad-os
kubectl get pods -n blackroad-mqtt
kubectl get pods -n blackroad-multicloud
kubectl get pods -n blackroad-sqtt
kubectl get pods -n blackroad-edge
```

### View Logs
```bash
# BlackRoad OS logs
kubectl logs -f -n blackroad-os -l app=blackroad-os

# MQTT broker logs
kubectl logs -f -n blackroad-mqtt -l app=mosquitto

# Quantum processor logs
kubectl logs -f -n blackroad-sqtt -l app=sqtt-processor

# Edge agent logs (on device)
ssh pi@192.168.4.49 'sudo journalctl -u edge-agent -f'
```

### Monitor MQTT Traffic
```bash
# Get MQTT broker IP
MQTT_IP=$(kubectl get svc mosquitto-mqtt -n blackroad-mqtt -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Subscribe to all topics
mosquitto_sub -h $MQTT_IP -t 'blackroad/#' -v

# Subscribe to device-specific topics
mosquitto_sub -h $MQTT_IP -t 'blackroad/alice/#' -v

# Subscribe to quantum topics
mosquitto_sub -h $MQTT_IP -t 'blackroad/sqtt/quantum/#' -v
```

### Check Autoscaling
```bash
# View HPA status
kubectl get hpa -n blackroad-os

# Watch HPA in real-time
kubectl get hpa -n blackroad-os -w

# Describe HPA
kubectl describe hpa blackroad-os-hpa -n blackroad-os
```

## 🔍 Troubleshooting

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check resource constraints
kubectl top nodes
kubectl top pods -n <namespace>
```

### MQTT Connection Issues
```bash
# Test MQTT connection
mosquitto_pub -h <mqtt-ip> -t 'test' -m 'hello'

# Check MQTT broker logs
kubectl logs -f -n blackroad-mqtt -l app=mosquitto

# Verify edge device connectivity
ping 192.168.4.49  # alice
ping 192.168.4.64  # aria
```

### Edge Device Issues
```bash
# SSH to device
ssh pi@192.168.4.49

# Check edge agent status
sudo systemctl status edge-agent

# View edge agent logs
sudo journalctl -u edge-agent -f

# Restart edge agent
sudo systemctl restart edge-agent
```

### Quantum Layer Issues
```bash
# Check quantum processor logs
kubectl logs -f -n blackroad-sqtt -l app=sqtt-processor

# Check entanglement nodes
kubectl get pods -n blackroad-sqtt -l app=entanglement-node

# Verify quantum metrics
kubectl get configmap quantum-metrics -n blackroad-sqtt -o yaml
```

## 🌐 Accessing Services

### BlackRoad OS
```bash
# Get LoadBalancer IP
kubectl get svc blackroad-os-service -n blackroad-os

# Access via domain
open https://blackroad.io
```

### MQTT Broker
```bash
# Get MQTT LoadBalancer IP
kubectl get svc mosquitto-mqtt -n blackroad-mqtt

# MQTT: port 1883
# MQTT-TLS: port 8883
# WebSocket: port 9001
```

### Multicloud Orchestrator
```bash
# Get orchestrator IP
kubectl get svc multicloud-orchestrator -n blackroad-multicloud

# HTTP: port 8080
# Metrics: port 9090
```

### SQTT API Gateway
```bash
# Get quantum API IP
kubectl get svc sqtt-api-gateway -n blackroad-sqtt

# HTTPS: port 443
# HTTP: port 80
```

## 📈 Scaling

### Manual Scaling
```bash
# Scale BlackRoad OS
kubectl scale deployment blackroad-os-web -n blackroad-os --replicas=10

# Scale MQTT broker
kubectl scale statefulset mosquitto-broker -n blackroad-mqtt --replicas=5

# Scale quantum processors
kubectl scale deployment sqtt-quantum-processor -n blackroad-sqtt --replicas=5
```

### Autoscaling
```bash
# Update HPA min/max replicas
kubectl patch hpa blackroad-os-hpa -n blackroad-os -p '{"spec":{"minReplicas":5,"maxReplicas":50000}}'

# Disable autoscaling
kubectl delete hpa blackroad-os-hpa -n blackroad-os

# Re-enable autoscaling
kubectl apply -f blackroad-os-deployment.yaml
```

## 🔐 Security

### Network Policies
```bash
# View network policies
kubectl get networkpolicy -n blackroad-sqtt

# Quantum isolation policy restricts access to quantum-labeled pods only
```

### Secrets Management
```bash
# Create MQTT password
kubectl create secret generic mqtt-passwords -n blackroad-mqtt \
  --from-literal=password=$(openssl rand -base64 32)

# Create GitHub webhook secret
kubectl create secret generic github-secrets -n blackroad-multicloud \
  --from-literal=webhook-secret=$(openssl rand -base64 32)
```

## 📝 Maintenance

### Update Deployments
```bash
# Update image version
kubectl set image deployment/blackroad-os-web \
  blackroad-os=blackroad/os:v2.0 \
  -n blackroad-os

# Restart deployment
kubectl rollout restart deployment/blackroad-os-web -n blackroad-os

# Check rollout status
kubectl rollout status deployment/blackroad-os-web -n blackroad-os
```

### Backup
```bash
# Backup all manifests
kubectl get all --all-namespaces -o yaml > backup.yaml

# Backup specific namespace
kubectl get all -n blackroad-os -o yaml > blackroad-os-backup.yaml

# Backup persistent volumes
kubectl get pv,pvc --all-namespaces -o yaml > volumes-backup.yaml
```

### Cleanup
```bash
# Delete everything
kubectl delete -f blackroad-os-deployment.yaml
kubectl delete -f mqtt-broker-deployment.yaml
kubectl delete -f multicloud-orchestrator.yaml
kubectl delete -f sqtt-quantum-layer.yaml
kubectl delete -f edge-devices-daemonset.yaml

# Delete specific namespace
kubectl delete namespace blackroad-os
```

## 🎯 Next Steps

1. **Configure DNS**: Point domains to LoadBalancer IPs
2. **SSL Certificates**: Install cert-manager and configure Let's Encrypt
3. **Monitoring**: Deploy Prometheus + Grafana
4. **Logging**: Deploy ELK stack or Loki
5. **CI/CD**: Set up GitHub Actions for automated deployments
6. **Backups**: Schedule automated backups to S3/GCS

## 📚 Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Eclipse Mosquitto](https://mosquitto.org/)
- [K3s (Lightweight Kubernetes)](https://k3s.io/)
- [Tailscale Mesh Networks](https://tailscale.com/)
- [BlackRoad OS Documentation](https://blackroad.io/docs)

## 🤝 Support

- Email: blackroad.systems@gmail.com
- GitHub: https://github.com/BlackRoad-OS
- Issues: https://github.com/BlackRoad-OS/blackroad-os-operator/issues

---

**Built with ❤️ by the BlackRoad OS Team**

*Powered by Kubernetes, MQTT, and Quantum Technology*
