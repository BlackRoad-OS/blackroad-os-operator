# Octavia Setup Complete - Pironman Pi 5

**Date:** 2025-12-26  
**Node:** octavia  
**IP:** 192.168.4.74  
**Hardware:** Raspberry Pi 5 in Pironman 5 Max case  

## ✅ Completed Setup

### 1. Storage Configuration
- **NVMe Drive:** 931.5GB Crucial P310 SSD
- **Partition:** `/dev/nvme0n1p1` formatted as ext4
- **Mount Point:** `/mnt/nvme` (916GB available)
- **Auto-mount:** Configured in `/etc/fstab` with UUID

### 2. Pironman 5 Max Installation
- **Software:** pironman5 v1.2.22
- **Service:** Active and enabled (systemd)
- **Dashboard:** http://192.168.4.74:34001
- **OLED Display:** Enabled, showing system stats
- **RGB LEDs:** Set to BlackRoad purple (#7700FF) with breathing effect
- **Cooling:** GPIO fan on pin 6, automatic control
- **Database:** InfluxDB running for metrics collection

### 3. Docker Installation
- **Version:** Docker 29.1.3
- **User Access:** pi user added to docker group
- **Auto-start:** Enabled via systemd
- **Storage:** Containers will use NVMe drive

### 4. BlackRoad Node Identity
- **Node Name:** octavia
- **Role:** compute
- **Mesh:** pi-cluster
- **Storage Structure:**
  ```
  /mnt/nvme/blackroad/
  ├── containers/  (symlink: ~/containers)
  ├── data/        (symlink: ~/data)
  ├── logs/
  └── backups/
  ```

### 5. Custom Environment
- **Prompt:** BlackRoad-themed purple prompt with 🖤🛣️
- **Aliases:**
  - `br-status` - Quick node health check
  - `br-dashboard` - Show Pironman dashboard URL
  - `br-temp` - Display Pironman config
- **Environment Variables:**
  - `BLACKROAD_NODE=octavia`
  - `BLACKROAD_ROLE=compute`
  - `BLACKROAD_MESH=pi-cluster`

## Quick Access

```bash
# SSH to octavia
ssh pi@192.168.4.74

# View Pironman dashboard
open http://192.168.4.74:34001

# Check node status (from octavia)
br-status

# View storage
df -h /mnt/nvme
```

## System Specifications

| Component | Details |
|-----------|---------|
| **CPU** | Raspberry Pi 5 (4-core ARM) |
| **RAM** | 8GB |
| **Boot Storage** | 119GB SD Card (mmcblk0) |
| **NVMe Storage** | 931.5GB Crucial P310 SSD |
| **Network** | WiFi (192.168.4.74) + Ethernet |
| **Case** | Pironman 5 Max with OLED, RGB, active cooling |
| **OS** | Debian GNU/Linux (kernel 6.12.47) |

## Services Running

- ✅ SSH (port 22)
- ✅ Pironman Dashboard (port 34001)
- ✅ InfluxDB (Pironman metrics)
- ✅ Docker daemon
- ✅ OLED display driver
- ✅ RGB LED controller
- ✅ Temperature monitoring & fan control

## Next Steps

- [ ] Deploy BlackRoad agents/services
- [ ] Set up Tailscale mesh networking
- [ ] Configure monitoring integration
- [ ] Add to Kubernetes cluster (k3s)
- [ ] Set up automated backups to NVMe

## Troubleshooting

**Pironman not showing stats:**
```bash
sudo systemctl restart pironman5
```

**RGB LEDs not working:**
```bash
sudo pironman5 -rc 7700FF -rs breathing restart
```

**Docker permission issues:**
```bash
# Log out and back in for group changes to take effect
exit
ssh pi@192.168.4.74
```

---

**Documentation:** https://github.com/BlackRoad-OS/blackroad-os-operator/blob/main/OCTAVIA_SETUP.md  
**Pironman Docs:** https://docs.sunfounder.com/projects/pironman5/
