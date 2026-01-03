#!/bin/bash
# BOTTLENECK HUNTER - Find what's ACTUALLY slowing us down!
# Test: PCIe bandwidth, disk I/O, memory bandwidth, Python overhead

echo "═══════════════════════════════════════════════════════════"
echo "  🔍 BOTTLENECK HUNTER - Finding the Stupid Stuff"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 1: PCIe Bandwidth to Hailo-8
echo "TEST 1: PCIe Bandwidth (Hailo-8 Transfer Speed)"
echo "─────────────────────────────────────────────────────────────"
echo "Running ResNet-50 benchmark and measuring transfer rates..."

START=$(date +%s.%N)
hailortcli benchmark resnet_v1_50.hef --time-to-run 5 2>&1 | grep -E "FPS|Latency" | head -3
END=$(date +%s.%N)

ELAPSED=$(echo "$END - $START" | bc)
echo "Total time (including PCIe setup): ${ELAPSED}s"
echo ""

# Test 2: Disk I/O Speed
echo "TEST 2: NVMe Disk I/O Speed"
echo "─────────────────────────────────────────────────────────────"

# Write test
echo "Writing 1GB test file..."
dd if=/dev/zero of=/mnt/nvme/test_write.bin bs=1M count=1024 conv=fdatasync 2>&1 | tail -3

# Read test
echo "Reading 1GB test file..."
dd if=/mnt/nvme/test_write.bin of=/dev/null bs=1M 2>&1 | tail -3

# Cleanup
rm /mnt/nvme/test_write.bin
echo ""

# Test 3: Memory Bandwidth
echo "TEST 3: Memory Bandwidth"
echo "─────────────────────────────────────────────────────────────"
echo "Testing RAM → RAM copy speed..."

# Use sysbench if available, otherwise use dd
if command -v sysbench &> /dev/null; then
    sysbench memory --memory-total-size=1G run | grep -E "transferred|total time"
else
    # Fallback: dd to tmpfs (RAM disk)
    dd if=/dev/zero of=/dev/shm/test_mem.bin bs=1M count=1024 2>&1 | tail -3
    rm /dev/shm/test_mem.bin
fi
echo ""

# Test 4: Python Overhead
echo "TEST 4: Python Import Overhead"
echo "─────────────────────────────────────────────────────────────"
echo "Measuring Python startup + numpy import time..."

START=$(date +%s.%N)
python3 -c "import numpy; import time; import threading; import queue"
END=$(date +%s.%N)

PYTHON_OVERHEAD=$(echo "$END - $START" | bc)
echo "Python + numpy import: ${PYTHON_OVERHEAD}s"
echo ""

# Test 5: Hailo SDK Overhead
echo "TEST 5: Hailo SDK Model Loading Time"
echo "─────────────────────────────────────────────────────────────"
echo "Measuring how long it takes to JUST load a model (no inference)..."

START=$(date +%s.%N)
# Run 0-second benchmark to measure just model load
timeout 3 hailortcli benchmark yolov5s.hef --time-to-run 0 2>&1 > /dev/null || true
END=$(date +%s.%N)

LOAD_TIME=$(echo "$END - $START" | bc)
echo "Model load time (YOLOv5s): ${LOAD_TIME}s"
echo ""

# Test 6: CPU Frequency Scaling
echo "TEST 6: CPU Frequency Scaling Status"
echo "─────────────────────────────────────────────────────────────"

# Check CPU governor
GOVERNOR=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo "N/A")
echo "CPU Governor: $GOVERNOR"

# Check current vs max frequency
CURRENT_FREQ=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null || echo "N/A")
MAX_FREQ=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq 2>/dev/null || echo "N/A")

if [ "$CURRENT_FREQ" != "N/A" ] && [ "$MAX_FREQ" != "N/A" ]; then
    FREQ_PCT=$(echo "scale=1; ($CURRENT_FREQ / $MAX_FREQ) * 100" | bc)
    echo "Current frequency: ${CURRENT_FREQ} kHz (${FREQ_PCT}% of max)"
    echo "Max frequency: ${MAX_FREQ} kHz"
else
    vcgencmd measure_clock arm | awk -F'=' '{print "ARM frequency: " $2/1000000 " MHz"}'
fi
echo ""

# Test 7: USB Bus Speed (for future camera tests)
echo "TEST 7: USB Bus Speed"
echo "─────────────────────────────────────────────────────────────"
lsusb -t | head -10
echo ""

# Test 8: Network Latency (for MQTT/edge mesh)
echo "TEST 8: Network Latency (localhost)"
echo "─────────────────────────────────────────────────────────────"
ping -c 3 -q localhost 2>&1 | tail -2
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  🎯 BOTTLENECK ANALYSIS"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "FINDINGS:"
echo ""
echo "1. PCIe Bandwidth: Check if model load is taking >1s"
echo "2. Disk I/O: Should see >500 MB/s for NVMe"
echo "3. Memory: Should see >1 GB/s transfer"
echo "4. Python Overhead: Should be <0.5s for imports"
echo "5. Model Load: Currently ~11s overhead in switching tests"
echo "6. CPU Scaling: Should be at performance governor"
echo ""

echo "POTENTIAL OPTIMIZATIONS:"
echo ""
echo "❌ If model load >2s: PCIe bottleneck → check power management"
echo "❌ If disk write <300 MB/s: Enable write caching"
echo "❌ If CPU not at max freq: Switch to performance governor"
echo "❌ If Python imports >1s: Consider compiled Cython modules"
echo ""

echo "Temperature check:"
vcgencmd measure_temp

echo ""
echo "System load:"
uptime

echo ""
echo "✅ Bottleneck hunt complete!"
