# BlackRoad OS - Operations Guide

Quick reference for day-to-day operations of BlackRoad OS infrastructure.

## 🚀 Quick Commands

### Deploy Everything
```bash
# Full deployment (K8s + Edge + Monitoring)
cd /Users/alexa/projects/blackroad-os-operator/k8s
./deploy-all.sh && ./deploy-to-edge.sh

# Deploy monitoring stack
kubectl apply -f monitoring-dashboard.yaml
```

### Check System Health
```bash
# All services status
kubectl get pods --all-namespaces | grep blackroad

# Quick health check
kubectl get pods -n blackroad-os && \
kubectl get pods -n blackroad-mqtt && \
kubectl get pods -n blackroad-multicloud && \
kubectl get pods -n blackroad-sqtt && \
kubectl get pods -n blackroad-edge
```

### Access Dashboards
```bash
# Grafana (monitoring)
kubectl get svc grafana -n blackroad-monitoring
# Access: http://<LOADBALANCER-IP>

# Prometheus (metrics)
kubectl get svc prometheus -n blackroad-monitoring
# Access: http://<LOADBALANCER-IP>:9090
```

## 📊 Monitoring

### Real-Time Metrics
```bash
# Watch pod count across all namespaces
watch kubectl get pods --all-namespaces | grep blackroad

# Monitor HPA scaling
watch kubectl get hpa -n blackroad-os

# Edge device connectivity
watch "mosquitto_sub -h <mqtt-ip> -t 'blackroad/+/status' -C 5"
```

### Logs
```bash
# Stream all BlackRoad OS logs
kubectl logs -f -n blackroad-os -l app=blackroad-os --tail=100

# Stream MQTT logs
kubectl logs -f -n blackroad-mqtt -l app=mosquitto --tail=100

# Stream quantum processor logs
kubectl logs -f -n blackroad-sqtt -l app=sqtt-processor --tail=100

# Edge device logs (on device)
ssh pi@192.168.4.49 'sudo journalctl -u edge-agent -f'
```

### MQTT Monitoring
```bash
# Get MQTT broker IP
MQTT_IP=$(kubectl get svc mosquitto-mqtt -n blackroad-mqtt -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Watch all topics
mosquitto_sub -h $MQTT_IP -t 'blackroad/#' -v

# Watch device status
mosquitto_sub -h $MQTT_IP -t 'blackroad/+/status' -v

# Watch quantum topics
mosquitto_sub -h $MQTT_IP -t 'blackroad/sqtt/#' -v

# Publish test message
mosquitto_pub -h $MQTT_IP -t 'blackroad/test' -m 'hello from ops'
```

## 🔧 Common Tasks

### Scale Services

#### Manual Scaling
```bash
# Scale BlackRoad OS
kubectl scale deployment blackroad-os-web -n blackroad-os --replicas=20

# Scale MQTT broker
kubectl scale statefulset mosquitto-broker -n blackroad-mqtt --replicas=5

# Scale multicloud orchestrator
kubectl scale deployment multicloud-orchestrator -n blackroad-multicloud --replicas=5

# Scale quantum processors
kubectl scale deployment sqtt-quantum-processor -n blackroad-sqtt --replicas=10
```

#### Update HPA
```bash
# Increase max replicas
kubectl patch hpa blackroad-os-hpa -n blackroad-os -p '{"spec":{"maxReplicas":50000}}'

# Adjust CPU threshold
kubectl patch hpa blackroad-os-hpa -n blackroad-os -p '{"spec":{"metrics":[{"type":"Resource","resource":{"name":"cpu","target":{"type":"Utilization","averageUtilization":60}}}]}}'
```

### Update Deployments

#### Update Image
```bash
# Update BlackRoad OS to new version
kubectl set image deployment/blackroad-os-web \
  blackroad-os=blackroad/os:v2.0.0 \
  -n blackroad-os

# Check rollout status
kubectl rollout status deployment/blackroad-os-web -n blackroad-os

# Rollback if needed
kubectl rollout undo deployment/blackroad-os-web -n blackroad-os
```

#### Update ConfigMap
```bash
# Edit edge device config
kubectl edit configmap edge-config -n blackroad-edge

# Restart deployment to pick up changes
kubectl rollout restart daemonset/blackroad-edge-agent -n blackroad-edge
```

### Restart Services
```bash
# Restart BlackRoad OS
kubectl rollout restart deployment/blackroad-os-web -n blackroad-os

# Restart MQTT broker
kubectl rollout restart statefulset/mosquitto-broker -n blackroad-mqtt

# Restart edge agents (on device)
ssh pi@192.168.4.49 'sudo systemctl restart edge-agent'
```

