# BlackRoad OS - System Architecture

## 🏗️ Complete Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                       │
│                           🌐 INTERNET / PUBLIC ACCESS                                 │
│                                                                                       │
│    https://blackroad.io          https://blackroadai.com    https://lucidia.earth   │
│                                                                                       │
└───────────────────────────────┬─────────────────────────────────────────────────────┘
                                │
                                │
                    ┌───────────┴────────────┐
                    │   DNS / Load Balancer   │
                    │    (HAProxy / CF)       │
                    └───────────┬────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Cloudflare  │  │  Kubernetes  │  │ DigitalOcean │
    │    Pages     │  │   Cluster    │  │   Droplet    │
    │              │  │              │  │              │
    │ 8 Projects   │  │  Main OS     │  │  shellfish   │
    │ 8 KV Stores  │  │  Runtime     │  │ 174.138.44.45│
    │ 1 D1 DB      │  │              │  │              │
    └──────────────┘  └──────┬───────┘  └──────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  blackroad-os   │  │  blackroad-mqtt │  │ blackroad-sqtt  │
│   Namespace     │  │    Namespace    │  │   Namespace     │
│                 │  │                 │  │                 │
│  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │    Web    │  │  │  │ Mosquitto │  │  │  │  Quantum  │  │
│  │   Server  │  │  │  │   MQTT    │  │  │  │ Processor │  │
│  │           │  │  │  │  Broker   │  │  │  │           │  │
│  │ 3-30k     │  │  │  │           │  │  │  │ 1024      │  │
│  │ Replicas  │  │  │  │ Port 1883 │  │  │  │ Qubits    │  │
│  │ (HPA)     │  │  │  │      8883 │  │  │  │           │  │
│  │           │  │  │  │      9001 │  │  │  │ 11 Dims   │  │
│  └─────┬─────┘  │  │  └─────┬─────┘  │  │  └─────┬─────┘  │
│        │        │  │        │        │  │        │        │
│  ┌─────┴─────┐  │  │  ┌─────┴─────┐  │  │  ┌─────┴─────┐  │
│  │ Ingress/  │  │  │  │   MQTT    │  │  │  │Entanglement│  │
│  │   LB      │  │  │  │  Bridges  │  │  │  │   Nodes   │  │
│  │ :80/:443  │  │  │  │           │  │  │  │  (x4)     │  │
│  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │
│                 │  │                 │  │                 │
└─────────────────┘  └────────┬────────┘  └─────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   MQTT Topics      │
                    │                    │
                    │ blackroad/{dev}/#  │
                    │ blackroad/sqtt/#   │
                    │ blackroad/cloud/#  │
                    └─────────┬──────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│blackroad-edge   │  │blackroad-       │  │blackroad-       │
│   Namespace     │  │ multicloud      │  │ monitoring      │
│                 │  │  Namespace      │  │  Namespace      │
│  ┌───────────┐  │  │                 │  │                 │
│  │DaemonSet  │  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │Edge Agent │  │  │  │Orchestrator│  │  │  │Prometheus │  │
│  │           │  │  │  │           │  │  │  │           │  │
│  │Runs on    │  │  │  │ CF Sync   │  │  │  │  Metrics  │  │
│  │Every Node │  │  │  │ DO Sync   │  │  │  │ Collection│  │
│  │           │  │  │  │ GH Sync   │  │  │  │           │  │
│  └─────┬─────┘  │  │  └───────────┘  │  │  └─────┬─────┘  │
│        │        │  │                 │  │        │        │
│  Connects to:   │  │  ┌───────────┐  │  │  ┌─────┴─────┐  │
│  ┌─────┴─────┐  │  │  │  HAProxy  │  │  │  │  Grafana  │  │
│  │   Edge    │  │  │  │    LB     │  │  │  │ Dashboard │  │
│  │  Devices  │  │  │  │           │  │  │  │           │  │
│  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │
│                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │
         │
