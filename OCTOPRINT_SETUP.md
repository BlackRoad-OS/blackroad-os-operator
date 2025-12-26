# OctoPrint Setup on Octavia

**Date:** 2025-12-26  
**OctoPrint URL:** http://192.168.4.74:5000  
**Storage:** /mnt/nvme/blackroad/octoprint/  

## ✅ Installation Complete

OctoPrint is running in a Docker container on octavia with:
- Web interface on port 5000
- Data stored on 916GB NVMe drive
- Privileged mode for USB device access
- Auto-restart enabled

## 🚀 Quick Start

### 1. Access OctoPrint Web Interface
Open in your browser:
```
http://192.168.4.74:5000
```

### 2. Initial Setup Wizard
On first visit, you'll see the setup wizard:
1. **Create admin account** - Set username/password
2. **Configure printer profile** - Select your printer model or create custom
3. **Connect to printer** - OctoPrint will scan for USB serial devices

### 3. Connect Your 3D Printer
Once the printer USB is detected:
1. Go to the "Connection" panel (top left)
2. Select your printer's serial port (e.g., /dev/ttyUSB0 or /dev/ttyACM0)
3. Select baud rate (usually 115200 or 250000)
4. Click "Connect"

## 📋 Next Steps

**If printer isn't detected:**
```bash
# SSH to octavia
ssh pi@192.168.4.74

# Check for USB devices
lsusb

# Check for serial ports
ls -la /dev/ttyUSB* /dev/ttyACM* 2>/dev/null

# Restart OctoPrint container
docker restart octoprint
```

**Add webcam support:**
```bash
# Plug in USB webcam
# OctoPrint will auto-detect and enable streaming
```

## 🎬 Managing OctoPrint

```bash
# View logs
docker logs octoprint

# Restart
docker restart octoprint

# Stop
docker stop octoprint

# Start
docker start octoprint

# View container status
docker ps | grep octoprint
```

## 📁 Storage Locations

- **Config:** `/mnt/nvme/blackroad/octoprint/config`
- **Uploads:** `/mnt/nvme/blackroad/octoprint/data`
- **Timelapse:** `/mnt/nvme/blackroad/octoprint/data/timelapse`

## 🔧 Troubleshooting

**Printer not connecting:**
- Make sure printer is powered on
- Check USB cable (needs data support, not just power)
- Try different baud rates (115200, 250000, 500000)
- Check printer firmware (Marlin, Klipper, etc.)

**Container won't start:**
```bash
docker logs octoprint
```

**Need to access files:**
```bash
cd /mnt/nvme/blackroad/octoprint
ls -la config/ data/
```

---

**Full Octavia Docs:** https://github.com/BlackRoad-OS/blackroad-os-operator/blob/main/OCTAVIA_SETUP.md  
**OctoPrint Docs:** https://docs.octoprint.org