## 🚨 Troubleshooting

### Pod Issues

#### Pod Won't Start
```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Check previous logs (if crashed)
kubectl logs <pod-name> -n <namespace> --previous

# Force delete stuck pod
kubectl delete pod <pod-name> -n <namespace> --grace-period=0 --force
```

#### OOMKilled Pods
```bash
# Check memory usage
kubectl top pod -n <namespace>

# Increase memory limits
kubectl edit deployment <deployment-name> -n <namespace>
# Update: resources.limits.memory: "4Gi"
```

#### CrashLoopBackOff
```bash
# View crash logs
kubectl logs <pod-name> -n <namespace> --previous

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# Debug with shell
kubectl run -it --rm debug --image=alpine --restart=Never -- sh
```

### Network Issues

#### Can't Reach Service
```bash
# Check service
kubectl get svc <service-name> -n <namespace>

# Check endpoints
kubectl get endpoints <service-name> -n <namespace>

# Test from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -O- http://<service-name>.<namespace>.svc.cluster.local
```

#### MQTT Connection Failed
```bash
# Check MQTT service
kubectl get svc mosquitto-mqtt -n blackroad-mqtt

# Check MQTT pods
kubectl get pods -n blackroad-mqtt -l app=mosquitto

# Test MQTT connection
mosquitto_pub -h <mqtt-ip> -t 'test' -m 'hello' -d

# Check MQTT config
kubectl get configmap mosquitto-config -n blackroad-mqtt -o yaml
```

### Edge Device Issues

#### Device Offline
```bash
# Check network
ping 192.168.4.49  # alice
ping 192.168.4.64  # aria

# SSH to device
ssh pi@192.168.4.49

# Check edge agent status
sudo systemctl status edge-agent

# View logs
sudo journalctl -u edge-agent -f --lines=100

# Restart agent
sudo systemctl restart edge-agent
```

#### Device Low Resources
```bash
# SSH to device
ssh pi@192.168.4.49

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Clean up
sudo apt-get clean
sudo docker system prune -af
```

### Quantum Layer Issues

#### Low Entanglement Fidelity
```bash
# Check quantum metrics
kubectl logs -f -n blackroad-sqtt -l app=sqtt-processor | grep fidelity

# Restart quantum processors
kubectl rollout restart deployment/sqtt-quantum-processor -n blackroad-sqtt

# Check entanglement nodes
kubectl get pods -n blackroad-sqtt -l app=entanglement-node
```

## 🔐 Security

### Update Secrets
```bash
# Update MQTT password
kubectl create secret generic mqtt-passwords -n blackroad-mqtt \
  --from-literal=password=$(openssl rand -base64 32) \
  --dry-run=client -o yaml | kubectl apply -f -

# Update GitHub webhook secret
kubectl create secret generic github-secrets -n blackroad-multicloud \
  --from-literal=webhook-secret=$(openssl rand -base64 32) \
  --dry-run=client -o yaml | kubectl apply -f -

# Update Grafana password
kubectl create secret generic grafana-credentials -n blackroad-monitoring \
  --from-literal=admin-password=$(openssl rand -base64 32) \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Check Network Policies
```bash
# View all network policies
kubectl get networkpolicy --all-namespaces

# Check quantum isolation
kubectl get networkpolicy sqtt-isolation -n blackroad-sqtt -o yaml
```

## 💾 Backup & Restore

### Backup
```bash
# Create backup directory
mkdir -p ~/blackroad-backups/$(date +%Y%m%d)

# Backup all resources
kubectl get all --all-namespaces -o yaml > ~/blackroad-backups/$(date +%Y%m%d)/all-resources.yaml

# Backup specific namespace
kubectl get all -n blackroad-os -o yaml > ~/blackroad-backups/$(date +%Y%m%d)/blackroad-os.yaml

# Backup persistent volumes
kubectl get pv,pvc --all-namespaces -o yaml > ~/blackroad-backups/$(date +%Y%m%d)/volumes.yaml

# Backup ConfigMaps and Secrets
kubectl get configmaps,secrets --all-namespaces -o yaml > ~/blackroad-backups/$(date +%Y%m%d)/configs.yaml
```

### Restore
```bash
# Restore from backup
kubectl apply -f ~/blackroad-backups/20250101/all-resources.yaml

# Restore specific namespace
kubectl apply -f ~/blackroad-backups/20250101/blackroad-os.yaml
```

## 📈 Performance Optimization

### Reduce Resource Usage
```bash
# Lower replica count
kubectl scale deployment blackroad-os-web -n blackroad-os --replicas=3