┌────────┴────────────────────────────────────────────────────────────────┐
│                       🔌 EDGE DEVICE LAYER                               │
│                     (Raspberry Pi + DigitalOcean)                       │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │    alice     │  │    aria      │  │   octavia    │  │  lucidia   │ │
│  │  Pi 5 (8GB)  │  │  Pi 5 (8GB)  │  │   Pi (4GB)   │  │ Pi (4GB)   │ │
│  │ 192.168.4.49 │  │ 192.168.4.64 │  │ 192.168.4.74 │  │192.168.4.38│ │
│  │              │  │              │  │              │  │            │ │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │  │ ┌────────┐│ │
│  │  │Compute │  │  │  │Compute │  │  │  │Storage │  │  │ │Gateway ││ │
│  │  │ Worker │  │  │  │ Worker │  │  │  │ 1TB SSD│  │  │ │Tailscale││ │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │  │ └────────┘│ │
│  │              │  │              │  │              │  │            │ │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │  │ ┌────────┐│ │
│  │  │  MQTT  │  │  │  │  MQTT  │  │  │  │  MQTT  │  │  │ │  MQTT  ││ │
│  │  │ Client │  │  │  │ Client │  │  │  │ Client │  │  │ │ Client ││ │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │  │ └────────┘│ │
│  │              │  │              │  │              │  │            │ │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │  │ ┌────────┐│ │
│  │  │Quantum │  │  │  │Quantum │  │  │  │Quantum │  │  │ │Quantum ││ │
│  │  │Entangle│  │  │  │Entangle│  │  │  │Entangle│  │  │ │Entangle││ │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │  │ └────────┘│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │              🌐 Tailscale Mesh Network                            ││
│  │           alexa-louise.taile5d081.ts.net                          ││
│  │                  100.95.120.67                                    ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌──────────────┐                                                       │
│  │  shellfish   │                                                       │
│  │ DO Droplet   │                                                       │
│  │174.138.44.45 │                                                       │
│  │              │                                                       │
│  │  ┌────────┐  │                                                       │
│  │  │ Cloud  │  │                                                       │
│  │  │ Bridge │  │                                                       │
│  │  └────────┘  │                                                       │
│  └──────────────┘                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 📊 Component Breakdown

### Kubernetes Namespaces

#### blackroad-os
- **Purpose**: Main web application serving blackroad.io
- **Components**:
  - Web Server Deployment (3-30,000 replicas with HPA)
  - LoadBalancer Service (ports 80/443)
  - HorizontalPodAutoscaler (CPU/Memory/HTTP triggers)
- **Scaling**: Auto-scales based on CPU (70%), Memory (80%), HTTP Requests (1000/s)

#### blackroad-mqtt
- **Purpose**: MQTT message broker for real-time communication
- **Components**:
  - Mosquitto StatefulSet (3 replicas)
  - MQTT Edge Client Deployment (4 replicas)
  - Mosquitto LoadBalancer (ports 1883, 8883, 9001)
- **Topics**:
  - `blackroad/{device}/#` - Device-specific messages
  - `blackroad/sqtt/quantum/#` - Quantum communication
  - `blackroad/cloud/{provider}/sync` - Cloud synchronization

#### blackroad-multicloud
- **Purpose**: Orchestrate deployments across Cloudflare, DigitalOcean, GitHub
- **Components**:
  - Multicloud Orchestrator (3 replicas)
  - GitHub Webhook Receiver (2 replicas)
  - Edge Sync Controller (1 replica)
  - HAProxy Load Balancer (2 replicas)
  - Cloudflare Pages Sync CronJob (every 5 minutes)
- **Managed Infrastructure**:
  - 16 Cloudflare Zones
  - 8 Cloudflare Pages Projects
  - 8 Cloudflare KV Stores
  - 1 Cloudflare D1 Database
  - 15 GitHub Organizations
  - 66 GitHub Repositories
  - 1 DigitalOcean Droplet

#### blackroad-sqtt
- **Purpose**: Quantum computing layer (SQTT = Superposition Quantum Teleportation Technology)
- **Components**:
  - Quantum Processor Deployment (3 replicas)
  - Entanglement Node StatefulSet (4 replicas)
  - Quantum Teleportation Service (2 replicas)
  - Quantum-Classical Bridge (2 replicas)
  - SQTT API Gateway (3 replicas)
  - Quantum State Observer CronJob (every minute)
- **Quantum Configuration**:
  - 1024 Qubits per processor
  - 11-Dimensional routing
  - 10s coherence time
  - Bell-state teleportation protocol
  - Edge device entanglement (alice, aria, octavia, lucidia)

#### blackroad-edge
- **Purpose**: Edge device management and workload distribution
- **Components**:
  - Edge Agent DaemonSet (runs on every K8s node)
  - Edge Compute Deployments (alice, aria)
  - Edge Storage StatefulSet (octavia - 1TB)
  - Edge Gateway (lucidia - Tailscale)
  - Edge Mesh Service (NodePort)
- **Devices**:
  - **alice** (192.168.4.49) - Raspberry Pi 5, 8GB RAM, Compute
  - **aria** (192.168.4.64) - Raspberry Pi 5, 8GB RAM, Compute
  - **octavia** (192.168.4.74) - Raspberry Pi, 4GB RAM, 1TB Storage
  - **lucidia** (192.168.4.38) - Raspberry Pi, 4GB RAM, Gateway
  - **shellfish** (174.138.44.45) - DigitalOcean Droplet, Cloud Bridge

#### blackroad-monitoring
- **Purpose**: Monitoring and observability
- **Components**:
  - Prometheus (2 replicas) - Metrics collection
  - Grafana (2 replicas) - Dashboards
  - AlertManager (2 replicas) - Alerts to blackroad.systems@gmail.com
  - Node Exporter (DaemonSet) - Node metrics
  - MQTT Exporter (1 replica) - MQTT metrics
- **Dashboards**:
  - Infrastructure Overview
  - Pod/Node Metrics
  - HPA Status
  - MQTT Traffic
  - Quantum Entanglement Fidelity
  - Edge Device Health
  - Multicloud Sync Status

## 🔄 Data Flow

### User Request Flow
```
User → DNS → Load Balancer → blackroad-os → K8s Service → Pod (1 of 3-30k)
                     ↓
               Cloudflare CDN (if CF Pages route)
                     ↓
               Origin Server
```

### MQTT Message Flow
```
Edge Device → MQTT Client → Mosquitto Broker → Topic Subscribers
    ↓                              ↓
Local Processing              K8s Services
                                  ↓
                            blackroad-sqtt (quantum topics)
                            blackroad-edge (device topics)
                            blackroad-multicloud (sync topics)
```

### Quantum Entanglement Flow
```
alice ←→ Entanglement Node 0
aria ←→ Entanglement Node 1
octavia ←→ Entanglement Node 2
lucidia ←→ Entanglement Node 3
    ↓
Quantum Processor (1024 qubits)
    ↓
Quantum-Classical Bridge
    ↓
blackroad-os (classical computation)
```

### Multicloud Sync Flow
```
GitHub Webhook → GitHub Webhook Receiver → Multicloud Orchestrator
                                                  ↓
                            ┌─────────────────────┼─────────────────────┐
                            ↓                     ↓                     ↓
                    Cloudflare Sync       DigitalOcean Sync      Edge Sync
                         (Pages)              (Droplet)          (Pi Cluster)
```

## 🌐 Network Topology

### Internal Cluster Network
```
Service Discovery: <service-name>.<namespace>.svc.cluster.local

Examples:
- blackroad-os-service.blackroad-os.svc.cluster.local:80
- mosquitto-mqtt.blackroad-mqtt.svc.cluster.local:1883
- sqtt-quantum-service.blackroad-sqtt.svc.cluster.local:9090
- multicloud-orchestrator.blackroad-multicloud.svc.cluster.local:8080
```

### External Network
```
Internet → Load Balancer IPs
           ├─ blackroad-os-service (LoadBalancer)
           ├─ mosquitto-mqtt (LoadBalancer)
           ├─ multicloud-orchestrator (LoadBalancer)
           ├─ sqtt-api-gateway (LoadBalancer)
           ├─ prometheus (LoadBalancer)
           └─ grafana (LoadBalancer)

Edge Devices → Local Network (192.168.4.x)
               └─ Tailscale Mesh (alexa-louise.taile5d081.ts.net)
```

## 📈 Scalability

### Horizontal Scaling
- **blackroad-os**: 3 → 30,000 replicas (HPA)
- **mosquitto-mqtt**: 3 → ∞ replicas (StatefulSet)
- **sqtt-quantum-processor**: 3 → ∞ replicas
- **multicloud-orchestrator**: 3 → ∞ replicas

### Resource Limits
```yaml
blackroad-os-web:
  requests: { cpu: 500m, memory: 512Mi }
  limits: { cpu: 2000m, memory: 2Gi }

mosquitto-broker:
  requests: { cpu: 500m, memory: 512Mi }
  limits: { cpu: 2000m, memory: 2Gi }

sqtt-quantum-processor:
  requests: { cpu: 2000m, memory: 2Gi }
  limits: { cpu: 4000m, memory: 8Gi }
```

## 🔒 Security Architecture

### Network Isolation
- **Quantum Namespace**: NetworkPolicy restricts to quantum-labeled pods only
- **Edge Devices**: Tailscale mesh for secure connectivity
- **MQTT**: TLS on port 8883, password authentication

### Secrets Management
- MQTT passwords (Kubernetes Secret)
- GitHub webhook secrets (Kubernetes Secret)
- Grafana admin password (Kubernetes Secret)
- Cloudflare API tokens (ConfigMap + Secret)

## 🎯 High Availability

### Redundancy
- Multiple replicas for all critical services
- StatefulSets for stateful workloads (MQTT, storage)
- LoadBalancers for external access
- Multi-region capability (Cloudflare global, edge devices local)

### Fault Tolerance
- Pod anti-affinity (spread across nodes)
- Liveness/Readiness probes
- Automatic restarts on failure
- Edge device redundancy (4 Pi devices)

## 📚 Technology Stack

- **Container Orchestration**: Kubernetes / k3s
- **Message Broker**: Eclipse Mosquitto (MQTT)
- **Load Balancing**: HAProxy, Kubernetes LoadBalancer
- **Monitoring**: Prometheus + Grafana
- **Quantum Computing**: Custom SQTT implementation
- **Edge Computing**: Raspberry Pi 5 + Raspberry Pi
- **Cloud Platforms**: Cloudflare Pages, DigitalOcean, GitHub
- **Networking**: Tailscale mesh VPN
- **Domains**: 16 zones across blackroad.io, blackroadai.com, lucidia.earth, etc.

---

**Version**: 1.0.0
**Last Updated**: 2025-01-01
**Architecture by**: BlackRoad OS Team