# Adjust HPA thresholds
kubectl patch hpa blackroad-os-hpa -n blackroad-os -p '{"spec":{"metrics":[{"type":"Resource","resource":{"name":"cpu","target":{"type":"Utilization","averageUtilization":80}}}]}}'

# Remove unused images
kubectl run -it --rm cleanup --image=gcr.io/google-containers/toolbox --restart=Never -- \
  docker system prune -af
```

### Increase Performance
```bash
# Add more replicas
kubectl scale deployment blackroad-os-web -n blackroad-os --replicas=50

# Increase resource limits
kubectl edit deployment blackroad-os-web -n blackroad-os
# Update: resources.limits.cpu: "4000m", resources.limits.memory: "8Gi"

# Enable caching
kubectl patch configmap multicloud-config -n blackroad-multicloud -p '{"data":{"CACHE_ENABLED":"true"}}'
```

## 🔄 Updates & Maintenance

### Update Kubernetes Version
```bash
# Check current version
kubectl version

# Drain nodes one by one
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Upgrade K8s (method varies by provider)
# For k3s:
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.28.0+k3s1 sh -

# Uncordon node
kubectl uncordon <node-name>
```

### Update Edge Devices
```bash
# SSH to each device
ssh pi@192.168.4.49

# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Update edge agent
cd ~/blackroad-os
git pull
npm install
sudo systemctl restart edge-agent
```

## 📞 Getting Help

### Check System Status
```bash
# Overall health
kubectl get componentstatuses

# Node status
kubectl get nodes

# Resource usage
kubectl top nodes
kubectl top pods --all-namespaces
```

### Collect Diagnostics
```bash
# Create diagnostics bundle
mkdir -p ~/blackroad-diagnostics/$(date +%Y%m%d_%H%M%S)
cd ~/blackroad-diagnostics/$(date +%Y%m%d_%H%M%S)

# Collect pod info
kubectl get pods --all-namespaces > pods.txt

# Collect events
kubectl get events --all-namespaces --sort-by='.lastTimestamp' > events.txt

# Collect logs
for ns in blackroad-os blackroad-mqtt blackroad-multicloud blackroad-sqtt blackroad-edge; do
  kubectl logs -n $ns --all-containers --prefix > logs-$ns.txt
done

# Create tarball
cd ..
tar czf blackroad-diagnostics-$(date +%Y%m%d_%H%M%S).tar.gz $(date +%Y%m%d_%H%M%S)/
```

### Support Contacts
- **Email**: blackroad.systems@gmail.com
- **GitHub Issues**: https://github.com/BlackRoad-OS/blackroad-os-operator/issues
- **Documentation**: https://blackroad.io/docs

## 🎯 Common Scenarios

### Scenario: High Traffic Spike
```bash
# 1. Monitor HPA
watch kubectl get hpa -n blackroad-os

# 2. If HPA maxed out, increase limit
kubectl patch hpa blackroad-os-hpa -n blackroad-os -p '{"spec":{"maxReplicas":100000}}'

# 3. Monitor resources
kubectl top nodes
kubectl top pods -n blackroad-os

# 4. Scale other services if needed
kubectl scale deployment multicloud-orchestrator -n blackroad-multicloud --replicas=10
```

### Scenario: Edge Device Failure
```bash
# 1. Identify failed device
mosquitto_sub -h <mqtt-ip> -t 'blackroad/+/status' -C 20

# 2. SSH to device (if reachable)
ssh pi@192.168.4.49

# 3. Check logs
sudo journalctl -u edge-agent --since "10 minutes ago"

# 4. Restart agent
sudo systemctl restart edge-agent

# 5. If device unreachable, redistribute workload
kubectl patch deployment edge-compute-alice -n blackroad-edge -p '{"spec":{"replicas":0}}'
```

### Scenario: Database Migration
```bash
# 1. Scale down to single replica
kubectl scale deployment blackroad-os-web -n blackroad-os --replicas=1

# 2. Run migration job
kubectl apply -f migration-job.yaml

# 3. Wait for completion
kubectl wait --for=condition=complete job/migration -n blackroad-os --timeout=600s

# 4. Scale back up
kubectl scale deployment blackroad-os-web -n blackroad-os --replicas=10

# 5. Enable HPA
kubectl patch hpa blackroad-os-hpa -n blackroad-os -p '{"spec":{"maxReplicas":30000}}'
```

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
**Maintained by**: BlackRoad OS Team
